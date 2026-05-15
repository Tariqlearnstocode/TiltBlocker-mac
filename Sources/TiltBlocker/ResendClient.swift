import Foundation

enum ResendError: Error {
    case missingConfig
    case http(Int, String)
}

struct ResendClient {
    let apiKey: String
    let fromAddress: String  // e.g. "TiltBlocker <onboarding@resend.dev>"

    func send(to: String, subject: String, body: String) async throws {
        var req = URLRequest(url: URL(string: "https://api.resend.com/emails")!)
        req.httpMethod = "POST"
        req.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "from": fromAddress,
            "to": [to],
            "subject": subject,
            "text": body
        ]
        req.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, resp) = try await URLSession.shared.data(for: req)
        let code = (resp as? HTTPURLResponse)?.statusCode ?? 0
        if !(200..<300).contains(code) {
            let msg = String(data: data, encoding: .utf8) ?? ""
            throw ResendError.http(code, msg)
        }
    }
}

enum SetupKeys {
    static let resendKey = "resend_api_key"
    static let partnerEmail = "partner_email"
    static let resendFrom = "resend_from"
}

/// The user's display name as macOS knows it (e.g. "Jane Doe").
/// Falls back to the short username if no full name is set on the account.
var userDisplayName: String {
    let full = NSFullUserName()
    return full.isEmpty ? NSUserName() : full
}

enum EmailTemplates {
    static func partnerWelcomeSubject() -> String {
        "You're \(userDisplayName)'s TiltBlocker accountability partner"
    }

    static func partnerWelcomeBody() -> String {
        let name = userDisplayName
        return """
        Hey,

        \(name) just added you as their accountability partner for TiltBlocker — a small tool they run on their Mac to lock themselves out of trading websites during market hours (or for set durations when they don't trust their own impulse control).

        HOW THE APP WORKS
        TiltBlocker sits in their menu bar. During scheduled windows or manual lockouts, it blocks sites like TradingView, brokers, etc. from loading on their Mac. There's only one way to end a lockout early: clicking "Emergency Override."

        WHEN YOU'LL GET EMAILS FROM IT
        Every time they hit Emergency Override, the app:
          1. Generates a fresh one-time 10-character code
          2. Emails it to you (this address)
          3. Starts a 60-second timer they can't skip
          4. They then have to message you and ask for the code

        YOUR ROLE
        If they ask you for the code, you're the gatekeeper. You can:
          • Send it to them (if you think they actually need it)
          • Refuse, or make them explain why first
          • Just ignore them until they calm down
        There's no obligation. The whole point is that having to ask another human is friction. Codes are one-time use; if they want another, a fresh one shows up in your inbox.

        WHAT YOU DON'T NEED TO DO
          • Install anything
          • Create any account
          • Respond to this email

        You may also occasionally get an email saying they've removed you as partner — that just means they've replaced you with someone else. Normal.

        Thanks for being their sanity check.
        """
    }

    static func emergencyCodeSubject() -> String {
        "TiltBlocker emergency code"
    }

    static func emergencyCodeBody(code: String) -> String {
        """
        Hey,

        \(userDisplayName) just hit Emergency Override on TiltBlocker. They'll ask you for the code below to end an active lockout early. Send it back only if you think they actually need it.

        Code: \(code)

        This code is one-time use and only valid until they request another.
        """
    }

    static func partnerReplacedSubject() -> String {
        "You're no longer \(userDisplayName)'s TiltBlocker partner"
    }

    static func partnerReplacedBody(newEmail: String) -> String {
        """
        Hey,

        \(userDisplayName) just removed you as their TiltBlocker accountability partner and replaced you with \(newEmail). If this is unexpected, you may want to check in with them.
        """
    }
}

/// Generate a random N-char password from an unambiguous alphabet.
func generatePassword(length: Int = 16) -> String {
    let alphabet = Array("ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789")
    var bytes = [UInt8](repeating: 0, count: length)
    _ = SecRandomCopyBytes(kSecRandomDefault, length, &bytes)
    return String(bytes.map { alphabet[Int($0) % alphabet.count] })
}
