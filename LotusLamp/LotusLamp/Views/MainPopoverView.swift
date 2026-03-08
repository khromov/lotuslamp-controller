import SwiftUI

struct MainPopoverView: View {
    @EnvironmentObject var ble: BLEManager

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
            HStack {
                Spacer()
                Button("Quit") {
                    NSApplication.shared.terminate(nil)
                }
                .buttonStyle(.plain)
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
            }
        }
        .frame(width: 320)
    }
}
