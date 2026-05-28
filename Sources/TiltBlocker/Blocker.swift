import Foundation

enum Blocker {
    static let startMarker = "# === TILTBLOCKER START ==="
    static let endMarker = "# === TILTBLOCKER END ==="
    static let hostsPath = "/etc/hosts"
    static let scriptPath = "/usr/local/bin/tiltblocker-update-hosts.sh"
    static let sudoersPath = "/etc/sudoers.d/tiltblocker"

    // Bump when helperScript changes so installed copies get re-installed.
    static let helperVersion = "2"
    static let versionMarker = "# TILTBLOCKER-HELPER-VERSION:"

    // The privileged bash helper. Reads "BLOCK" or "CLEAR" on line 1, then validated
    // domains (one per line). Maintains BOTH the TILTBLOCKER block in /etc/hosts and a
    // pf firewall anchor that drops traffic to the domains' resolved IPs.
    //
    // Why pf as well: /etc/hosts only governs the system resolver. Chrome (and other
    // Chromium browsers) keep their own in-process DNS cache, so a domain that was just
    // open resolves from that cache and connects directly, ignoring /etc/hosts entirely.
    // pf blocks at the IP layer — it doesn't care how the address was resolved.
    // Installed at scriptPath, invoked via passwordless sudo.
    private static let helperScript = #"""
    #!/bin/bash
    # TILTBLOCKER-HELPER-VERSION: 2
    set -uo pipefail

    HOSTS=/etc/hosts
    START_MARKER="# === TILTBLOCKER START ==="
    END_MARKER="# === TILTBLOCKER END ==="
    ANCHOR="tiltblocker"
    PF_RULES="/etc/pf.anchors/tiltblocker.rules"
    PF_MAIN="/etc/pf.anchors/tiltblocker.conf"
    PF_STATE="/var/db/tiltblocker.pf-was-enabled"
    DIG=/usr/bin/dig
    PFCTL=/sbin/pfctl

    read -r MODE || MODE=""

