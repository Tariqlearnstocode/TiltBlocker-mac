import SwiftUI

// MARK: - Root

struct ContentView: View {
    @EnvironmentObject var state: AppState

    var body: some View {
        Group {
            if !state.isSetUp {
                SetupView()
            } else if state.isLocked {
                LockedView()
            } else {
                UnlockedView()
            }
        }
        .frame(width: 440)
        .background(
            ZStack {
                VisualEffectBackground(material: .hudWindow, blending: .behindWindow)
                Color.tbBg.opacity(0.78)
            }
            .ignoresSafeArea()
        )
        .colorScheme(.dark)
        .transition(.opacity)
        .animation(.easeInOut(duration: 0.3), value: state.isLocked)
        .animation(.easeInOut(duration: 0.2), value: state.isSetUp)
    }
}

// MARK: - App header

private struct AppHeader: View {
    @EnvironmentObject var state: AppState
    var body: some View {
        HStack(spacing: 10) {
            Wordmark(size: 12)
            Rectangle()
                .fill(Color.tbBorder)
                .frame(width: 1, height: 14)
            HStack(spacing: 6) {
                StatusDot(color: state.isLocked ? .tbOrange : .tbGreen)
                Text(state.isLocked ? "Locked" : "Unlocked")
                    .font(.system(size: 10.5, weight: .semibold))
                    .tracking(0.4)
                    .foregroundColor(.tbTextMuted)
                    .textCase(.uppercase)
            }
            Spacer()
            ReloadChip {
                state.reloadConfig()
                state.tickNow()
            }
        }
    }
}

// MARK: - UNLOCKED (tabbed)

private struct UnlockedView: View {
    @EnvironmentObject var state: AppState
    @State private var tab: AppTab = .status
    @State private var showChangePartner = false

    var body: some View {
        ZStack {
            VStack(spacing: 0) {
                // Header + tabs sit on the translucent material, no card.
                VStack(spacing: 12) {
                    AppHeader()
                    TabBar(selection: $tab)
                }
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 12)

                // Hairline below the chrome
                Rectangle().fill(Color.tbBorder.opacity(0.6)).frame(height: 1)

                ScrollView {
                    VStack(spacing: 12) {
                        switch tab {
                        case .status:
                            StatusTab()
                        case .blocklist:
                            BlocklistTab()
                        case .schedule:
                            ScheduleTab()
                        case .settings:
                            SettingsTab(showChangePartner: $showChangePartner)
                        }

                        if let err = state.lastError {
                            errorRow(err)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                }
            }
            .frame(maxHeight: 620)

            if showChangePartner {
                Color.black.opacity(0.45).ignoresSafeArea()
                    .onTapGesture { showChangePartner = false }
                ChangePartnerView(isPresented: $showChangePartner)
                    .environmentObject(state)
                    .transition(.scale(scale: 0.96).combined(with: .opacity))
            }
        }
        .animation(.easeOut(duration: 0.15), value: showChangePartner)
    }

    private func errorRow(_ err: String) -> some View {
        CardSurface(padding: 12) {
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "xmark.octagon.fill").foregroundColor(.tbRed)
                Text(err)
                    .font(.tbCaption(11.5))
                    .foregroundColor(.tbRedDeep)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.tbRed.opacity(0.5), lineWidth: 1))
    }
}

// MARK: - Status tab

private struct StatusTab: View {
    @EnvironmentObject var state: AppState
    @State private var durationMinutes: Int = 60
    @State private var showCustom = false
    @State private var customHours = ""
    @State private var customMinutes = ""

    private let presets: [(label: String, minutes: Int)] = [
        ("15m", 15), ("30m", 30), ("1h", 60), ("2h", 120),
        ("4h", 240), ("8h", 480), ("24h", 1440), ("Custom", -1)
    ]

