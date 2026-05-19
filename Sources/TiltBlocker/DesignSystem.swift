import SwiftUI
import AppKit

// MARK: - Palette (light theme, slate text, cobalt accent)

extension Color {
    // Surfaces — dark, Proton-inspired
    static let tbBg          = Color(red: 0.090, green: 0.094, blue: 0.114)   // #17181D
    static let tbBgSubtle    = Color(red: 0.122, green: 0.129, blue: 0.157)   // #1F2128
    static let tbCardBg      = Color(red: 0.137, green: 0.145, blue: 0.176)   // #23252D
    static let tbCardBgHi    = Color(red: 0.165, green: 0.176, blue: 0.212)   // #2A2D36
    static let tbBorder      = Color(red: 0.224, green: 0.235, blue: 0.275)   // #393C46
    static let tbBorderHover = Color(red: 0.298, green: 0.314, blue: 0.357)   // #4C505B

    // Text
    static let tbText        = Color(red: 0.965, green: 0.969, blue: 0.980)   // #F6F7FA
    static let tbTextMuted   = Color(red: 0.612, green: 0.631, blue: 0.682)   // #9CA1AE
    static let tbTextLight   = Color(red: 0.741, green: 0.757, blue: 0.800)   // #BDC1CC

    // Brand
    static let tbBlue        = Color(red: 0.231, green: 0.510, blue: 0.965)   // #3B82F6
    static let tbBlueDeep    = Color(red: 0.114, green: 0.306, blue: 0.847)   // #1D4ED8
    static let tbBlueHover   = Color(red: 0.145, green: 0.388, blue: 0.922)   // #2563EB
    static let tbBlueSoft    = Color(red: 0.941, green: 0.973, blue: 1.000)   // #F0F9FF

    // Cobalt — the primary accent, Proton-bright on dark surface.
    static let tbAccent      = Color(red: 0.357, green: 0.345, blue: 0.949)   // #5B58F2
    static let tbAccentDeep  = Color(red: 0.275, green: 0.263, blue: 0.851)   // #4643D9
    static let tbAccentHi    = Color(red: 0.451, green: 0.443, blue: 1.000)   // #7371FF
    static let tbAccentSoft  = Color(red: 0.180, green: 0.176, blue: 0.310)   // #2E2D4F (dark-tinted soft)

    // Semantic
    static let tbGreen       = Color(red: 0.000, green: 0.784, blue: 0.588)   // #00C896
    static let tbGreenDeep   = Color(red: 0.000, green: 0.651, blue: 0.478)   // #00A67A
    static let tbRed         = Color(red: 0.937, green: 0.267, blue: 0.267)   // #EF4444
    static let tbRedSoft     = Color(red: 0.996, green: 0.886, blue: 0.886)   // #FEE2E2
    static let tbRedDeep     = Color(red: 0.600, green: 0.106, blue: 0.106)   // #991B1B
    static let tbOrange      = Color(red: 1.000, green: 0.420, blue: 0.208)   // #FF6B35
    static let tbOrangeDeep  = Color(red: 0.918, green: 0.345, blue: 0.047)   // #EA580C
    static let tbOrangeSoft  = Color(red: 1.000, green: 0.969, blue: 0.929)   // #FFF7ED
    static let tbAmber       = Color(red: 0.957, green: 0.620, blue: 0.043)   // #F59E0B
    static let tbGold        = Color(red: 1.000, green: 0.843, blue: 0.000)   // #FFD700

    // Legacy aliases so other files don't break
    static let tbParchment   = tbBg
    static let tbInk         = tbText
    static let tbInkMuted    = tbTextMuted
    static let tbRule        = tbBorder
    static let tbAged        = tbText
    static let tbAgedMuted   = tbTextMuted
    static let tbRuleDark    = tbBorder
    static let tbObsidian    = tbBg
    static let tbOxblood     = tbRed
    static let tbFg          = tbText
    static let tbFgMuted     = tbTextMuted
    static let tbFgDim       = tbTextLight
    static let tbGreenDim    = tbGreenDeep
    static let tbSurface     = tbBgSubtle
    static let tbBgDeep      = tbBg
}

// MARK: - Gradients

extension LinearGradient {
    static let tbBlueHero = LinearGradient(
        colors: [.tbBlue, .tbBlueDeep],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )
    static let tbGreenBanner = LinearGradient(
        colors: [.tbGreen, .tbGreenDeep],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )
    static let tbAccentFill = LinearGradient(
        colors: [.tbAccentHi, .tbAccent],
        startPoint: .top, endPoint: .bottom
    )
}

// MARK: - Typography (default sans / SF Pro)

