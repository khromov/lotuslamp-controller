import SwiftUI
import ServiceManagement

struct MainPopoverView: View {
    @EnvironmentObject var ble: BLEManager

    @State private var launchAtLogin = SMAppService.mainApp.status == .enabled
    @State private var showCLIHelp = false

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundStyle(.yellow)
                Text("LotusLamp")
                    .font(.title3.bold())
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.top, 14)
            .padding(.bottom, 10)

            Divider()

            ScrollView {
                VStack(spacing: 12) {
                    ConnectionView()

                    if ble.connectionStatus.isConnected {
                        ControlsView()
                            .padding(12)
                            .background(Color(nsColor: .controlBackgroundColor).opacity(0.5))
                            .cornerRadius(8)
                    }
                }
                .padding(10)
            }
            .frame(maxHeight: 520)

            Divider()

            // Footer
            HStack(spacing: 8) {
                Toggle("Start on Login", isOn: $launchAtLogin)
                    .toggleStyle(.switch)
                    .controlSize(.small)
                    .onChange(of: launchAtLogin) { newValue in
                        do {
                            if newValue {
                                try SMAppService.mainApp.register()
                            } else {
                                try SMAppService.mainApp.unregister()
                            }
                        } catch {
                            // Revert on failure
                            launchAtLogin = !newValue
                        }
                    }

                Spacer()

                Button("CLI") {
                    showCLIHelp = true
                }
                .buttonStyle(.plain)
                .font(.caption)
                .foregroundStyle(.secondary)

                Button("Quit") {
                    NSApplication.shared.terminate(nil)
                }
                .buttonStyle(.plain)
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
        }
        .frame(width: 320)
        .sheet(isPresented: $showCLIHelp) {
            CLIHelpView(isPresented: $showCLIHelp)
        }
    }
}