    var body: some View {
        VStack(spacing: 18) {
            // Status line — Proton-style, raw colored text, no chrome
            VStack(spacing: 3) {
                Text("Trading is unblocked")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.tbGreen)
                Text("\(state.blocklist.count) sites armed and ready")
                    .font(.system(size: 12))
                    .foregroundColor(.tbTextMuted)
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 4)

            // Primary action block — duration picker + giant CTA
            VStack(spacing: 10) {
                HStack {
                    Text("LOCK FOR")
                        .font(.system(size: 10, weight: .bold))
                        .tracking(1)
                        .foregroundColor(.tbTextMuted)
                    Spacer()
                    if !showCustom {
                        Button {
                            withAnimation(.easeInOut(duration: 0.2)) { showCustom = true }
                        } label: {
                            Text("Custom")
                                .font(.system(size: 10.5, weight: .semibold))
                                .foregroundColor(.tbAccentHi)
                        }
                        .buttonStyle(.plain)
                    } else {
                        Button {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                showCustom = false; customHours = ""; customMinutes = ""
                            }
                        } label: {
                            Text("Use presets")
                                .font(.system(size: 10.5, weight: .semibold))
                                .foregroundColor(.tbAccentHi)
                        }
                        .buttonStyle(.plain)
                    }
                }

                if showCustom {
                    customDurationRow
                } else {
                    durationGrid
                    primaryLockCTA(label: "Lock myself out",
                                   detail: prettyDuration(durationMinutes)) {
                        state.startManualLockout(minutes: durationMinutes)
                    }
                }
            }

            // Stats row
            HStack(spacing: 8) {
                MiniStat(label: "Sites armed",
                         value: "\(state.blocklist.count)")
                MiniStat(label: "Next window",
                         value: nextWindowLabel)
                MiniStat(label: "Helper",
                         value: state.helperInstalled ? "Ready" : "Off",
                         accent: state.helperInstalled ? .tbGreen : .tbOrange)
            }

            if !state.helperInstalled { helperBanner }

            Spacer(minLength: 0)
        }
    }

    private var durationGrid: some View {
        let visible = presets.filter { $0.minutes != -1 }
        return LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 7), spacing: 6) {
            ForEach(visible, id: \.label) { p in
                DurationChip(
                    label: p.label,
                    selected: !showCustom && durationMinutes == p.minutes
                ) {
                    durationMinutes = p.minutes
                }
            }
        }
    }

    private var customDurationRow: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                customField(text: $customHours, suffix: "Hours")
                customField(text: $customMinutes, suffix: "Minutes")
            }
            HStack(spacing: 10) {
                OutlineButton(label: "Cancel", color: .tbTextMuted) {
                    showCustom = false; customHours = ""; customMinutes = ""
                }
                accentLockButton(
                    label: totalCustomMinutes() > 0
                        ? "Lock for \(prettyDuration(totalCustomMinutes()))"
                        : "Enter time",
                    disabled: totalCustomMinutes() == 0,
                    action: commitCustomLockout
                )
            }
        }
    }

    @ViewBuilder
    private func customField(text: Binding<String>, suffix: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            TextField("0", text: text)
                .textFieldStyle(.plain)
                .font(.system(size: 30, weight: .semibold, design: .rounded))
                .foregroundColor(.tbText)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.tbBgSubtle)
                .cornerRadius(10)
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.tbBorder, lineWidth: 1))
            Text(suffix).font(.tbCaption(10)).foregroundColor(.tbTextMuted)
                .frame(maxWidth: .infinity, alignment: .center)
        }
    }

    private func primaryLockCTA(label: String, detail: String, disabled: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 14, weight: .semibold))
                Text(label)
                    .font(.system(size: 14.5, weight: .semibold))
                Spacer()
                Text(detail)
                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                    .foregroundColor(.white.opacity(0.85))
                    .padding(.horizontal, 9).padding(.vertical, 3)
                    .background(Color.white.opacity(0.16))
                    .cornerRadius(6)
            }
            .foregroundColor(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity)
            .background(
                disabled
                ? AnyView(Color.tbAccent.opacity(0.4))
                : AnyView(LinearGradient.tbAccentFill)
            )
            .cornerRadius(12)
            .shadow(color: Color.tbAccent.opacity(disabled ? 0 : 0.45), radius: 12, y: 4)
        }
        .buttonStyle(.plain)
        .disabled(disabled)
    }

    private func accentLockButton(label: String, disabled: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 7) {
                Image(systemName: "lock.fill").font(.system(size: 12, weight: .semibold))
                Text(label).font(.system(size: 13, weight: .semibold))
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                disabled
                ? AnyView(Color.tbAccent.opacity(0.4))
                : AnyView(LinearGradient.tbAccentFill)
            )
            .cornerRadius(11)
            .shadow(color: Color.tbAccent.opacity(disabled ? 0 : 0.25), radius: 8, y: 3)
        }
        .buttonStyle(.plain)
        .disabled(disabled)
    }

    private var helperBanner: some View {
        CardSurface(padding: 12) {
            HStack(spacing: 10) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.tbOrange)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Privileged helper not installed")
                        .font(.tbSubtitle(12)).foregroundColor(.tbText)
                    Text("Lockouts will not apply without it.")
                        .font(.tbCaption(11)).foregroundColor(.tbTextMuted)
                }
                Spacer()
                OutlineButton(label: "Install", color: .tbOrange) {
                    state.installHelper()
                }
                .frame(width: 90)
            }
        }
    }

    private var nextWindowLabel: String {
        guard let w = state.nextWindow else { return "None" }
        return "\(w.days.first?.capitalized ?? "—") \(w.start)"
    }

    private func totalCustomMinutes() -> Int {
        (Int(customHours) ?? 0) * 60 + (Int(customMinutes) ?? 0)
    }
    private func commitCustomLockout() {
        let total = totalCustomMinutes()
        guard total > 0 else { return }
        state.startManualLockout(minutes: total)
        customHours = ""; customMinutes = ""; showCustom = false
    }
    private func prettyDuration(_ m: Int) -> String {
        if m % 60 == 0 { return "\(m/60)h" }
        if m < 60 { return "\(m)m" }
        return "\(m/60)h \(m%60)m"
    }
}