extension Font {
    static func tbTitle(_ size: CGFloat = 18) -> Font {
        .system(size: size, weight: .semibold)
    }
    static func tbSubtitle(_ size: CGFloat = 14) -> Font {
        .system(size: size, weight: .medium)
    }
    static func tbBody(_ size: CGFloat = 13) -> Font {
        .system(size: size, weight: .regular)
    }
    static func tbCaption(_ size: CGFloat = 11) -> Font {
        .system(size: size, weight: .regular)
    }
    static func tbLabel(_ size: CGFloat = 12, weight: Font.Weight = .semibold) -> Font {
        .system(size: size, weight: weight)
    }
    static func tbMono(_ size: CGFloat = 12, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }
    static func tbDigits(_ size: CGFloat = 44) -> Font {
        .system(size: size, weight: .bold, design: .monospaced)
    }
}

// MARK: - Brand wordmark

struct Wordmark: View {
    var size: CGFloat = 13
    var color: Color = .tbText
    var body: some View {
        HStack(spacing: 0) {
            Text("TILT")
                .font(.system(size: size, weight: .heavy))
                .tracking(0.5)
                .foregroundColor(color)
            Text("|")
                .font(.system(size: size + 1, weight: .heavy))
                .foregroundColor(.tbBlue)
                .padding(.horizontal, 3)
            Text("BLOCKER")
                .font(.system(size: size, weight: .heavy))
                .tracking(0.5)
                .foregroundColor(color)
        }
        .fixedSize(horizontal: true, vertical: true)
        .lineLimit(1)
    }
}

// MARK: - Card container

struct CardSurface<Content: View>: View {
    let content: Content
    var padding: CGFloat = 16
    init(padding: CGFloat = 16, @ViewBuilder content: () -> Content) {
        self.padding = padding
        self.content = content()
    }
    var body: some View {
        content
            .padding(padding)
            .background(Color.tbCardBg)
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06), lineWidth: 1))
    }
}

// MARK: - Section header

struct SectionHeader: View {
    let icon: String
    let title: String
    var iconColor: Color = .tbBlue
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(iconColor)
            Text(title)
                .font(.tbSubtitle(13))
                .foregroundColor(.tbText)
        }
    }
}

// MARK: - Buttons

struct PrimaryButton: View {
    let label: String
    var icon: String? = nil
    var color: Color = .tbBlue
    var disabled: Bool = false
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if let icon {
                    Image(systemName: icon).font(.system(size: 12, weight: .semibold))
                }
                Text(label)
                    .font(.tbSubtitle(13))
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 11)
            .background(disabled ? color.opacity(0.4) : color)
            .cornerRadius(10)
        }
        .buttonStyle(.plain)
        .disabled(disabled)
    }
}

struct OutlineButton: View {
    let label: String
    var color: Color = .tbBlue
    var fillOnHover: Bool = true
    var disabled: Bool = false
    let action: () -> Void
    @State private var hovered = false

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.tbSubtitle(12))
                .foregroundColor(disabled ? color.opacity(0.4) : color)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 9)
                .background(fillOnHover && hovered ? color.opacity(0.06) : Color.clear)
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(disabled ? color.opacity(0.3) : color, lineWidth: 1.5)
                )
        }
        .buttonStyle(.plain)
        .onHover { hovered = $0 }
        .disabled(disabled)
    }
}

struct TextButton: View {
    let label: String
    var color: Color = .tbTextMuted
    var disabled: Bool = false
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.tbCaption(11))
                .foregroundColor(disabled ? color.opacity(0.4) : color)
        }
        .buttonStyle(.plain)
        .disabled(disabled)
    }
}

// MARK: - Duration chip

struct DurationChip: View {
    let label: String
    let selected: Bool
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(selected ? .white : .tbTextLight)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 6)
                .background(selected ? Color.tbAccent : Color.tbCardBgHi.opacity(0.7))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(selected ? Color.clear : Color.white.opacity(0.06), lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Site chip (locked state)

struct SiteChip: View {
    let label: String
    var body: some View {
        Text(label)
            .font(.tbCaption(11.5).weight(.medium))
            .foregroundColor(.tbRed)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Color.tbRed.opacity(0.14))
            .cornerRadius(20)
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.tbRed.opacity(0.35), lineWidth: 1))
    }
}

// MARK: - Editorial inputs (white field with blue focus accent)

struct InputField: View {
    let placeholder: String
    @Binding var text: String
    var onCommit: () -> Void = {}
    @FocusState private var focused: Bool
    var body: some View {
        TextField(placeholder, text: $text, onCommit: onCommit)
            .textFieldStyle(.plain)
            .font(.tbBody(13))
            .foregroundColor(.tbText)
            .focused($focused)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(Color.tbCardBgHi)
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(focused ? Color.tbAccentHi : Color.white.opacity(0.08), lineWidth: focused ? 1.5 : 1)
            )
            .contentShape(Rectangle())
            .onTapGesture { focused = true }
    }
}

