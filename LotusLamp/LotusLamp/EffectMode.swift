import Foundation

struct EffectMode: Identifiable, Hashable {
    let id: UInt8  // firmware mode number
    let name: String

    static let builtIn: [EffectMode] = [
        EffectMode(id: 135, name: "Jump RGB"),
        EffectMode(id: 136, name: "Jump All"),
        EffectMode(id: 137, name: "Fade R"),
        EffectMode(id: 138, name: "Fade G"),
        EffectMode(id: 139, name: "Fade B"),
        EffectMode(id: 140, name: "Fade Y"),
        EffectMode(id: 141, name: "Fade C"),
        EffectMode(id: 142, name: "Fade M"),
        EffectMode(id: 143, name: "Fade W"),
        EffectMode(id: 144, name: "Fade RGB"),
        EffectMode(id: 145, name: "Fade All"),
        EffectMode(id: 146, name: "Blink R"),
        EffectMode(id: 147, name: "Blink G"),
        EffectMode(id: 148, name: "Blink B"),
        EffectMode(id: 149, name: "Blink Y"),
        EffectMode(id: 150, name: "Blink C"),
        EffectMode(id: 151, name: "Blink M"),
        EffectMode(id: 152, name: "Blink W"),
        EffectMode(id: 153, name: "Blink RGB"),
        EffectMode(id: 154, name: "Blink All"),
        EffectMode(id: 155, name: "Effect 155"),
        EffectMode(id: 156, name: "Effect 156"),
    ]
}
