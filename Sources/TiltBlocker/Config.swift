import Foundation

struct TimeWindow: Codable, Equatable {
    var days: [String]       // ["mon","tue","wed","thu","fri"]
    var start: String        // "09:30"
    var end: String          // "16:00"
}

struct Schedule: Codable {
    var windows: [TimeWindow]
}

enum Config {
    static let dir: URL = {
        let home = FileManager.default.homeDirectoryForCurrentUser
        return home.appendingPathComponent(".tiltblocker", isDirectory: true)
    }()
    static var blocklistFile: URL { dir.appendingPathComponent("blocklist.txt") }
    static var scheduleFile: URL { dir.appendingPathComponent("schedule.json") }
    static var stateFile: URL { dir.appendingPathComponent("state.json") }
    static var setupMarker: URL { dir.appendingPathComponent("setup-complete") }

    static func ensureExists() {
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)

        if !FileManager.default.fileExists(atPath: blocklistFile.path) {
            let sample = """
            # TiltBlocker blocklist — one domain per line, # for comments
            # tradingview.com
            # robinhood.com
            # webull.com
            """
            try? sample.write(to: blocklistFile, atomically: true, encoding: .utf8)
        }

        if !FileManager.default.fileExists(atPath: scheduleFile.path) {
            let sample = Schedule(windows: [
                TimeWindow(days: ["mon","tue","wed","thu","fri"], start: "09:30", end: "16:00")
            ])
            if let data = try? JSONEncoder().encode(sample) {
                try? data.write(to: scheduleFile)
            }
        }
    }

    static func loadBlocklist() -> [String] {
        guard let text = try? String(contentsOf: blocklistFile, encoding: .utf8) else { return [] }
        return text
            .split(separator: "\n")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty && !$0.hasPrefix("#") }
    }

    /// Overwrites the blocklist file. Strips comments other than the header line —
    /// in-app editing is the convenient path; direct file editing is the source-of-truth path.
    static func saveBlocklist(_ domains: [String]) {
        let header = "# TiltBlocker blocklist — one domain per line, # for comments"
        let text = ([header] + domains).joined(separator: "\n") + "\n"
        try? text.write(to: blocklistFile, atomically: true, encoding: .utf8)
    }

    static func loadSchedule() -> Schedule {
        guard let data = try? Data(contentsOf: scheduleFile),
              let s = try? JSONDecoder().decode(Schedule.self, from: data) else {
            return Schedule(windows: [])
        }
        return s
    }
}

// Persisted active-lockout state, so quitting the app doesn't drop a lockout
struct LockoutState: Codable {
    var endsAt: Date
}

enum StateStore {
    static func read() -> LockoutState? {
        guard let data = try? Data(contentsOf: Config.stateFile),
              let s = try? JSONDecoder().decode(LockoutState.self, from: data) else { return nil }
        if s.endsAt <= Date() { return nil }
        return s
    }

    static func write(_ state: LockoutState?) {
        if let state {
            if let data = try? JSONEncoder().encode(state) {
                try? data.write(to: Config.stateFile)
            }
        } else {
            try? FileManager.default.removeItem(at: Config.stateFile)
        }
    }
}
