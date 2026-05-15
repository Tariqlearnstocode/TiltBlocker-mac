import Foundation

enum Scheduler {
    private static let dayMap: [String: Int] = [
        "sun": 1, "mon": 2, "tue": 3, "wed": 4, "thu": 5, "fri": 6, "sat": 7
    ]

    static func activeWindow(in schedule: Schedule, at date: Date) -> TimeWindow? {
        let cal = Calendar(identifier: .gregorian)
        let weekday = cal.component(.weekday, from: date)
        let minutes = cal.component(.hour, from: date) * 60 + cal.component(.minute, from: date)

        for w in schedule.windows {
            let dayMatches = w.days.contains { dayMap[$0.lowercased()] == weekday }
            guard dayMatches else { continue }
            guard let start = parseHHMM(w.start), let end = parseHHMM(w.end) else { continue }
            if minutes >= start && minutes < end { return w }
        }
        return nil
    }

    /// Returns the next upcoming window start in the next 7 days, if any.
    static func nextWindow(in schedule: Schedule, from date: Date) -> TimeWindow? {
        let cal = Calendar(identifier: .gregorian)
        for offset in 0..<7 {
            guard let day = cal.date(byAdding: .day, value: offset, to: date) else { continue }
            let weekday = cal.component(.weekday, from: day)
            for w in schedule.windows {
                guard w.days.contains(where: { dayMap[$0.lowercased()] == weekday }) else { continue }
                guard let start = parseHHMM(w.start) else { continue }
                if offset == 0 {
                    let now = cal.component(.hour, from: date) * 60 + cal.component(.minute, from: date)
                    if start <= now { continue }
                }
                return w
            }
        }
        return nil
    }

    private static func parseHHMM(_ s: String) -> Int? {
        let parts = s.split(separator: ":")
        guard parts.count == 2, let h = Int(parts[0]), let m = Int(parts[1]) else { return nil }
        return h * 60 + m
    }
}