// MARK: - Blocklist tab

private struct BlocklistTab: View {
    @EnvironmentObject var state: AppState
    @State private var newDomain = ""

    var body: some View {
        VStack(spacing: 12) {
            CardSurface(padding: 14) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        SectionHeader(icon: "plus.rectangle.on.rectangle",
                                      title: "Add a site to block",
                                      iconColor: .tbAccent)
                        Spacer()
                        Text("\(state.blocklist.count) total")
                            .font(.system(size: 10.5, weight: .semibold))
                            .tracking(0.4)
                            .foregroundColor(.tbTextMuted)
                            .textCase(.uppercase)
                    }
                    HStack(spacing: 8) {
                        InputField(placeholder: "example.com",
                                   text: $newDomain,
                                   onCommit: commitAdd)
                        Button("Add") { commitAdd() }
                            .buttonStyle(.plain)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 18).padding(.vertical, 9)
                            .background(
                                newDomain.trimmingCharacters(in: .whitespaces).isEmpty
                                ? AnyView(Color.tbAccent.opacity(0.4))
                                : AnyView(LinearGradient.tbAccentFill)
                            )
                            .cornerRadius(10)
                            .disabled(newDomain.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                }
            }

            CardSurface(padding: 14) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        SectionHeader(icon: "list.bullet.rectangle",
                                      title: "Blocked sites",
                                      iconColor: .tbRed)
                        Spacer()
                        if state.isLocked {
                            Text("Locked — cannot remove")
                                .font(.system(size: 10, weight: .semibold))
                                .tracking(0.5)
                                .foregroundColor(.tbOrange)
                                .textCase(.uppercase)
                        }
                    }

                    if state.blocklist.isEmpty {
                        emptyState
                    } else {
                        domainGrid
                    }
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 6) {
            Image(systemName: "tray")
                .font(.system(size: 22))
                .foregroundColor(.tbTextMuted.opacity(0.6))
            Text("No sites blocked yet")
                .font(.tbSubtitle(12)).foregroundColor(.tbTextMuted)
            Text("Add a domain above to arm your blocklist.")
                .font(.tbCaption(11)).foregroundColor(.tbTextMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 22)
    }

    private var domainGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 8),
                            GridItem(.flexible(), spacing: 8)], spacing: 6) {
            ForEach(state.blocklist, id: \.self) { d in
                HStack(spacing: 6) {
                    Image(systemName: "globe")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.tbTextMuted)
                    Text(d)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.tbText)
                        .lineLimit(1)
                        .truncationMode(.middle)
                    Spacer(minLength: 0)
                    if !state.isLocked {
                        Button { state.removeDomain(d) } label: {
                            Image(systemName: "xmark")
                                .font(.system(size: 8, weight: .bold))
                                .foregroundColor(.white)
                                .frame(width: 16, height: 16)
                                .background(Color.tbRed)
                                .clipShape(Circle())
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 9).padding(.vertical, 7)
                .background(Color.white)
                .cornerRadius(8)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.tbBorder, lineWidth: 1))
            }
        }
    }

    private func commitAdd() {
        let d = newDomain.trimmingCharacters(in: .whitespaces)
        guard !d.isEmpty else { return }
        state.addDomain(d); newDomain = ""
    }
}

// MARK: - Schedule tab