    DOMAINS=()
    while IFS= read -r line; do
        # Strict allowlist: alphanum, dots, hyphens. Max length 253 (DNS limit).
        if [[ "$line" =~ ^[a-zA-Z0-9.-]+$ ]] && [ ${#line} -le 253 ]; then
            DOMAINS+=("$line")
        fi
    done

    strip_hosts_block() {
        local tmp; tmp="$(mktemp)"
        /usr/bin/awk -v s="$START_MARKER" -v e="$END_MARKER" '
            $0==s{skip=1;next} $0==e{skip=0;next} skip!=1{print}' "$HOSTS" > "$tmp"
        cat "$tmp" > "$HOSTS"
        rm -f "$tmp"
    }

    flush_dns() {
        /usr/bin/dscacheutil -flushcache 2>/dev/null || true
        /usr/bin/killall -HUP mDNSResponder 2>/dev/null || true
    }

    do_block() {
        strip_hosts_block
        if [ ${#DOMAINS[@]} -eq 0 ]; then
            flush_dns
            return 0
        fi

        # 1) /etc/hosts block (covers Safari + anything using the system resolver).
        {
            echo "$START_MARKER"
            for d in "${DOMAINS[@]}"; do echo "0.0.0.0 $d"; done
            echo "$END_MARKER"
        } >> "$HOSTS"
        flush_dns

        # 2) Resolve REAL IPs via external resolvers. dig never consults /etc/hosts,
        #    so this returns the true addresses even with the 0.0.0.0 block in place.
        local all=""
        for d in "${DOMAINS[@]}"; do
            all="$all
    $("$DIG" +short +time=2 +tries=1 @1.1.1.1 "$d" A 2>/dev/null)
    $("$DIG" +short +time=2 +tries=1 @8.8.8.8 "$d" A 2>/dev/null)"
        done
        local ips
        ips="$(printf "%s\n" "$all" | /usr/bin/grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | sort -u)"

        # 3) pf anchor rules — drop everything to those IPs.
        : > "$PF_RULES"
        if [ -n "$ips" ]; then
            while read -r ip; do
                echo "block drop out quick from any to $ip" >> "$PF_RULES"
            done <<< "$ips"
        fi

        # 4) Full ruleset preserving Apple's anchors + ours, then enable & load.
        cat > "$PF_MAIN" <<EOF
    scrub-anchor "com.apple/*"
    nat-anchor "com.apple/*"
    rdr-anchor "com.apple/*"
    dummynet-anchor "com.apple/*"
    anchor "com.apple/*"
    load anchor "com.apple" from "/etc/pf.anchors/com.apple"
    anchor "$ANCHOR"
    load anchor "$ANCHOR" from "$PF_RULES"
    EOF

        # Remember whether pf was already on (once), so CLEAR won't disable someone else's pf.
        if [ ! -f "$PF_STATE" ]; then
            if "$PFCTL" -s info 2>/dev/null | /usr/bin/grep -q "Status: Enabled"; then
                echo yes > "$PF_STATE"
            else
                echo no > "$PF_STATE"
            fi
        fi
        "$PFCTL" -f "$PF_MAIN" 2>/dev/null || true
        "$PFCTL" -e 2>/dev/null || true

        # 5) Sever live connections to those IPs so cached sockets can't keep loading.
        if [ -n "$ips" ]; then
            while read -r ip; do
                "$PFCTL" -k "$ip" 2>/dev/null || true
            done <<< "$ips"
        fi
        return 0
    }

    do_clear() {
        strip_hosts_block
        flush_dns
        "$PFCTL" -a "$ANCHOR" -F rules 2>/dev/null || true
        "$PFCTL" -f /etc/pf.conf 2>/dev/null || true
        # Only disable pf if we were the ones who turned it on.
        if [ -f "$PF_STATE" ] && /usr/bin/grep -q no "$PF_STATE"; then
            "$PFCTL" -d 2>/dev/null || true
        fi
        rm -f "$PF_STATE" "$PF_RULES" "$PF_MAIN"
        return 0
    }

    case "$MODE" in
        BLOCK) do_block ;;
        CLEAR) do_clear ;;
        *) echo "tiltblocker: unknown mode '$MODE'" >&2; exit 1 ;;
    esac
    exit 0
    """#

    static func isHelperInstalled() -> Bool {
        guard FileManager.default.fileExists(atPath: scriptPath),
              FileManager.default.fileExists(atPath: sudoersPath),
              let contents = try? String(contentsOfFile: scriptPath, encoding: .utf8)
        else { return false }
        // Treat an out-of-date helper as "not installed" so it gets re-installed.
        return contents.contains("\(versionMarker) \(helperVersion)")
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
        // Line 1 is the mode; the helper applies hosts + pf for BLOCK, tears both down for CLEAR.
        let mode = stdinLines.isEmpty ? "CLEAR" : "BLOCK"
        let stdin = ([mode] + stdinLines).joined(separator: "\n") + "\n"

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

    // Scriptable browsers we can ask to close individual tabs. Best-effort:
    // ones not running / not installed / not scriptable are silently skipped.
    static let scriptableBrowsers = [
        "Safari", "Google Chrome", "Brave Browser", "Microsoft Edge", "Vivaldi", "Arc",
    ]

    /// Closes only the open browser tabs pointing at a blocked domain. The browser and all
    /// other tabs are left alone. This severs the live socket an already-open tab is holding —
    /// /etc/hosts alone can't, since it only governs *new* DNS lookups. Reopening the site
    /// then hits the 0.0.0.0 block. First run triggers a one-time macOS Automation prompt
    /// per browser; if denied, this is a no-op for that browser.
    static func closeBlockedTabs(domains: [String]) {
        // Strict allowlist BEFORE interpolating into AppleScript — blocks script injection.
        let allowed = Set("abcdefghijklmnopqrstuvwxyz0123456789.-")
        let cleaned = domains
            .map { $0.lowercased().trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty && $0.allSatisfy { allowed.contains($0) } }
        guard !cleaned.isEmpty else { return }
        let listLiteral = cleaned.map { "\"\($0)\"" }.joined(separator: ", ")

        // Off-main: the macOS Automation prompt is modal — osascript blocks until you click,
        // and we don't want that to freeze the menu bar UI or app launch.
        DispatchQueue.global(qos: .userInitiated).async {
            runCloseScripts(listLiteral: listLiteral)
        }
    }

    private static func runCloseScripts(listLiteral: String) {
        for app in scriptableBrowsers {
            // Match the domain in the URL's host: "//domain" (bare host) or ".domain" (www/subdomain).
            // Iterate tabs high->low so closing one doesn't shift indices we haven't visited.
            let script = """
            set blocked to {\(listLiteral)}
            if not (application "\(app)" is running) then return
            tell application "\(app)"
              repeat with w in windows
                repeat with i from (count of tabs of w) to 1 by -1
                  set u to ""
                  try
                    set u to (URL of tab i of w) as text
                  end try
                  repeat with d in blocked
                    set ds to (d as text)
                    if (u contains ("//" & ds)) or (u contains ("." & ds)) then
                      try
                        close tab i of w
                      end try
                      exit repeat
                    end if
                  end repeat
                end repeat
              end repeat
            end tell
            """
            let proc = Process()
            proc.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
            proc.arguments = ["-e", script]
            proc.standardOutput = Pipe()
            proc.standardError = Pipe()
            try? proc.run()
            proc.waitUntilExit()
        }
    }

    /// Quick check of whether TiltBlocker has entries in /etc/hosts right now.
    static func isCurrentlyApplied() -> Bool {
        guard let text = try? String(contentsOfFile: hostsPath, encoding: .utf8) else { return false }
        return text.contains(startMarker)
    }
}
