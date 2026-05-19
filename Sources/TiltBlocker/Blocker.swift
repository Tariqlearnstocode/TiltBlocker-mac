import Foundation

enum Blocker {
    static let startMarker = "# === TILTBLOCKER START ==="
    static let endMarker = "# === TILTBLOCKER END ==="
    static let hostsPath = "/etc/hosts"
    static let scriptPath = "/usr/local/bin/tiltblocker-update-hosts.sh"
    static let sudoersPath = "/etc/sudoers.d/tiltblocker"

    // The bash helper. Validated input, only touches the TiltBlocker block in /etc/hosts.
    // Installed once at /usr/local/bin/tiltblocker-update-hosts.sh and invoked via passwordless sudo.
    private static let helperScript = #"""
    #!/bin/bash
    # TiltBlocker hosts updater. Reads validated domains from stdin (one per line),
    # rewrites only the TILTBLOCKER block in /etc/hosts, flushes DNS. Refuses everything else.
    set -euo pipefail

    HOSTS=/etc/hosts
    START_MARKER="# === TILTBLOCKER START ==="
    END_MARKER="# === TILTBLOCKER END ==="
    TMP="$(mktemp)"
    trap 'rm -f "$TMP"' EXIT

    DOMAINS=()
    while IFS= read -r line; do
        # Strict allowlist: lowercase/upper alphanum, dots, hyphens. Max length 253 (DNS limit).
        if [[ "$line" =~ ^[a-zA-Z0-9.-]+$ ]] && [ ${#line} -le 253 ]; then
            DOMAINS+=("$line")
        fi
    done

    # Strip any existing TiltBlocker block
    /usr/bin/awk -v start="$START_MARKER" -v end="$END_MARKER" '
        $0 == start { skip=1; next }
        $0 == end { skip=0; next }
        skip != 1 { print }
    ' "$HOSTS" > "$TMP"

    # Append fresh block if any domains supplied
    if [ ${#DOMAINS[@]} -gt 0 ]; then
        {
            echo "$START_MARKER"
            for d in "${DOMAINS[@]}"; do
                echo "0.0.0.0 $d"
            done
            echo "$END_MARKER"
        } >> "$TMP"
    fi

    cat "$TMP" > "$HOSTS"

    /usr/bin/dscacheutil -flushcache
    /usr/bin/killall -HUP mDNSResponder 2>/dev/null || true
    """#

    static func isHelperInstalled() -> Bool {
        FileManager.default.fileExists(atPath: scriptPath)
            && FileManager.default.fileExists(atPath: sudoersPath)
    }

    /// Installs the helper script + sudoers entry. Triggers a single osascript admin prompt.
    /// Idempotent — safe to call when already installed.
    static func installHelper() throws {
        let tmpURL = URL(fileURLWithPath: NSTemporaryDirectory())
            .appendingPathComponent("tiltblocker-helper-\(UUID().uuidString).sh")
        try helperScript.write(to: tmpURL, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(at: tmpURL) }

        let user = NSUserName()
        let installScript = """
        set -e
        /bin/mkdir -p /usr/local/bin
        /bin/cp '\(tmpURL.path)' '\(scriptPath)'
        /usr/sbin/chown root:wheel '\(scriptPath)'
        /bin/chmod 755 '\(scriptPath)'

        /bin/echo '\(user) ALL=(ALL) NOPASSWD: \(scriptPath)' > '\(sudoersPath)'
        /usr/sbin/chown root:wheel '\(sudoersPath)'
        /bin/chmod 440 '\(sudoersPath)'

        # Validate sudoers — if malformed, this errors out and the entry isn't trusted.
        /usr/sbin/visudo -c -f '\(sudoersPath)' >/dev/null
        """
        try runAsAdmin(script: installScript)
    }

    /// Apply (or clear) the blocklist to /etc/hosts. Empty domains = clear.
    /// Uses the passwordless sudo helper if installed; otherwise installs the helper first.
    static func apply(domains: [String]) throws {
        if !isHelperInstalled() {
            try installHelper()
        }

        // Validation mirrors what the helper script enforces — defensive, not authoritative.
        let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyz0123456789.-")
        var stdinLines: [String] = []
        for raw in domains {
            let clean = raw.lowercased().trimmingCharacters(in: .whitespaces)
            guard !clean.isEmpty, clean.count <= 253 else { continue }
            guard clean.unicodeScalars.allSatisfy({ allowed.contains($0) }) else { continue }
            stdinLines.append(clean)
            if !clean.hasPrefix("www.") {
                stdinLines.append("www.\(clean)")
            }
        }
        let stdin = stdinLines.joined(separator: "\n") + "\n"

        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: "/usr/bin/sudo")
        // -n: non-interactive. If sudoers isn't set up, fail immediately instead of hanging on a prompt.
        proc.arguments = ["-n", scriptPath]

        let inPipe = Pipe()
        let errPipe = Pipe()
        proc.standardInput = inPipe
        proc.standardError = errPipe
        proc.standardOutput = Pipe()

        try proc.run()
        inPipe.fileHandleForWriting.write(Data(stdin.utf8))
        try inPipe.fileHandleForWriting.close()
        proc.waitUntilExit()

        let stderrText = String(
            data: errPipe.fileHandleForReading.readDataToEndOfFile(),
            encoding: .utf8) ?? ""

        if proc.terminationStatus != 0 {
            throw NSError(domain: "Blocker", code: Int(proc.terminationStatus),
                          userInfo: [NSLocalizedDescriptionKey:
                            "Helper exited \(proc.terminationStatus): \(stderrText.isEmpty ? "no stderr" : stderrText)"])
        }

        // Verify /etc/hosts actually reflects what we asked for.
        // Catches silent failures where the script exits 0 but didn't write.
        let hostsContent = (try? String(contentsOfFile: hostsPath, encoding: .utf8)) ?? ""
        let blockPresent = hostsContent.contains(startMarker)
        let expected = !stdinLines.isEmpty
        if blockPresent != expected {
            throw NSError(domain: "Blocker", code: 99, userInfo: [
                NSLocalizedDescriptionKey:
                    "Verification failed: /etc/hosts \(blockPresent ? "still has" : "missing") TiltBlocker block "
                    + "(expected \(expected ? "present" : "absent")). stderr: \(stderrText)"
            ])
        }
    }

    /// Run a shell script with admin privileges via AppleScript. Triggers macOS auth prompt.
    /// Used only for one-time helper install.
    private static func runAsAdmin(script: String) throws {
        let escaped = script
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
        let osa = "do shell script \"\(escaped)\" with administrator privileges"

        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
        proc.arguments = ["-e", osa]

        let errPipe = Pipe()
        proc.standardError = errPipe
        proc.standardOutput = Pipe()

        try proc.run()
        proc.waitUntilExit()

        if proc.terminationStatus != 0 {
            let errData = errPipe.fileHandleForReading.readDataToEndOfFile()
            let msg = String(data: errData, encoding: .utf8) ?? "unknown error"
            throw NSError(domain: "Blocker", code: Int(proc.terminationStatus),
                          userInfo: [NSLocalizedDescriptionKey: msg])
        }
    }

    /// Quick check of whether TiltBlocker has entries in /etc/hosts right now.
    static func isCurrentlyApplied() -> Bool {
        guard let text = try? String(contentsOfFile: hostsPath, encoding: .utf8) else { return false }
        return text.contains(startMarker)
    }
}
