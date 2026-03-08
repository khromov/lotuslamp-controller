import ArgumentParser
import Foundation

struct GlobalOptions: ParsableArguments {
    @Option(name: .long, help: "Connect to peripheral by name (case-insensitive). Defaults to last connected device.")
    var device: String?
}

struct LotusLampCLI: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "lotuslamp",
        abstract: "Control your LotusLamp from the command line.",
        subcommands: [On.self, Off.self, ColorCommand.self, Colors.self]
    )
}

struct On: ParsableCommand {
    static let configuration = CommandConfiguration(abstract: "Turn the lamp on.")
    @OptionGroup var options: GlobalOptions

    func run() throws {
        let manager = CLIBLEManager(deviceName: options.device)
        manager.execute(command: LampCommand.powerOn)
    }
}

struct Off: ParsableCommand {
    static let configuration = CommandConfiguration(abstract: "Turn the lamp off.")
    @OptionGroup var options: GlobalOptions

    func run() throws {
        let manager = CLIBLEManager(deviceName: options.device)
        manager.execute(command: LampCommand.powerOff)
    }
}

struct ColorCommand: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "color",
        abstract: "Set the lamp color. Accepts a hex value (e.g. FF0000) or preset name (e.g. red)."
    )

    @Argument(help: "Hex color (FF0000 or #FF0000) or preset name.")
    var colorValue: String

    @OptionGroup var options: GlobalOptions

    func run() throws {
        let (r, g, b) = try parseColor(colorValue)
        let manager = CLIBLEManager(deviceName: options.device)
        manager.execute(command: LampCommand.setColor(r: r, g: g, b: b))
    }

    private func parseColor(_ input: String) throws -> (UInt8, UInt8, UInt8) {
        // Try preset name first
        let lower = input.lowercased()
        if let preset = PresetColor.all.first(where: { $0.name.lowercased() == lower }) {
            return (preset.r, preset.g, preset.b)
        }

        // Try hex: strip leading #
        let hex = input.hasPrefix("#") ? String(input.dropFirst()) : input
        guard hex.count == 6, let value = UInt32(hex, radix: 16) else {
            throw ValidationError("'\(input)' is not a valid hex color or preset name. Run `lotuslamp colors` to see presets.")
        }
        let r = UInt8((value >> 16) & 0xFF)
        let g = UInt8((value >> 8) & 0xFF)
        let b = UInt8(value & 0xFF)
        return (r, g, b)
    }
}

struct Colors: ParsableCommand {
    static let configuration = CommandConfiguration(abstract: "List all preset color names and hex values.")

    func run() throws {
        print("Preset colors:")
        for preset in PresetColor.all {
            let hex = String(format: "%02X%02X%02X", preset.r, preset.g, preset.b)
            print("  \(preset.name.padding(toLength: 12, withPad: " ", startingAt: 0)) #\(hex)")
        }
    }
}

LotusLampCLI.main()