private struct ScheduleTab: View {
    @EnvironmentObject var state: AppState

    private let dayOrder: [(key: String, label: String)] = [
        ("sun", "S"), ("mon", "M"), ("tue", "T"), ("wed", "W"),
        ("thu", "T"), ("fri", "F"), ("sat", "S")
    ]

    var body: some View {
        VStack(spacing: 12) {
            CardSurface(padding: 14) {
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeader(icon: "calendar",
                                  title: "Lockout windows",
                                  iconColor: .tbAccent)

                    if state.schedule.windows.isEmpty {
                        VStack(spacing: 6) {
                            Image(systemName: "calendar.badge.exclamationmark")
                                .font(.system(size: 22))
                                .foregroundColor(.tbTextMuted.opacity(0.6))
                            Text("No scheduled windows")
                                .font(.tbSubtitle(12)).foregroundColor(.tbTextMuted)
                            Text("Edit schedule.json to add automatic lockouts.")
                                .font(.tbCaption(11)).foregroundColor(.tbTextMuted)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 22)
                    } else {
                        VStack(spacing: 10) {
                            ForEach(Array(state.schedule.windows.enumerated()), id: \.offset) { _, w in
                                windowRow(w)
                            }
                        }
                    }
                }
            }

            if let next = state.nextWindow {
                CardSurface(padding: 12) {
                    HStack(spacing: 10) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.tbAccent)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Next window")
                                .font(.system(size: 10, weight: .bold))
                                .tracking(0.6).foregroundColor(.tbTextMuted)
                                .textCase(.uppercase)
                            Text("\(next.days.first?.capitalized ?? "")  ·  \(next.start) → \(next.end)")
                                .font(.tbSubtitle(12.5)).foregroundColor(.tbText)
                        }
                        Spacer()
                    }
                }
            }

            CardSurface(padding: 12) {
                HStack(spacing: 8) {
                    Image(systemName: "info.circle")
                        .font(.system(size: 11))
                        .foregroundColor(.tbTextMuted)
                    Text("Edit ~/.tiltblocker/schedule.json to change windows.")
                        .font(.tbCaption(11)).foregroundColor(.tbTextMuted)
                    Spacer()
                    TextButton(label: "Open folder") { NSWorkspace.shared.open(Config.dir) }
                }
            }
        }
    }

    private func windowRow(_ w: TimeWindow) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 5) {
                ForEach(dayOrder, id: \.key) { d in
                    let on = w.days.contains(d.key)
                    Text(d.label)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(on ? .white : .tbTextMuted)
                        .frame(width: 22, height: 22)
                        .background(on ? Color.tbAccent : Color.tbBgSubtle)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(on ? Color.clear : Color.tbBorder, lineWidth: 1))
                }
                Spacer()
                HStack(spacing: 4) {
                    Text(w.start)
                        .font(.system(size: 12, weight: .semibold, design: .monospaced))
                        .foregroundColor(.tbText)
                    Image(systemName: "arrow.right")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.tbTextMuted)
                    Text(w.end)
                        .font(.system(size: 12, weight: .semibold, design: .monospaced))
                        .foregroundColor(.tbText)
                }
            }
        }
        .padding(.horizontal, 11).padding(.vertical, 9)
        .background(Color.tbBgSubtle.opacity(0.6))
        .cornerRadius(10)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.tbBorder, lineWidth: 1))
    }
}

// MARK: - Settings tab

private struct SettingsTab: View {
    @EnvironmentObject var state: AppState
    @Binding var showChangePartner: Bool

    private var partnerEmail: String { Keychain.get(SetupKeys.partnerEmail) ?? "(none)" }

    var body: some View {
        VStack(spacing: 12) {
            CardSurface(padding: 14) {
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeader(icon: "person.crop.circle.badge.checkmark",
                                  title: "Accountability partner",
                                  iconColor: .tbAccent)
                    HStack(spacing: 10) {
                        ZStack {
                            Circle().fill(Color.tbAccentSoft).frame(width: 32, height: 32)
                            Image(systemName: "envelope.fill")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.tbAccent)
                        }
                        VStack(alignment: .leading, spacing: 1) {
                            Text("CURRENT")
                                .font(.system(size: 9, weight: .bold))
                                .tracking(0.6).foregroundColor(.tbTextMuted)
                            Text(partnerEmail)
                                .font(.system(size: 12.5, weight: .medium))
                                .foregroundColor(.tbText)
                                .lineLimit(1).truncationMode(.middle)
                        }
                        Spacer()
                        OutlineButton(label: "Change", color: .tbAccent) {
                            showChangePartner = true
                        }
                        .frame(width: 92)
                    }
                }
            }

