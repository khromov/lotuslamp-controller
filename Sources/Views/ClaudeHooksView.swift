import SwiftUI

struct ClaudeHooksView: View {
    @Binding var isPresented: Bool

    private let cliPath = Bundle.main.bundlePath + "/Contents/Resources/maclotus"

    @State private var hooksInstalled = false
    @State private var statusMessage: String? = nil
    @State private var statusIsError = false

    private let settingsPath = NSHomeDirectory() + "/.claude/settings.json"

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                Text("Claude Code Hooks")
                    .font(.title3.bold())
                Spacer()
                Button("Done") { isPresented = false }
                    .keyboardShortcut(.escape)
            }
            .padding()

            Divider()

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    section("About") {
                        Text("Automatically change your lamp color based on Claude Code session events. Hooks are written to `~/.claude/settings.json`.")
                            .fixedSize(horizontal: false, vertical: true)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Divider()

                    section("Hooks") {
                        VStack(alignment: .leading, spacing: 8) {
                            hookRow(color: .yellow, event: "SessionStart", description: "Yellow — Claude session started")
                            hookRow(color: .green, event: "UserPromptSubmit", description: "Green — Prompt submitted")
                            hookRow(color: .orange, event: "Stop", description: "Orange — Claude stopped")
                            hookRow(color: .orange, event: "Notification", description: "Orange — Notification event")
                            hookRow(color: .gray, event: "SessionEnd", description: "Lamp off — Session ended")
                        }
                    }

                    Divider()

                    section("Status") {
                        HStack(spacing: 8) {
                            Circle()
                                .fill(hooksInstalled ? Color.green : Color.gray)
                                .frame(width: 8, height: 8)
                            Text(hooksInstalled ? "Hooks are installed" : "Hooks are not installed")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Button(hooksInstalled ? "Uninstall Hooks" : "Install Hooks") {
                            if hooksInstalled {
                                uninstallHooks()
                            } else {
                                installHooks()
                            }
                        }
                        .padding(.top, 4)

                        if let msg = statusMessage {
                            Text(msg)
                                .font(.caption)
                                .foregroundStyle(statusIsError ? Color.red : Color.green)
                                .fixedSize(horizontal: false, vertical: true)
                                .padding(.top, 2)
                        }
                    }

                    Divider()

                    section("Notes") {
                        VStack(alignment: .leading, spacing: 6) {
                            bullet("Installing replaces the entire `hooks` key in settings.json.")
                            bullet("Other settings (model, statusLine, etc.) are preserved.")
                            bullet("The CLI binary path is derived from the current app location.")
                        }
                    }
                }
                .padding()
            }
        }
        .frame(width: 480, height: 520)
        .onAppear { checkHooksInstalled() }
    }

    // MARK: - Hook check/install/uninstall

    private func checkHooksInstalled() {
        guard let data = try? Data(contentsOf: URL(fileURLWithPath: settingsPath)),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let hooks = json["hooks"] as? [String: Any] else {
            hooksInstalled = false
            return
        }
        let allValues = String(describing: hooks)
        hooksInstalled = allValues.contains("maclotus")
    }

    private func installHooks() {
        let claudeDir = NSHomeDirectory() + "/.claude"
        let fm = FileManager.default

        do {
            if !fm.fileExists(atPath: claudeDir) {
                try fm.createDirectory(atPath: claudeDir, withIntermediateDirectories: true)
            }

            var existing: [String: Any] = [:]
            if let data = try? Data(contentsOf: URL(fileURLWithPath: settingsPath)),
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                existing = json
            }

            existing["hooks"] = buildHooksPayload()

            let data = try JSONSerialization.data(withJSONObject: existing, options: [.prettyPrinted, .sortedKeys])
            try data.write(to: URL(fileURLWithPath: settingsPath))

            hooksInstalled = true
            statusIsError = false
            statusMessage = "Hooks installed successfully."
        } catch {
            statusIsError = true
            statusMessage = "Failed to install hooks: \(error.localizedDescription)"
        }
    }

    private func uninstallHooks() {
        do {
            guard var existing: [String: Any] = {
                guard let data = try? Data(contentsOf: URL(fileURLWithPath: settingsPath)),
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
                return json
            }() else {
                hooksInstalled = false
                statusIsError = false
                statusMessage = "Hooks removed (settings file not found)."
                return
            }

            existing.removeValue(forKey: "hooks")

            let data = try JSONSerialization.data(withJSONObject: existing, options: [.prettyPrinted, .sortedKeys])
            try data.write(to: URL(fileURLWithPath: settingsPath))

            hooksInstalled = false
            statusIsError = false
            statusMessage = "Hooks uninstalled successfully."
        } catch {
            statusIsError = true
            statusMessage = "Failed to uninstall hooks: \(error.localizedDescription)"
        }
    }

    private func buildHooksPayload() -> [String: Any] {
        let cli = cliPath
        return [
            "SessionStart": [
                ["hooks": [["type": "command", "command": "\(cli) color yellow"]]]
            ],
            "UserPromptSubmit": [
                ["hooks": [["type": "command", "command": "\(cli) color green"]]]
            ],
            "Stop": [
                ["hooks": [["type": "command", "command": "\(cli) color orange"]]]
            ],
            "Notification": [
                ["hooks": [["type": "command", "command": "\(cli) color orange"]]]
            ],
            "SessionEnd": [
                ["hooks": [["type": "command", "command": "\(cli) off"]]]
            ]
        ]
    }

    // MARK: - Helpers

    @ViewBuilder
    private func section(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
            content()
        }
    }

    @ViewBuilder
    private func hookRow(color: Color, event: String, description: String) -> some View {
        HStack(spacing: 10) {
            Circle()
                .fill(color)
                .frame(width: 10, height: 10)
            VStack(alignment: .leading, spacing: 1) {
                Text(event)
                    .font(.system(.caption, design: .monospaced))
                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
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
