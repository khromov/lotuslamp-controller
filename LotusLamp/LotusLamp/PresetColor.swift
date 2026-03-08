import SwiftUI

struct PresetColor: Identifiable {
    let id = UUID()
    let name: String
    let r: UInt8
    let g: UInt8
    let b: UInt8

    var color: Color {
        Color(red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255)
    }

    static let all: [PresetColor] = [
        PresetColor(name: "Red",        r: 255, g: 0,   b: 0),
        PresetColor(name: "Orange",     r: 255, g: 165, b: 0),
        PresetColor(name: "Yellow",     r: 255, g: 255, b: 0),
        PresetColor(name: "Green",      r: 0,   g: 255, b: 0),
        PresetColor(name: "Cyan",       r: 0,   g: 255, b: 255),
        PresetColor(name: "Blue",       r: 0,   g: 0,   b: 255),
        PresetColor(name: "Purple",     r: 128, g: 0,   b: 128),
        PresetColor(name: "Magenta",    r: 255, g: 0,   b: 255),
        PresetColor(name: "Pink",       r: 255, g: 192, b: 203),
        PresetColor(name: "White",      r: 255, g: 255, b: 255),
        PresetColor(name: "Warm",       r: 255, g: 247, b: 200),
        PresetColor(name: "Cool",       r: 200, g: 220, b: 255),
    ]
}