            CardSurface(padding: 14) {
                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(icon: "bolt.shield",
                                  title: "Privileged helper",
                                  iconColor: state.helperInstalled ? .tbGreenDeep : .tbOrange)
                    HStack(spacing: 10) {
                        StatusDot(color: state.helperInstalled ? .tbGreen : .tbOrange)
                        Text(state.helperInstalled
                             ? "Installed — lockouts will apply"
                             : "Not installed — lockouts won't take effect")
                            .font(.tbCaption(12))
                            .foregroundColor(.tbText)
                        Spacer()
                        if !state.helperInstalled {
                            OutlineButton(label: "Install", color: .tbOrange) {
                                state.installHelper()
                            }
                            .frame(width: 86)
                        }
                    }
                }
            }

            CardSurface(padding: 14) {
                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(icon: "folder", title: "Files & data", iconColor: .tbTextMuted)
                    HStack(spacing: 8) {
                        Image(systemName: "folder.fill")
                            .font(.system(size: 11))
                            .foregroundColor(.tbTextMuted)
                        Text("~/.tiltblocker/")
                            .font(.system(size: 12, weight: .medium, design: .monospaced))
                            .foregroundColor(.tbText)
                        Spacer()
                        OutlineButton(label: "Open", color: .tbTextMuted) {
                            NSWorkspace.shared.open(Config.dir)
                        }
                        .frame(width: 78)
                    }
                }
            }

            HStack {
                Text("TiltBlocker")
                    .font(.system(size: 10.5, weight: .semibold))
                    .tracking(0.4)
                    .foregroundColor(.tbTextMuted)
                    .textCase(.uppercase)
                Spacer()
                Button {
                    NSApp.terminate(nil)
                } label: {
                    HStack(spacing: 5) {
                        Image(systemName: "power").font(.system(size: 10, weight: .bold))
                        Text("Quit").font(.system(size: 11.5, weight: .semibold))
                    }
                    .foregroundColor(.tbRedDeep)
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .background(Color.tbRedSoft.opacity(0.7))
                    .cornerRadius(8)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.tbRed.opacity(0.3), lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
            .padding(.top, 2)
        }
    }
}

// MARK: - LOCKED (compact, fits in view)

private struct LockedView: View {
    @EnvironmentObject var state: AppState
    @State private var showEmergency = false
    @State private var showAllSites = false

    var body: some View {
        ZStack {
            VStack(spacing: 0) {
                // Header on translucent material
                VStack(spacing: 0) {
                    HStack(spacing: 10) {
                        Wordmark(size: 12)
                        Rectangle().fill(Color.tbBorder).frame(width: 1, height: 14)
                        HStack(spacing: 6) {
                            StatusDot(color: .tbOrange)
                            Text("Locked")
                                .font(.system(size: 10.5, weight: .semibold))
                                .tracking(0.4)
                                .foregroundColor(.tbOrange)
                                .textCase(.uppercase)
                        }
                        Spacer()
                        Text(endsAtText)
                            .font(.system(size: 11, weight: .medium, design: .monospaced))
                            .foregroundColor(.tbTextMuted)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 14)
                    .padding(.bottom, 12)
                }

                Rectangle().fill(Color.tbBorder.opacity(0.6)).frame(height: 1)

                ScrollView {
                    VStack(spacing: 12) {
                        timerCard
                        statsRow
                        if !state.blocklist.isEmpty { blockedSitesCard }
                        emergencyCard
                        if let err = state.lastError { errorRow(err) }

                        HStack {
                            TextButton(label: "Config folder") { NSWorkspace.shared.open(Config.dir) }
                            Spacer()
                            TextButton(label: "Quit") { NSApp.terminate(nil) }
                        }
                        .padding(.top, 2)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                }
            }
            .frame(maxHeight: 580)

            if showEmergency {
                Color.black.opacity(0.45).ignoresSafeArea()
                    .onTapGesture { showEmergency = false }
                EmergencyView(isPresented: $showEmergency)
                    .environmentObject(state)
                    .transition(.scale(scale: 0.96).combined(with: .opacity))
            }
        }
        .animation(.easeOut(duration: 0.15), value: showEmergency)
    }

    // MARK: Timer card

    private var timerCard: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 14).fill(LinearGradient.tbAccentFill)
            // subtle decorative ring
            Circle().stroke(Color.white.opacity(0.06), lineWidth: 1)
                .frame(width: 220, height: 220).offset(x: 140, y: -70)
            Circle().stroke(Color.white.opacity(0.06), lineWidth: 1)
                .frame(width: 160, height: 160).offset(x: -130, y: 60)

