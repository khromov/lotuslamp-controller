import SwiftUI

struct CLIHelpView: View {
    @Binding var isPresented: Bool

    private let cliPath = Bundle.main.bundlePath + "/Contents/Resources/lotuslamp"

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
                        Text("The CLI binary is bundled at:")
                        codeBlock(cliPath)
                        Text("Symlink it to your PATH for easy access:")
                        codeBlock("ln -sf \"\(cliPath)\" /usr/local/bin/lotuslamp")
                        Text("After symlinking, you can use `lotuslamp` directly.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Divider()

                    section("Usage") {
                        Group {
                            label("Turn on")
                            codeBlock("\(cliPath) on")

                            label("Turn off")
                            codeBlock("\(cliPath) off")

                            label("Set color by name")
                            codeBlock("\(cliPath) color red")

                            label("Set color by hex")
                            codeBlock("\(cliPath) color FF8800")

                            label("List preset colors")
                            codeBlock("\(cliPath) colors")

                            label("Connect to a specific device")
                            codeBlock("\(cliPath) on --device \"My Lamp\"")
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
        .frame(width: 480, height: 520)
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
        HStack(alignment: .top, spacing: 0) {
            Text(code)
                .font(.system(.caption, design: .monospaced))
                .padding(8)
                .frame(maxWidth: .infinity, alignment: .leading)
                .fixedSize(horizontal: false, vertical: true)

            Button {
                NSPasteboard.general.clearContents()
                NSPasteboard.general.setString(code, forType: .string)
            } label: {
                Image(systemName: "doc.on.doc")
                    .font(.caption)
                    .padding(8)
            }
            .buttonStyle(.plain)
            .foregroundStyle(.secondary)
            .help("Copy to clipboard")
        }
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
