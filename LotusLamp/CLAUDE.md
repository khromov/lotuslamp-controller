# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
# Regenerate Xcode project from project.yml (required after adding/removing files)
cd LotusLamp && xcodegen generate

# Build the macOS status bar app
xcodebuild -project LotusLamp.xcodeproj -scheme LotusLamp -configuration Debug build

# Build the CLI tool
xcodebuild -project LotusLamp.xcodeproj -scheme lotuslamp-cli -configuration Debug build
```

No test targets exist in this project.

## Architecture

Two targets share core BLE protocol files:

**macOS Status Bar App (`LotusLamp/` sources)**
- `AppDelegate.swift` — `NSStatusItem` + `NSPopover`; creates `BLEManager` and passes it as an `@EnvironmentObject`
- `BLEManager.swift` — `ObservableObject` wrapping `CoreBluetooth`; holds all lamp state locally (write-only BLE protocol means no read-back from device)
- `LampCommand.swift` — static factory for all 9-byte BLE packets (`7E … EF`)
- `BLEConstants.swift` — service/characteristic UUIDs and filtering rules
- `Views/MainPopoverView.swift` → `ConnectionView.swift` + `ControlsView.swift` — SwiftUI popover UI
- `PresetColor.swift`, `EffectMode.swift` — data types for UI color/effect pickers

**CLI (`CLI/` sources)**
- `main.swift` — `ArgumentParser` commands: `on`, `off`, `color <hex|preset>`, `colors`
- `CLIBLEManager.swift` — synchronous BLE wrapper (blocks via `RunLoop`) for CLI use
- Shares `LampCommand.swift`, `BLEConstants.swift`, `PresetColor.swift`, `EffectMode.swift` with the app target

## BLE Protocol

All commands are 9-byte packets: `7E [payload bytes] EF`

| Command | Bytes |
|---|---|
| Init (send after connect) | `7E 06 83 0F 20 0C 06 00 EF` |
| Power on | `7E 07 04 FF 00 01 02 01 EF` |
| Power off | `7E 07 04 00 00 00 02 01 EF` |
| Set color (R G B) | `7E 07 05 03 R G B 10 EF` |
| Set brightness (1–100) | `7E 04 01 V 01 FF 02 01 EF` |
| Set effect mode | `7E 07 03 M 03 FF FF 00 EF` |
| Set effect speed (1–100) | `7E 07 02 V FF FF FF 00 EF` |

Characteristic selection mirrors `bluetooth.js`: prefer writable chars whose UUID contains `fff` or `ffe`; skip standard BLE services (1800/1801).

## Key Notes

- Swift `switch` on `Int` ranges with negative values doesn't compile — use `if`/`else` chains instead
- Lamp state is tracked locally only (`@Published` vars in `BLEManager`); the device does not send state back
- Color and brightness sends are debounced 100ms via `DispatchWorkItem` to avoid flooding BLE
- Auto-reconnect on launch: last peripheral UUID is persisted in `UserDefaults` under `BLEConstants.lastPeripheralUUIDKey`
- Code signing is disabled (`CODE_SIGN_IDENTITY: "-"`, `CODE_SIGNING_REQUIRED: NO`) — no entitlement issues