            VStack(spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white.opacity(0.8))
                    Text("TIME REMAINING")
                        .font(.system(size: 10, weight: .bold))
                        .tracking(1.2)
                        .foregroundColor(.white.opacity(0.85))
                }
                if let ends = state.lockoutEndsAt {
                    Text(timerInterval: Date()...ends, countsDown: true)
                        .font(.system(size: 42, weight: .bold, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(.white)
                        .shadow(color: Color.black.opacity(0.18), radius: 3, y: 1)
                } else {
                    Text("LOCKED")
                        .font(.system(size: 30, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                }
                Text(endsAtText)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.white.opacity(0.85))
            }
            .padding(.vertical, 18)
        }
        .frame(maxWidth: .infinity)
        .shadow(color: Color.tbAccent.opacity(0.25), radius: 10, y: 4)
    }

    private var statsRow: some View {
        HStack(spacing: 8) {
            MiniStat(label: "Sites blocked",
                     value: "\(state.blocklist.count)",
                     icon: "shield.lefthalf.filled")
            MiniStat(label: "Ends at",
                     value: endsAtTextShort,
                     icon: "flag.checkered")
            MiniStat(label: "Helper",
                     value: state.helperInstalled ? "Ready" : "Off",
                     accent: state.helperInstalled ? .tbGreenDeep : .tbOrange,
                     icon: "bolt.shield")
        }
    }

    private var blockedSitesCard: some View {
        CardSurface(padding: 12) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    SectionHeader(icon: "nosign", title: "Blocked sites", iconColor: .tbRed)
                    Spacer()
                    Text("\(state.blocklist.count)")
                        .font(.system(size: 10.5, weight: .semibold))
                        .tracking(0.4)
                        .foregroundColor(.tbTextMuted)
                        .textCase(.uppercase)
                }
                let visibleCount = showAllSites ? state.blocklist.count : min(8, state.blocklist.count)
                let visible = Array(state.blocklist.prefix(visibleCount))
                let hidden = state.blocklist.count - visibleCount

                FlowLayout(spacing: 5) {
                    ForEach(visible, id: \.self) { SiteChip(label: $0) }
                    if !showAllSites && hidden > 0 {
                        Button { withAnimation { showAllSites = true } } label: {
                            Text("+\(hidden) more")
                                .font(.tbCaption(11).weight(.semibold))
                                .foregroundColor(.tbTextMuted)
                                .padding(.horizontal, 9).padding(.vertical, 4)
                                .background(Color.tbBgSubtle)
                                .cornerRadius(20)
                                .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.tbBorder, lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                    }
                }
                if showAllSites && state.blocklist.count > 8 {
                    Button("Show less") { withAnimation { showAllSites = false } }
                        .buttonStyle(.plain)
                        .font(.tbCaption(11).weight(.semibold))
                        .foregroundColor(.tbTextMuted)
                }
            }
        }
    }

    private var emergencyCard: some View {
        CardSurface(padding: 12) {
            HStack(spacing: 10) {
                ZStack {
                    Circle().fill(Color.tbOrangeSoft).frame(width: 32, height: 32)
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.tbOrange)
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text("Emergency unlock")
                        .font(.system(size: 12.5, weight: .semibold))
                        .foregroundColor(.tbText)
                    Text("Sends a one-time code to your partner.")
                        .font(.tbCaption(11)).foregroundColor(.tbTextMuted)
                }
                Spacer()
                Button { showEmergency = true } label: {
                    Text("Override")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 14).padding(.vertical, 7)
                        .background(Color.tbOrange)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func errorRow(_ err: String) -> some View {
        CardSurface(padding: 12) {
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "xmark.octagon.fill").foregroundColor(.tbRed)
                Text(err)
                    .font(.tbCaption(11.5))
                    .foregroundColor(.tbRedDeep)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    // MARK: helpers

    private var endsAtText: String {
        guard let ends = state.lockoutEndsAt else { return "" }
        return "Ends \(ends.formatted(date: .omitted, time: .shortened))"
    }
    private var endsAtTextShort: String {
        guard let ends = state.lockoutEndsAt else { return "—" }
        return ends.formatted(date: .omitted, time: .shortened)
    }
}

// MARK: - Flow layout (for chip wrapping)

private struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        let rows = compute(width: width, subviews: subviews).rows
        let height = rows.reduce(0) { $0 + $1.height } + CGFloat(max(0, rows.count - 1)) * spacing
        return CGSize(width: width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let rows = compute(width: bounds.width, subviews: subviews).rows
        var y = bounds.minY
        for row in rows {
            var x = bounds.minX
            for item in row.items {
                let size = subviews[item.index].sizeThatFits(.unspecified)
                subviews[item.index].place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
                x += size.width + spacing
            }
            y += row.height + spacing
        }
    }

    private struct RowItem { let index: Int }
    private struct Row { var items: [RowItem] = []; var width: CGFloat = 0; var height: CGFloat = 0 }
    private func compute(width: CGFloat, subviews: Subviews) -> (rows: [Row], total: CGSize) {
        var rows: [Row] = [Row()]
        for i in subviews.indices {
            let size = subviews[i].sizeThatFits(.unspecified)
            let candidate = rows[rows.count - 1].width + (rows[rows.count - 1].items.isEmpty ? 0 : spacing) + size.width
            if candidate > width && !rows[rows.count - 1].items.isEmpty {
                rows.append(Row())
            }
            let last = rows.count - 1
            if !rows[last].items.isEmpty { rows[last].width += spacing }
            rows[last].items.append(RowItem(index: i))
            rows[last].width += size.width
            rows[last].height = max(rows[last].height, size.height)
        }
        return (rows, .zero)
    }
}

// MARK: - Emergency sheet

private struct EmergencyView: View {
    @EnvironmentObject var state: AppState
    @Binding var isPresented: Bool

    @State private var phase: Phase = .sending
    @State private var code: String = ""
    @State private var error: String? = nil

    enum Phase { case sending, sent, failed }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Wordmark()
                Spacer()
                Text("EMERGENCY OVERRIDE")
                    .font(.tbLabel(10, weight: .bold))
                    .tracking(1.5)
                    .foregroundColor(.tbOrange)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Color.tbOrangeSoft)
                    .cornerRadius(20)
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.tbOrange.opacity(0.4), lineWidth: 1))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Email your partner")
                    .font(.tbTitle(20)).foregroundColor(.tbText)
                Text("A one-time code goes to your accountability partner. Ask them for it.")
                    .font(.tbCaption(12)).foregroundColor(.tbTextMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            CardSurface {
                VStack(alignment: .leading, spacing: 12) {
                    switch phase {
                    case .sending:
                        HStack(spacing: 8) {
                            ProgressView().controlSize(.small)
                            Text("Emailing your partner a fresh code…")
                                .font(.tbCaption(12)).foregroundColor(.tbTextMuted)
                        }
                    case .failed:
                        Text(error ?? "Couldn't send code")
                            .font(.tbCaption(12)).foregroundColor(.tbRedDeep)
                        OutlineButton(label: "Retry", color: .tbBlue) { sendCode() }
                    case .sent:
                        Text("Code sent. Enter it below to unlock.")
                            .font(.tbCaption(12)).foregroundColor(.tbTextMuted)
                        SecureInputField(placeholder: "Code from partner", text: $code)
                        if let error {
                            Text(error).font(.tbCaption(11)).foregroundColor(.tbRedDeep)
                        }
                    }
                }
            }

            HStack {
                OutlineButton(label: "Cancel", color: .tbTextMuted) { isPresented = false }
                if phase == .sent {
                    PrimaryButton(
                        label: "Unlock",
                        icon: "lock.open.fill",
                        color: .tbOrange,
                        disabled: code.isEmpty
                    ) {
                        if state.endLockoutWithPassword(code) { isPresented = false }
                        else { error = "That code didn't match." }
                    }
                }
            }
        }
        .padding(22)
        .frame(width: 400)
        .background(Color.tbBgSubtle)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.25), radius: 20, x: 0, y: 8)
        .colorScheme(.light)
        .onAppear { sendCode() }
    }

    private func sendCode() {
        phase = .sending; error = nil
        Task {
            do {
                try await state.requestEmergencyCode()
                phase = .sent
            } catch {
                self.error = "\(error)"; phase = .failed
            }
        }
    }

}

