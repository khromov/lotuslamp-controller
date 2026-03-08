import SwiftUI

struct CLIHelpView: View {
    @Binding var isPresented: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                Text("CLI Tool")
                    .font(.title3.bold())
                Spacer()
                Button("Done") { isPresented = false }
                    .keyboardShortcut(.escape)
            }
            .padding()

            Divider()

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    section("Installation") {
                        Text("After building, symlink or copy the binary to a directory in your PATH:")
                        codeBlock("""
ln -s /path/to/lotuslamp /usr/local/bin/lotuslamp
""")
                        Text("Or build and install in one step with Xcode:")
                        codeBlock("""
xcodebuild -scheme lotuslamp-cli -configuration Release \\
  SYMROOT=/usr/local/bin build
""")
                    }

                    Divider()

                    section("Usage") {
                        Group {
                            label("Turn on")
                            codeBlock("lotuslamp on")

                            label("Turn off")
                            codeBlock("lotuslamp off")

                            label("Set color by name")
                            codeBlock("lotuslamp color red")

                            label("Set color by hex")
                            codeBlock("lotuslamp color FF8800")

                            label("List preset colors")
                            codeBlock("lotuslamp colors")

                            label("Connect to a specific device")
                            codeBlock("lotuslamp on --device \"My Lamp\"")
                        }
                    }

                    Divider()

                    section("Notes") {
                        VStack(alignment: .leading, spacing: 6) {
                            bullet("Without --device, the CLI reuses the last connected device from the GUI app.")
                            bullet("On first run, macOS may prompt for Bluetooth access.")
                            bullet("Commands time out after 10 seconds if the lamp is unreachable.")
                        }
                    }
                }
                .padding()
            }
        }
        .frame(width: 420, height: 480)
    }

    @ViewBuilder
    private func section(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
            content()
        }
    }

    @ViewBuilder
    private func label(_ text: String) -> some View {
        Text(text)
            .font(.subheadline)
            .foregroundStyle(.secondary)
            .padding(.top, 4)
    }

    @ViewBuilder
    private func codeBlock(_ code: String) -> some View {
        Text(code)
            .font(.system(.caption, design: .monospaced))
            .padding(8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(nsColor: .controlBackgroundColor))
            .cornerRadius(6)
    }

    @ViewBuilder
    private func bullet(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Text("•").foregroundStyle(.secondary)
            Text(text).fixedSize(horizontal: false, vertical: true)
        }
        .font(.caption)
    }
}
