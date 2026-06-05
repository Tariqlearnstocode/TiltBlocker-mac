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
    @Published var helperInstalled: Bool = false

    // Transient: code currently emailed to partner, awaiting entry. Cleared on app quit.
    @Published var pendingCodeIssuedAt: Date? = nil
    private var pendingCodeHash: String? = nil

    // True while a manual lockout is being applied (the privileged helper runs DNS
    // lookups + pfctl, which can take several seconds). Drives an intentional spinner
    // so the UI stays responsive instead of beachballing on the main thread.
    @Published var isLocking: Bool = false

    private var tick: Timer?

    init() {
        Config.ensureExists()
        reloadConfig()
        // Check the local marker file instead of reading Keychain — avoids "Always Allow"
        // prompts on every launch (Keychain re-asks whenever the app's signature changes).
        // Keychain reads happen lazily, only when we actually need to send an email.
        isSetUp = FileManager.default.fileExists(atPath: Config.setupMarker.path)
        helperInstalled = Blocker.isHelperInstalled()

        // Install the privileged helper at launch — one admin prompt, ever.
        // All future hosts edits are passwordless. If user cancels, button in UI lets them retry.
        if !helperInstalled {
            Task { @MainActor in
                // The lockout-restore path below may have already (re)installed it
                // synchronously — re-check so we don't fire a second admin prompt.
                if Blocker.isHelperInstalled() {
                    helperInstalled = true
                    return
                }
                do {
                    try Blocker.installHelper()
                    helperInstalled = true
                } catch {
                    lastError = "Helper install failed: \(error.localizedDescription)"
                }
            }
        }

        // Restore active lockout if app was quit during one
        if let s = StateStore.read() {
            self.lockoutEndsAt = s.endsAt
            self.isLocked = true
            // Re-establish the block on relaunch. pf rules don't survive a reboot, and the
            // ticker won't re-apply (it only acts on isLocked transitions), so do it here.
            // Hosts block synchronously (fast) for immediate effect; pf hardening in the
            // background so app launch isn't blocked on DNS lookups.
            let restoreDomains = blocklist
            try? Blocker.applyHosts(domains: restoreDomains)
            Task.detached(priority: .utility) {
                try? Blocker.applyFirewall(domains: restoreDomains)
            }
            // Sever any blocked tab that was left open before the restart/relaunch.
            Blocker.closeBlockedTabs(domains: blocklist)
        } else {
            // Make sure /etc/hosts has no stale entries from prior runs
            if Blocker.isCurrentlyApplied() {
                try? Blocker.apply(domains: [])
            }
        }

        startTicker()
    }

    func installHelper() {
        do {
            try Blocker.installHelper()
            helperInstalled = true
            lastError = nil
        } catch {
            lastError = "Helper install failed: \(error.localizedDescription)"
        }
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
        let wasLocked = isLocked
        do {
            try Blocker.apply(domains: lock ? blocklist : [])
            // Only on the unlocked -> locked transition, so re-applying the hosts file
            // (e.g. adding a domain mid-lockout) doesn't keep closing tabs repeatedly.
            if lock && !wasLocked { Blocker.closeBlockedTabs(domains: blocklist) }
            isLocked = lock
            lastError = nil
        } catch {
            lastError = "Block failed: \(error.localizedDescription)"
        }
    }

    // MARK: - User actions

    func addDomain(_ raw: String) {
        let clean = raw.trimmingCharacters(in: .whitespaces).lowercased()
            .replacingOccurrences(of: "https://", with: "")
            .replacingOccurrences(of: "http://", with: "")
        guard !clean.isEmpty, !blocklist.contains(clean) else { return }
        blocklist.append(clean)
        Config.saveBlocklist(blocklist)
        // Re-apply with the new domain included, mid-lockout. Use the fast hosts write so the
        // UI doesn't freeze; harden pf in the background. (Adding mid-lockout is allowed —
        // only *removing* is blocked.)
        if isLocked {
            let domains = blocklist
            Task {
                do {
                    try await Task.detached(priority: .userInitiated) {
                        try Blocker.applyHosts(domains: domains)
                    }.value
                    lastError = nil
                } catch {
                    lastError = "Block failed: \(error.localizedDescription)"
                }
                Task.detached(priority: .utility) {
                    try? Blocker.applyFirewall(domains: domains)
                }
            }
        }
    }

    /// Removing is disabled during an active lockout — that would be a trivial bypass.
    func removeDomain(_ domain: String) {
        guard !isLocked else { return }
        blocklist.removeAll { $0 == domain }
        Config.saveBlocklist(blocklist)
    }

    func startManualLockout(minutes: Int) {
        guard !isLocking else { return }
        isLocking = true
        lastError = nil
        let domains = blocklist

        Task {
            // 1) FAST: apply only the /etc/hosts block. No DNS lookups, returns near-instantly.
            //    This is what makes the lockout effective, so the timer can start right away.
            do {
                try await Task.detached(priority: .userInitiated) {
                    try Blocker.applyHosts(domains: domains)
                }.value
            } catch {
                isLocking = false
                lastError = "Lockout failed: \(error.localizedDescription)"
                return
            }

            // 2) Lock is in force — flip the UI and start the countdown immediately.
            let ends = Date().addingTimeInterval(TimeInterval(minutes * 60))
            lockoutEndsAt = ends
            StateStore.write(LockoutState(endsAt: ends))
            isLocked = true
            isLocking = false
            lastError = nil

            // 3) SLOW, in the background: pf firewall hardening (catches Chromium DNS-cache
            //    bypass) + close any live tabs already on a blocked site. The lockout is
            //    already active via /etc/hosts, so the user never waits on this.
            Task.detached(priority: .utility) {
                try? Blocker.applyFirewall(domains: domains)
            }
            Blocker.closeBlockedTabs(domains: domains)
        }
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
        let from = Keychain.get(SetupKeys.resendFrom) ?? "TiltBlocker <clarence@claudecoworkcourse.com>"
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
        try? Data().write(to: Config.setupMarker)  // local marker, no Keychain read at launch
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
        let from = Keychain.get(SetupKeys.resendFrom) ?? "TiltBlocker <clarence@claudecoworkcourse.com>"
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