struct SecureInputField: View {
    let placeholder: String
    @Binding var text: String
    @FocusState private var focused: Bool
    var body: some View {
        SecureField(placeholder, text: $text)
            .textFieldStyle(.plain)
            .font(.tbBody(13))
            .foregroundColor(.tbText)
            .focused($focused)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(Color.tbCardBgHi)
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(focused ? Color.tbAccentHi : Color.white.opacity(0.08), lineWidth: focused ? 1.5 : 1)
            )
            .contentShape(Rectangle())
            .onTapGesture { focused = true }
    }
}

// MARK: - Legacy aliases used by old components

struct HairlineRule: View {
    var color: Color = .tbBorder
    var body: some View { Rectangle().fill(color).frame(height: 1) }
}

struct LabelTag: View {
    let text: String
    var color: Color = .tbTextMuted
    var size: CGFloat = 11
    var tracking: CGFloat = 0.5
    var body: some View {
        Text(text)
            .font(.tbLabel(size, weight: .semibold))
            .tracking(tracking)
            .foregroundColor(color)
    }
}

typealias EditorialField = InputField
typealias EditorialSecureField = SecureInputField
typealias CommitButton = PrimaryButton
typealias GhostButton = OutlineButton
typealias FooterLink = TextButton

// MARK: - Translucent menubar material

struct VisualEffectBackground: NSViewRepresentable {
    var material: NSVisualEffectView.Material = .menu
    var blending: NSVisualEffectView.BlendingMode = .behindWindow

    func makeNSView(context: Context) -> NSVisualEffectView {
        let v = NSVisualEffectView()
        v.material = material
        v.blendingMode = blending
        v.state = .active
        v.isEmphasized = true
        return v
    }
    func updateNSView(_ v: NSVisualEffectView, context: Context) {
        v.material = material
        v.blendingMode = blending
    }
}

// MARK: - Tabs

enum AppTab: String, CaseIterable, Identifiable {
    case status, blocklist, schedule, settings
    var id: String { rawValue }
    var title: String {
        switch self {
        case .status:    return "Status"
        case .blocklist: return "Blocklist"
        case .schedule:  return "Schedule"
        case .settings:  return "Settings"
        }
    }
    var icon: String {
        switch self {
        case .status:    return "shield.lefthalf.filled"
        case .blocklist: return "list.bullet.rectangle"
        case .schedule:  return "calendar"
        case .settings:  return "gearshape"
        }
    }
}

struct TabBar: View {
    @Binding var selection: AppTab
    @Namespace private var underline

    var body: some View {
        HStack(spacing: 22) {
            ForEach(AppTab.allCases) { tab in
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                        selection = tab
                    }
                } label: {
                    VStack(spacing: 6) {
                        Text(tab.title)
                            .font(.system(size: 12.5, weight: .semibold))
                            .foregroundColor(selection == tab ? .tbText : .tbTextMuted)
                        ZStack {
                            Rectangle().fill(Color.clear).frame(height: 2)
                            if selection == tab {
                                Capsule()
                                    .fill(Color.tbAccentHi)
                                    .frame(height: 2)
                                    .matchedGeometryEffect(id: "tab-underline", in: underline)
                            }
                        }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
            Spacer(minLength: 0)
        }
    }
}

// MARK: - Mini stat tile

struct MiniStat: View {
    let label: String
    let value: String
    var accent: Color = .tbText
    var icon: String? = nil
    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label.uppercased())
                .font(.system(size: 9, weight: .bold))
                .tracking(0.8)
                .foregroundColor(.tbTextMuted)
            Text(value)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(accent)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 11)
        .padding(.vertical, 9)
        .background(Color.tbCardBg)
        .cornerRadius(10)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.white.opacity(0.06), lineWidth: 1))
    }
}

// MARK: - Reload chip (used in the header)

struct ReloadChip: View {
    let action: () -> Void
    @State private var hovered = false
    @State private var spinning = false
    var body: some View {
        Button {
            withAnimation(.easeInOut(duration: 0.5)) { spinning.toggle() }
            action()
        } label: {
            Image(systemName: "arrow.clockwise")
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(hovered ? .tbText : .tbTextMuted)
                .rotationEffect(.degrees(spinning ? 360 : 0))
                .frame(width: 24, height: 24)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { hovered = $0 }
    }
}

// MARK: - Status dot (small live indicator)

struct StatusDot: View {
    let color: Color
    var body: some View {
        ZStack {
            Circle().fill(color.opacity(0.25)).frame(width: 12, height: 12)
            Circle().fill(color).frame(width: 7, height: 7)
        }
    }
}
