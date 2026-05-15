import SwiftUI

struct ContentView: View {
    @EnvironmentObject var state: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if !state.isSetUp {
                SetupView()
            } else {
                MainView()
            }
        }
        .padding(14)
    }
}

// MARK: - Main view

private struct MainView: View {
    @EnvironmentObject var state: AppState
    @State private var durationMinutes: Int = 60
    @State private var showEmergency = false
    @State private var showChangePartner = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: state.isLocked ? "lock.fill" : "lock.open")
                    .foregroundColor(state.isLocked ? .red : .green)
                Text(state.isLocked ? "Locked" : "Unlocked")
                    .font(.headline)
                Spacer()
                Button {
                    state.reloadConfig()
                    state.tickNow()
                } label: { Image(systemName: "arrow.clockwise") }
                .buttonStyle(.plain)
            }

            if let ends = state.lockoutEndsAt {
                Text("Ends \(ends.formatted(date: .omitted, time: .shortened))")
                    .font(.caption).foregroundColor(.secondary)
            } else if let next = state.nextWindow {
                Text("Next window: \(next.days.joined(separator: ",")) \(next.start)–\(next.end)")
                    .font(.caption).foregroundColor(.secondary)
            }

            Divider()

            Text("Blocking \(state.blocklist.count) domains").font(.caption)
            ScrollView {
                VStack(alignment: .leading, spacing: 2) {
                    ForEach(state.blocklist, id: \.self) { d in
                        Text(d).font(.system(.caption, design: .monospaced))
                    }
                    if state.blocklist.isEmpty {
                        Text("Edit ~/.tiltblocker/blocklist.txt").font(.caption2).foregroundColor(.secondary)
                    }
                }
            }
            .frame(maxHeight: 80)

            Divider()

            if state.isLocked {
                Button("Emergency Override…", role: .destructive) {
                    showEmergency = true
                }
                .sheet(isPresented: $showEmergency) {
                    EmergencyView().environmentObject(state)
                }
            } else {
                HStack {
                    Picker("", selection: $durationMinutes) {
                        Text("15 min").tag(15)
                        Text("30 min").tag(30)
                        Text("1 h").tag(60)
                        Text("2 h").tag(120)
                        Text("4 h").tag(240)
                        Text("8 h").tag(480)
                        Text("24 h").tag(1440)
                    }
                    .labelsHidden()
                    Button("Lock") {
                        state.startManualLockout(minutes: durationMinutes)
                    }
                    .buttonStyle(.borderedProminent)
                }
            }

            if let err = state.lastError {
                Text(err).font(.caption).foregroundColor(.red)
            }

            Divider()
            HStack {
                Button("Open config folder") {
                    NSWorkspace.shared.open(Config.dir)
                }
                .buttonStyle(.plain).font(.caption)
                Button("Change partner") { showChangePartner = true }
                    .buttonStyle(.plain).font(.caption)
                    .disabled(state.isLocked)
                Spacer()
                Button("Quit") { NSApp.terminate(nil) }
                    .buttonStyle(.plain).font(.caption)
            }
            .sheet(isPresented: $showChangePartner) {
                ChangePartnerView().environmentObject(state)
            }
        }
    }
}

// MARK: - Emergency override

private struct EmergencyView: View {
    @EnvironmentObject var state: AppState
    @Environment(\.dismiss) var dismiss

    @State private var phase: Phase = .sending
    @State private var remaining: Int = 60
    @State private var code: String = ""
    @State private var error: String? = nil
    @State private var timer: Timer? = nil

    enum Phase { case sending, sent, failed }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Emergency Override").font(.headline)

            switch phase {
            case .sending:
                HStack { ProgressView(); Text("Emailing code to your partner…") }
                    .font(.caption).foregroundColor(.secondary)

            case .failed:
                Text(error ?? "Failed to email code")
                    .font(.caption).foregroundColor(.red)
                Button("Retry") { sendCode() }

            case .sent:
                Text("A one-time code was emailed to your partner. Ask them for it. Input unlocks after the countdown.")
                    .font(.caption).foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)

                HStack {
                    ProgressView(value: Double(60 - remaining), total: 60)
                    Text("\(remaining)s").monospacedDigit()
                }

                SecureField("Code from partner", text: $code)
                    .textFieldStyle(.roundedBorder)
                    .disabled(remaining > 0)