// MARK: - Change partner

private struct ChangePartnerView: View {
    @EnvironmentObject var state: AppState
    @Binding var isPresented: Bool

    @State private var newEmail: String = ""
    @State private var busy: Bool = false
    @State private var error: String? = nil

    var currentEmail: String { Keychain.get(SetupKeys.partnerEmail) ?? "(none)" }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Wordmark()
                Spacer()
                Text("SETTINGS")
                    .font(.tbLabel(10, weight: .bold)).tracking(1.5)
                    .foregroundColor(.tbBlue)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Color.tbBlueSoft).cornerRadius(20)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Change accountability partner")
                    .font(.tbTitle(18)).foregroundColor(.tbText)
                Text("Your old partner will be notified that they've been replaced.")
                    .font(.tbCaption(12)).foregroundColor(.tbTextMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            CardSurface {
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("CURRENT").font(.tbLabel(10, weight: .bold)).tracking(1)
                            .foregroundColor(.tbTextMuted)
                        Text(currentEmail).font(.tbBody(13)).foregroundColor(.tbText)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("NEW PARTNER").font(.tbLabel(10, weight: .bold)).tracking(1)
                            .foregroundColor(.tbTextMuted)
                        InputField(placeholder: "name@example.com", text: $newEmail)
                    }
                    if let error {
                        Text(error).font(.tbCaption(11)).foregroundColor(.tbRedDeep)
                    }
                }
            }

            HStack {
                OutlineButton(label: "Cancel", color: .tbTextMuted) { isPresented = false }
                PrimaryButton(
                    label: busy ? "Saving…" : "Save",
                    icon: "checkmark",
                    color: .tbBlue,
                    disabled: trimmedEmail.isEmpty || busy
                ) {
                    let email = trimmedEmail
                    busy = true; error = nil
                    Task {
                        do {
                            try await state.changePartner(to: email)
                            isPresented = false
                        } catch {
                            self.error = (error as NSError).localizedDescription
                        }
                        busy = false
                    }
                }
            }
        }
        .padding(22)
        .frame(width: 400)
        .background(Color.tbBgSubtle)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.25), radius: 20, x: 0, y: 8)
        .colorScheme(.light)
    }

    private var trimmedEmail: String {
        newEmail.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

// MARK: - Setup

private struct SetupView: View {
    @EnvironmentObject var state: AppState
    @State private var partnerEmail = ""
    @State private var resendKey = ""
    @State private var fromAddress = "TiltBlocker <clarence@claudecoworkcourse.com>"
    @State private var busy = false
    @State private var error: String? = nil

    var body: some View {
        VStack(spacing: 14) {
            HStack {
                Wordmark()
                Spacer()
                Text("SETUP")
                    .font(.tbLabel(10, weight: .bold)).tracking(1.5)
                    .foregroundColor(.tbGreenDeep)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Color.tbGreen.opacity(0.12)).cornerRadius(20)
            }

            CardSurface {
                VStack(alignment: .leading, spacing: 14) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Connect your partner")
                            .font(.tbTitle(17)).foregroundColor(.tbText)
                        Text("Only person who can unlock you early. Emailed a fresh one-time code each override.")
                            .font(.tbCaption(12)).foregroundColor(.tbTextMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    fieldGroup("Partner email") {
                        InputField(placeholder: "name@example.com", text: $partnerEmail)
                    }
                    fieldGroup("Resend API key") {
                        SecureInputField(placeholder: "re_…", text: $resendKey)
                    }
                    fieldGroup("From address") {
                        InputField(placeholder: "Name <name@yourdomain.com>", text: $fromAddress)
                    }

                    if let error {
                        Text(error).font(.tbCaption(11)).foregroundColor(.tbRedDeep)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    PrimaryButton(
                        label: busy ? "Emailing partner…" : "Save & email partner",
                        icon: "envelope.fill",
                        color: .tbBlue,
                        disabled: busy || partnerEmail.isEmpty || resendKey.isEmpty
                    ) {
                        busy = true; error = nil
                        Task {
                            do {
                                try await state.completeSetup(
                                    partnerEmail: partnerEmail,
                                    resendApiKey: resendKey,
                                    fromAddress: fromAddress
                                )
                            } catch { self.error = "\(error)" }
                            busy = false
                        }
                    }
                }
            }
        }
        .padding(16)
    }

    @ViewBuilder
    private func fieldGroup<F: View>(_ label: String, @ViewBuilder field: () -> F) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(.tbLabel(10, weight: .bold)).tracking(1)
                .foregroundColor(.tbTextMuted)
            field()
        }
    }
}
