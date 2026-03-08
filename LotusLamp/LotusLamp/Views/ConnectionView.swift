import SwiftUI

struct ConnectionView: View {
    @EnvironmentObject var ble: BLEManager

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Bluetooth")
                    .font(.headline)
                Spacer()
                statusBadge
            }

            if ble.connectionStatus.isConnected {
                connectedView
            } else {
                disconnectedView
            }
        }
        .padding(12)
        .background(Color(nsColor: .controlBackgroundColor).opacity(0.5))
        .cornerRadius(8)
    }

    private var statusBadge: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)
            Text(ble.connectionStatus.label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private var statusColor: Color {
        switch ble.connectionStatus {
        case .connected: return .green
        case .scanning, .connecting: return .orange
        case .disconnected, .error: return .red
        }
    }

    private var connectedView: some View {
        HStack {
            Label(ble.connectedPeripheralName ?? "Device", systemImage: "lightbulb.fill")
                .font(.subheadline)
            Spacer()
            Button("Disconnect") {
                ble.disconnect()
            }
            .buttonStyle(.bordered)
            .controlSize(.small)
        }
    }

    private var disconnectedView: some View {
        VStack(spacing: 8) {
            if case .scanning = ble.connectionStatus {
                VStack(spacing: 8) {
                    HStack {
                        ProgressView()
                            .controlSize(.small)
                        Text("Scanning for devices...")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Button("Stop") { ble.stopScanning() }
                            .buttonStyle(.bordered)
                            .controlSize(.small)
                    }

                    if !ble.discoveredPeripherals.isEmpty {
                        Divider()
                        peripheralList
                    }
                }
            } else {
                Button(action: { ble.startScanning() }) {
                    Label("Scan for Devices", systemImage: "magnifyingglass")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.regular)
            }
        }
    }

    private var peripheralList: some View {
        VStack(spacing: 4) {
            ForEach(ble.discoveredPeripherals.sorted(by: { $0.rssi > $1.rssi })) { device in
                Button(action: { ble.connect(to: device) }) {
                    HStack {
                        Image(systemName: "wave.3.right")
                            .foregroundStyle(rssiColor(device.rssi))
                            .frame(width: 20)
                        Text(device.name)
                            .font(.subheadline)
                        Spacer()
                        Text("\(device.rssi) dBm")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                    .padding(.horizontal, 8)
                    .background(Color(nsColor: .controlBackgroundColor))
                    .cornerRadius(6)
                }
                .buttonStyle(.plain)
            }
        }
        .frame(maxHeight: 150)
    }

    private func rssiColor(_ rssi: Int) -> Color {
        if rssi >= -50 { return .green }
        if rssi >= -70 { return .yellow }
        return .orange
    }
}
