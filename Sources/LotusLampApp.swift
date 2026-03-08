import SwiftUI

@main
struct LotusLampApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        // No window — all UI is in the status bar popover
        Settings {
            EmptyView()
        }
    }
}
