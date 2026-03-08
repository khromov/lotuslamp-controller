# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This repo contains two separate deliverables:

1. **Web app** (repo root) — `index.html`, `bluetooth.js`, `app.js`, `styles.css`
   A vanilla JS Web Bluetooth app. No build step; open `index.html` directly or serve with `npx serve`.

2. **macOS status bar app + CLI** (`LotusLamp/`) — Swift/SwiftUI, built with XcodeGen

## macOS App — Build Commands

Regenerate Xcode project after editing `project.yml`:
```bash
cd LotusLamp && xcodegen generate
```

Build the GUI app:
```bash
cd LotusLamp && xcodebuild -project LotusLamp.xcodeproj -scheme LotusLamp -configuration Debug build
```

Build the CLI tool:
```bash
cd LotusLamp && xcodebuild -project LotusLamp.xcodeproj -scheme lotuslamp-cli -configuration Debug build
```

There are no automated tests.

## Architecture

### Web App

- `bluetooth.js` — all BLE logic: scanning, connecting, characteristic discovery, and `findServiceAndCharacteristic()` which selects the best writable characteristic
- `app.js` — UI logic, software pattern animations (Cycle, Fade, Pulse, etc.), localStorage for favorites/custom patterns
- `index.html` — single-page UI with color picker, sliders, preset colors, effects, mode explorer

### macOS App (`LotusLamp/LotusLamp/`)

- `BLEConstants.swift` — service/characteristic UUIDs, `lastPeripheralUUIDKey` for auto-reconnect
- `LampCommand.swift` — all 9-byte BLE command builders (power, color, brightness, effect, speed)
- `BLEManager.swift` — `ObservableObject` CoreBluetooth manager; debounces color/brightness/speed sends by 100 ms; auto-reconnects on launch via saved UUID in `UserDefaults`
- `AppDelegate.swift` — `NSStatusItem` + `NSPopover` (320×400 pt) hosting `MainPopoverView`
- `Views/` — SwiftUI views: `MainPopoverView`, `ConnectionView`, `ControlsView`, `CLIHelpView`

### CLI Tool (`LotusLamp/CLI/`)

- `main.swift` — `ArgumentParser` commands: `on`, `off`, `color <hex|preset>`, `colors`
- `CLIBLEManager.swift` — synchronous BLE manager using `CFRunLoopRun`/`CFRunLoopStop`; auto-connects via UUID saved by the GUI app (`UserDefaults(suiteName: "com.lotuslamp.controller")`); 10-second timeout
- Shares `LampCommand.swift`, `BLEConstants.swift`, `PresetColor.swift`, `EffectMode.swift` with the GUI target

## BLE Protocol

All commands are 9-byte packets: `7E [7 bytes] EF`. The characteristic selection logic in both `BLEManager.swift` and `CLIBLEManager.swift` must stay in sync with `bluetooth.js`'s `findServiceAndCharacteristic()`:

- Skip standard BLE services (Generic Access 1800, Generic Attribute 1801)
- Prefer characteristics whose UUID contains `fff` or `ffe`
- Prefer `writeWithoutResponse` when available
- Always send the init packet (`7E 06 83 0F 20 0C 06 00 EF`) immediately after connecting

## Swift Gotchas

- Swift does not support negative range patterns in `switch` for `Int` — use `if/else` instead
- `project.yml` is the source of truth for the Xcode project; edit it and re-run `xcodegen generate` rather than editing `project.pbxproj` directly
