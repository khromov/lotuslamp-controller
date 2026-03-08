# MacLotus

macOS status bar app and CLI tool for controlling a BLE LED lightbulb.

## Features

- Connect to the lamp via Bluetooth from the menu bar
- Set color (color picker or presets: Red, Orange, Yellow, Green, Cyan, Blue, Purple, Magenta, Pink, White, Warm, Cool)
- Adjust brightness and lighting effects with speed control
- Auto-reconnects to the last connected device on launch
- Optional launch at login

## CLI

```bash
maclotus on
maclotus off
maclotus color red
maclotus color "#FF6A00"
maclotus colors        # list all preset names
maclotus --device "My Lamp" on   # target by name
```

## Installation

Download `MacLotus.dmg` from [Releases](../../releases), open it, and drag MacLotus to Applications.

To use the CLI after installation:

```bash
ln -sf /Applications/MacLotus.app/Contents/Resources/maclotus /usr/local/bin/maclotus
```

## Building

Requires Xcode 15+ and [XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
xcodegen generate
xcodebuild -project MacLotus.xcodeproj -scheme MacLotus -configuration Debug build
```

To build just the CLI:

```bash
xcodebuild -project MacLotus.xcodeproj -scheme maclotus-cli -configuration Debug build
```

### Release build (signed + notarized DMG)

Set up notarization credentials once:

```bash
xcrun notarytool store-credentials "MacLotus" \
  --apple-id "your@email.com" \
  --team-id "36S2252ZTN" \
  --password "app-specific-password"
```

Then build:

```bash
./scripts/build-release.sh              # full build + notarize
./scripts/build-release.sh --skip-notarize  # skip notarization (quick test)
```

## Misc notes

Effect 142 = pulsating yellow
