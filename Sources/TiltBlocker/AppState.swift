import Foundation
import SwiftUI

@MainActor
final class AppState: ObservableObject {
    @Published var isLocked: Bool = false
    @Published var lockoutEndsAt: Date? = nil
    @Published var blocklist: [String] = []
    @Published var schedule: Schedule = Schedule(windows: [])
    @Published var nextWindow: TimeWindow? = nil
    @Published var lastError: String? = nil

    // Setup state
    @Published var isSetUp: Bool = false

    // Transient: code currently emailed to partner, awaiting entry. Cleared on app quit.
    @Published var pendingCodeIssuedAt: Date? = nil
    private var pendingCodeHash: String? = nil

    private var tick: Timer?

    init() {
        Config.ensureExists()
        reloadConfig()
        isSetUp = Keychain.get(SetupKeys.partnerEmail) != nil
            && Keychain.get(SetupKeys.resendKey) != nil

        // Restore active lockout if app was quit during one
        if let s = StateStore.read() {
            self.lockoutEndsAt = s.endsAt
            self.isLocked = true
        } else {
            // Make sure /etc/hosts has no stale entries from prior runs
            if Blocker.isCurrentlyApplied() {
                try? Blocker.apply(domains: [])
            }
        }

        startTicker()
    }

    func reloadConfig() {
        blocklist = Config.loadBlocklist()
        schedule = Config.loadSchedule()
        nextWindow = Scheduler.nextWindow(in: schedule, from: Date())
    }

    private func startTicker() {
        tick?.invalidate()
        tick = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.tickNow() }
        }
        tickNow()
    }

    func tickNow() {
        // Check scheduled window
        let now = Date()
        let inWindow = Scheduler.activeWindow(in: schedule, at: now)
        let manualEnds = lockoutEndsAt

        let shouldBeLocked: Bool
        if let manualEnds, manualEnds > now {
            shouldBeLocked = true
        } else if inWindow != nil {
            shouldBeLocked = true
        } else {
            shouldBeLocked = false
            if manualEnds != nil { // manual ended, clear it
                lockoutEndsAt = nil
                StateStore.write(nil)
            }
        }

        if shouldBeLocked != isLocked {
            applyLock(shouldBeLocked)
        }
        nextWindow = Scheduler.nextWindow(in: schedule, from: now)
    }

    private func applyLock(_ lock: Bool) {
        do {
            try Blocker.apply(domains: lock ? blocklist : [])
            isLocked = lock
            lastError = nil
        } catch {
            lastError = "Block failed: \(error.localizedDescription)"
        }
    }

    // MARK: - User actions

    func startManualLockout(minutes: Int) {
        let ends = Date().addingTimeInterval(TimeInterval(minutes * 60))
        lockoutEndsAt = ends
        StateStore.write(LockoutState(endsAt: ends))
        applyLock(true)
    }

    func endLockoutWithPassword(_ code: String) -> Bool {
        guard let hash = pendingCodeHash else { return false }
        guard Hash.verify(code, against: hash) else { return false }
        pendingCodeHash = nil
        pendingCodeIssuedAt = nil
        lockoutEndsAt = nil
        StateStore.write(nil)
        applyLock(false)
        return true
    }

    /// Generates a one-time code, emails it to the partner, and stores the hash in memory.
    /// Called when the user clicks Emergency Override. Throws if email fails.
    func requestEmergencyCode() async throws {
        guard let email = Keychain.get(SetupKeys.partnerEmail),
              let apiKey = Keychain.get(SetupKeys.resendKey) else {
            throw ResendError.missingConfig
        }
        let from = Keychain.get(SetupKeys.resendFrom) ?? "TiltBlocker <onboarding@resend.dev>"
        let code = generatePassword(length: 10)
        let client = ResendClient(apiKey: apiKey, fromAddress: from)
        try await client.send(
            to: email,
            subject: EmailTemplates.emergencyCodeSubject(),
            body: EmailTemplates.emergencyCodeBody(code: code)
        )
        pendingCodeHash = Hash.make(code)
        pendingCodeIssuedAt = Date()
    }

    /// First-run setup. Emails a welcome message to the partner explaining the app + their role.
    /// Saves credentials only if the welcome email succeeds, so a failed setup isn't a silent half-state.
    func completeSetup(partnerEmail: String, resendApiKey: String, fromAddress: String) async throws {
        let client = ResendClient(apiKey: resendApiKey, fromAddress: fromAddress)
        try await client.send(
            to: partnerEmail,
            subject: EmailTemplates.partnerWelcomeSubject(),
            body: EmailTemplates.partnerWelcomeBody()
        )
        Keychain.set(SetupKeys.partnerEmail, partnerEmail)
        Keychain.set(SetupKeys.resendKey, resendApiKey)
        Keychain.set(SetupKeys.resendFrom, fromAddress)
        isSetUp = true
    }

    /// Changes the partner email. Refused if a lockout is active.
    /// Sends welcome to the new partner (required). Best-effort notice to the old partner.
    func changePartner(to newEmail: String) async throws {
        guard !isLocked else {
            throw NSError(domain: "TiltBlocker", code: 1,
                userInfo: [NSLocalizedDescriptionKey: "Cannot change partner during an active lockout."])
        }
        guard let apiKey = Keychain.get(SetupKeys.resendKey) else {
            throw ResendError.missingConfig
        }
        let oldEmail = Keychain.get(SetupKeys.partnerEmail)
        let from = Keychain.get(SetupKeys.resendFrom) ?? "TiltBlocker <onboarding@resend.dev>"
        let client = ResendClient(apiKey: apiKey, fromAddress: from)

        // Required: welcome new partner. If this fails, abort — don't end up in a state
        // where the old partner is fired but the new one doesn't know they're in.
        try await client.send(
            to: newEmail,
            subject: EmailTemplates.partnerWelcomeSubject(),
            body: EmailTemplates.partnerWelcomeBody()
        )

        Keychain.set(SetupKeys.partnerEmail, newEmail)

        // Best-effort: tell the old partner they've been replaced.
        if let oldEmail, oldEmail != newEmail {
            try? await client.send(
                to: oldEmail,
                subject: EmailTemplates.partnerReplacedSubject(),
                body: EmailTemplates.partnerReplacedBody(newEmail: newEmail)
            )
        }
    }
}
