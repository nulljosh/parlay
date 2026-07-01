import SwiftUI

@main
struct LingoApp: App {
    @State private var auth = AuthStore()
    @State private var store = ContentStore()

    var body: some Scene {
        WindowGroup {
            Group {
                if auth.isLoading {
                    ProgressView()
                } else if auth.isSignedIn {
                    CatalogView(store: store, auth: auth)
                } else {
                    AuthView(auth: auth)
                }
            }
            .tint(Color(hex: "5B9BD5"))
            .overlay { WhatsNewSheet() }
        }
    }
}
