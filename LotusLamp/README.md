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

## Building

Requires Xcode 15+ and [XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
cd LotusLamp
xcodegen generate
xcodebuild -project LotusLamp.xcodeproj -scheme LotusLamp -configuration Debug build
```

To build just the CLI:

```bash
xcodebuild -project LotusLamp.xcodeproj -scheme lotuslamp-cli -configuration Debug build
```
