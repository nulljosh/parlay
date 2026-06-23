import SwiftUI

@main
struct LingoApp: App {
    @State private var store = ContentStore()

    var body: some Scene {
        WindowGroup {
            CatalogView(store: store)
        }
    }
}
