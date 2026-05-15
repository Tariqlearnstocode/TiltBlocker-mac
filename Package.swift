// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "TiltBlocker",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "TiltBlocker",
            path: "Sources/TiltBlocker"
        )
    ]
)
