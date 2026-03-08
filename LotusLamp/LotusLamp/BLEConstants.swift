import CoreBluetooth

enum BLEConstants {
    // Service UUIDs to scan for (matching bluetooth.js)
    static let serviceUUIDs: [CBUUID] = [
        CBUUID(string: "FFF0"),
        CBUUID(string: "FFE0"),
        CBUUID(string: "FFD0"),
        CBUUID(string: "FFE5"),
        CBUUID(string: "FFD5"),
        CBUUID(string: "FF00"),
        CBUUID(string: "FF01"),
        CBUUID(string: "FFB0"),
    ]

    // All known writable characteristic UUIDs
    static let characteristicUUIDs: [CBUUID] = [
        CBUUID(string: "FFF3"),
        CBUUID(string: "FFE1"),
        CBUUID(string: "FFE9"),
        CBUUID(string: "FFD9"),
    ]

    // Standard BLE services to skip when searching for the lamp characteristic
    static let standardServicePrefixes = ["00001800", "00001801"]

    // UUID substrings to prefer when selecting among writable characteristics
    static let preferredUUIDSubstrings = ["fff", "ffe"]

    static let lastPeripheralUUIDKey = "lastPeripheralUUID"
}
