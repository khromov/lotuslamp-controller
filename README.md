# LotusLamp Controller

macOS status bar app and CLI tool for controlling a BLE LED lightbulb.

## Features

- Connect to the lamp via Bluetooth from the menu bar
- Set color (color picker or presets: Red, Orange, Yellow, Green, Cyan, Blue, Purple, Magenta, Pink, White, Warm, Cool)
- Adjust brightness and lighting effects with speed control
- Auto-reconnects to the last connected device on launch
- Optional launch at login

## CLI

```bash
lotuslamp on
lotuslamp off
lotuslamp color red
lotuslamp color "#FF6A00"
lotuslamp colors        # list all preset names
lotuslamp --device "My Lamp" on   # target by name
```

## Installation

Download `LotusLamp.dmg` from [Releases](../../releases), open it, and drag LotusLamp to Applications.

To use the CLI after installation:

```bash
ln -sf /Applications/LotusLamp.app/Contents/Resources/lotuslamp /usr/local/bin/lotuslamp
```

## Building

Requires Xcode 15+ and [XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
xcodegen generate
xcodebuild -project LotusLamp.xcodeproj -scheme LotusLamp -configuration Debug build
```

To build just the CLI:

```bash
xcodebuild -project LotusLamp.xcodeproj -scheme lotuslamp-cli -configuration Debug build
```

### Release build (signed + notarized DMG)

Set up notarization credentials once:

```bash
xcrun notarytool store-credentials "LotusLamp" \
  --apple-id "your@email.com" \
  --team-id "36S2252ZTN" \
  --password "app-specific-password"
```

Then build:

```bash
./scripts/build-release.sh              # full build + notarize
./scripts/build-release.sh --skip-notarize  # skip notarization (quick test)
```
