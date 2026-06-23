import SwiftUI

struct CatalogView: View {
    var store: ContentStore

    var body: some View {
        NavigationStack {
            List {
                if let catalog = store.catalog {
                    ForEach(Array(catalog.categories.keys.sorted()), id: \.self) { key in
                        let category = catalog.categories[key]!
                        Section(category.title) {
                            ForEach(category.subjects) { subject in
                                NavigationLink(subject.name) {
                                    UnitsView(store: store, subject: subject)
                                }
                            }
                        }
                    }
                } else {
                    Text("Couldn't load catalog.")
                }
            }
            .navigationTitle("Lingo")
        }
    }
}
