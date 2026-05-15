import Foundation

enum Blocker {
    static let startMarker = "# === TILTBLOCKER START ==="
    static let endMarker = "# === TILTBLOCKER END ==="
    static let hostsPath = "/etc/hosts"

    /// Apply (or clear) the blocklist to /etc/hosts via a single privileged shell call.
    /// `domains` empty means "clear all TiltBlocker entries".
    static func apply(domains: [String]) throws {
        let block = renderBlock(domains: domains)
        let script = """
        /usr/bin/awk 'BEGIN{skip=0} /^# === TILTBLOCKER START ===$/{skip=1; next} /^# === TILTBLOCKER END ===$/{skip=0; next} skip==0{print}' /etc/hosts > /tmp/tiltblocker.hosts.tmp
        cat /tmp/tiltblocker.hosts.tmp > /etc/hosts
        rm -f /tmp/tiltblocker.hosts.tmp
        \(domains.isEmpty ? "" : "printf '%s\\n' '\(block.replacingOccurrences(of: "'", with: "'\\''"))' >> /etc/hosts")
        /usr/bin/dscacheutil -flushcache
        /usr/bin/killall -HUP mDNSResponder 2>/dev/null || true
        """
        try runAsAdmin(script: script)
    }

    private static func renderBlock(domains: [String]) -> String {
        var lines = [startMarker]
        for d in domains {
            let clean = d.lowercased().trimmingCharacters(in: .whitespaces)
            guard !clean.isEmpty else { continue }
            lines.append("0.0.0.0 \(clean)")
            if !clean.hasPrefix("www.") {
                lines.append("0.0.0.0 www.\(clean)")
            }
        }
        lines.append(endMarker)
        return lines.joined(separator: "\n")
    }

    /// Run a shell script with admin privileges via AppleScript. Triggers macOS auth prompt.
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