                if let error { Text(error).font(.caption).foregroundColor(.red) }
            }

            HStack {
                Button("Cancel") { dismiss() }
                Spacer()
                if phase == .sent {
                    Button("Unlock") {
                        if state.endLockoutWithPassword(code) {
                            dismiss()
                        } else {
                            error = "Wrong code"
                        }
                    }
                    .keyboardShortcut(.defaultAction)
                    .disabled(remaining > 0 || code.isEmpty)
                }
            }
        }
        .padding(20)
        .frame(width: 340)
        .onAppear { sendCode() }
        .onDisappear { timer?.invalidate() }
    }

    private func sendCode() {
        phase = .sending
        error = nil
        Task {
            do {
                try await state.requestEmergencyCode()
                phase = .sent
                startCountdown()
            } catch {
                self.error = "\(error)"
                phase = .failed
            }
        }
    }

    private func startCountdown() {
        timer?.invalidate()
        remaining = 60
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { t in
            Task { @MainActor in
                if remaining > 0 { remaining -= 1 } else { t.invalidate() }
            }
        }
    }
}

// MARK: - Change partner

private struct ChangePartnerView: View {
    @EnvironmentObject var state: AppState
    @Environment(\.dismiss) var dismiss

    @State private var remaining: Int = 60
    @State private var newEmail: String = ""
    @State private var busy: Bool = false
    @State private var error: String? = nil
    @State private var timer: Timer? = nil

    var currentEmail: String { Keychain.get(SetupKeys.partnerEmail) ?? "(none)" }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Change accountability partner").font(.headline)
            Text("Current partner: \(currentEmail)")
                .font(.caption).foregroundColor(.secondary)
            Text("The old partner will be emailed that they've been replaced. Save unlocks after the countdown.")
                .font(.caption).foregroundColor(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            HStack {
                ProgressView(value: Double(60 - remaining), total: 60)
                Text("\(remaining)s").monospacedDigit()
            }

            TextField("New partner email", text: $newEmail)
                .textFieldStyle(.roundedBorder)
                .disabled(remaining > 0)

            if let error { Text(error).font(.caption).foregroundColor(.red) }

            HStack {
                Button("Cancel") { dismiss() }
                Spacer()
                Button(busy ? "Saving…" : "Save") {
                    busy = true
                    error = nil
                    Task {
                        do {
                            try await state.changePartner(to: newEmail)
                            dismiss()
                        } catch {
                            self.error = "\(error)"
                        }
                        busy = false
                    }
                }
                .keyboardShortcut(.defaultAction)
                .disabled(remaining > 0 || newEmail.isEmpty || busy)
            }
        }
        .padding(20)
        .frame(width: 340)
        .onAppear {
            timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { t in
                Task { @MainActor in
                    if remaining > 0 { remaining -= 1 } else { t.invalidate() }
                }
            }
        }
        .onDisappear { timer?.invalidate() }
    }
}

// MARK: - Setup

private struct SetupView: View {
    @EnvironmentObject var state: AppState
    @State private var partnerEmail = ""
    @State private var resendKey = ""
    @State private var fromAddress = "TiltBlocker <onboarding@resend.dev>"
    @State private var busy = false
    @State private var error: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("First-run setup").font(.headline)
            Text("Saves your partner's email + Resend API key locally and sends them a welcome email explaining the app and their role. Nothing else is sent until you hit Emergency Override.")
                .font(.caption).foregroundColor(.secondary).fixedSize(horizontal: false, vertical: true)

            TextField("Partner email", text: $partnerEmail)
                .textFieldStyle(.roundedBorder)
            SecureField("Resend API key (re_…)", text: $resendKey)
                .textFieldStyle(.roundedBorder)
            TextField("From address", text: $fromAddress)
                .textFieldStyle(.roundedBorder)
                .font(.caption)

            if let error { Text(error).font(.caption).foregroundColor(.red) }

            Button(busy ? "Emailing partner…" : "Save & email partner") {
                busy = true
                error = nil
                Task {
                    do {
                        try await state.completeSetup(
                            partnerEmail: partnerEmail,
                            resendApiKey: resendKey,
                            fromAddress: fromAddress
                        )
                    } catch {
                        self.error = "\(error)"
                    }
                    busy = false
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(busy || partnerEmail.isEmpty || resendKey.isEmpty)
        }
    }
}
