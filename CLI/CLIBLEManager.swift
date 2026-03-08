import CoreBluetooth
import Foundation

/// Synchronous BLE manager for CLI use. Connects, sends a command, then exits.
final class CLIBLEManager: NSObject {
    private let deviceName: String?
    private var command: Data?

    private var central: CBCentralManager!
    private var peripheral: CBPeripheral?
    private var writeCharacteristic: CBCharacteristic?
    private var writeType: CBCharacteristicWriteType = .withoutResponse
    private var commandSent = false

    init(deviceName: String?) {
        self.deviceName = deviceName
        super.init()
    }

    /// Connect to the lamp, send the command, and block until done (or timeout).
    func execute(command: Data) {
        fputs("[BLE] execute() called\n", stderr)
        self.command = command
        central = CBCentralManager(delegate: self, queue: .main)
        fputs("[BLE] CBCentralManager created\n", stderr)

        // 10-second timeout
        DispatchQueue.main.asyncAfter(deadline: .now() + 10) {
            if !self.commandSent {
                fputs("Error: timed out waiting for lamp connection.\n", stderr)
                CFRunLoopStop(CFRunLoopGetMain())
            }
        }

        CFRunLoopRun()
    }

    // MARK: - Characteristic selection (mirrors BLEManager.swift)

    private func selectCharacteristic(from peripheral: CBPeripheral) -> (CBCharacteristic, CBCharacteristicWriteType)? {
        guard let services = peripheral.services else { return nil }

        var candidates: [CBCharacteristic] = []
        for service in services {
            let uuidLower = service.uuid.uuidString.lowercased()
            let isStandard = BLEConstants.standardServicePrefixes.contains(where: { uuidLower.hasPrefix($0) })
            if isStandard { continue }

            guard let characteristics = service.characteristics else { continue }
            for char in characteristics {
                let props = char.properties
                if props.contains(.write) || props.contains(.writeWithoutResponse) {
                    candidates.append(char)
                }
            }
        }

        guard !candidates.isEmpty else { return nil }

        let preferred = candidates.first(where: { char in
            let uuidLower = char.uuid.uuidString.lowercased()
            return BLEConstants.preferredUUIDSubstrings.contains(where: { uuidLower.contains($0) })
        }) ?? candidates.first!

        let type: CBCharacteristicWriteType = preferred.properties.contains(.writeWithoutResponse)
            ? .withoutResponse : .withResponse

        return (preferred, type)
    }

    private func sendCommand(_ data: Data) {
        guard let char = writeCharacteristic, let p = peripheral else { return }
        p.writeValue(data, for: char, type: writeType)
    }

    private func finish() {
        commandSent = true
        CFRunLoopStop(CFRunLoopGetMain())
    }

    /// Read the last peripheral UUID from the shared file written by the GUI app.
    private func readSavedUUID() -> String? {
        let url = BLEConstants.deviceUUIDFileURL
        guard let uuidString = try? String(contentsOf: url, encoding: .utf8)
                .trimmingCharacters(in: .whitespacesAndNewlines),
              !uuidString.isEmpty else {
            fputs("[BLE] no saved UUID at \(url.path)\n", stderr)
            return nil
        }
        return uuidString
    }
}

// MARK: - CBCentralManagerDelegate

extension CLIBLEManager: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        fputs("[BLE] state: \(central.state.rawValue)\n", stderr)
        guard central.state == .poweredOn else {
            fputs("Error: Bluetooth is not available (state: \(central.state.rawValue)).\n", stderr)
            CFRunLoopStop(CFRunLoopGetMain())
            return
        }

        if let name = deviceName {
            fputs("[BLE] scanning for '\(name)'...\n", stderr)
            central.scanForPeripherals(withServices: nil, options: [
                CBCentralManagerScanOptionAllowDuplicatesKey: false
            ])
        } else if let savedUUID = readSavedUUID(), let uuid = UUID(uuidString: savedUUID) {
            fputs("[BLE] trying saved UUID: \(savedUUID)\n", stderr)
            let known = central.retrievePeripherals(withIdentifiers: [uuid])
            fputs("[BLE] retrievePeripherals returned \(known.count) peripheral(s)\n", stderr)
            if let p = known.first {
                fputs("[BLE] connecting to '\(p.name ?? "unnamed")'...\n", stderr)
                peripheral = p
                p.delegate = self
                central.connect(p, options: nil)
            } else {
                fputs("Error: saved device not found. Make sure the lamp is on and nearby.\n", stderr)
                CFRunLoopStop(CFRunLoopGetMain())
            }
        } else {
            fputs("Error: no saved device. Connect via the GUI app first, or use --device NAME.\n", stderr)
            CFRunLoopStop(CFRunLoopGetMain())
        }
    }

    func centralManager(_ central: CBCentralManager,
                        didDiscover peripheral: CBPeripheral,
                        advertisementData: [String: Any],
                        rssi RSSI: NSNumber) {
        let name = peripheral.name
            ?? advertisementData[CBAdvertisementDataLocalNameKey] as? String
            ?? ""

        guard let target = deviceName else { return }
        let match = name.lowercased() == target.lowercased()
        fputs("[BLE] discovered: '\(name)' match=\(match)\n", stderr)
        guard match else { return }

        central.stopScan()
        self.peripheral = peripheral
        peripheral.delegate = self
        fputs("[BLE] connecting to '\(name)'...\n", stderr)
        central.connect(peripheral, options: nil)
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        fputs("[BLE] connected to '\(peripheral.name ?? "unnamed")'\n", stderr)
        peripheral.discoverServices(nil)
    }

    func centralManager(_ central: CBCentralManager,
                        didFailToConnect peripheral: CBPeripheral,
                        error: Error?) {
        fputs("Error: failed to connect: \(error?.localizedDescription ?? "unknown")\n", stderr)
        CFRunLoopStop(CFRunLoopGetMain())
    }
}

// MARK: - CBPeripheralDelegate

extension CLIBLEManager: CBPeripheralDelegate {
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard error == nil, let services = peripheral.services else {
            fputs("Error: service discovery failed.\n", stderr)
            CFRunLoopStop(CFRunLoopGetMain())
            return
        }
        fputs("[BLE] discovered \(services.count) service(s)\n", stderr)
        for service in services {
            peripheral.discoverCharacteristics(nil, for: service)
        }
    }

    func peripheral(_ peripheral: CBPeripheral,
                    didDiscoverCharacteristicsFor service: CBService,
                    error: Error?) {
        guard let services = peripheral.services else { return }
        let allDone = services.allSatisfy { $0.characteristics != nil }
        guard allDone else { return }

        fputs("[BLE] all characteristics discovered\n", stderr)

        guard let (char, type) = selectCharacteristic(from: peripheral) else {
            fputs("Error: no writable characteristic found.\n", stderr)
            CFRunLoopStop(CFRunLoopGetMain())
            return
        }

        fputs("[BLE] using characteristic: \(char.uuid), writeType: \(type.rawValue)\n", stderr)
        writeCharacteristic = char
        writeType = type

        fputs("[BLE] sending init packet...\n", stderr)
        sendCommand(LampCommand.initialize)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
            guard let self, let cmd = self.command else { return }
            fputs("[BLE] sending command...\n", stderr)
            self.sendCommand(cmd)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                fputs("[BLE] done\n", stderr)
                self.finish()
            }
        }
    }
}
