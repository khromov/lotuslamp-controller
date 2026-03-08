import SwiftUI

@main
struct MacLotusApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        // No window — all UI is in the status bar popover
        Settings {
            EmptyView()
        }
    }
}
