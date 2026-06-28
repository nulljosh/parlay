import SwiftUI

struct CatalogView: View {
    var store: ContentStore
    var auth: AuthStore

    var body: some View {
        NavigationStack {
            List {
                if let catalog = store.catalog {
                    ForEach(Array(catalog.categories.keys.sorted()), id: \.self) { key in
                        let category = catalog.categories[key]!
                        Section(category.title) {
                            ForEach(category.subjects) { subject in
                                NavigationLink {
                                    UnitsView(store: store, subject: subject)
                                } label: {
                                    SubjectRow(subject: subject)
                                }
                            }
                        }
                    }
                } else {
                    Text("Couldn't load catalog.")
                }
            }
            .navigationTitle("LingoAce")
            .toolbar {
                ToolbarItem(placement: .automatic) {
                    Button("Sign Out") {
                        Task { try? await auth.signOut() }
                    }
                }
            }
        }
    }
}

private struct SubjectRow: View {
    let subject: Subject

    var body: some View {
        Label {
            VStack(alignment: .leading, spacing: 2) {
                Text(subject.name).font(.body.weight(.medium))
                Text(subject.level.capitalized).font(.caption).foregroundStyle(.secondary)
            }
        } icon: {
            Image(systemName: sfSymbol(for: subject.icon))
                .foregroundStyle(.white)
                .frame(width: 32, height: 32)
                .background(Color(hex: "5B9BD5"))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .padding(.vertical, 2)
    }

    private func sfSymbol(for faIcon: String) -> String {
        let key = faIcon.components(separatedBy: " ").last?.replacingOccurrences(of: "fa-", with: "") ?? ""
        let map: [String: String] = [
            "book": "book.fill", "book-open": "book.open.fill",
            "atom": "staroflife.fill", "chess": "crown.fill",
            "computer": "desktopcomputer", "database": "cylinder.fill",
            "dna": "staroflife.fill", "draw-polygon": "pentagon.fill",
            "earth-africa": "globe.europe.africa.fill",
            "earth-americas": "globe.americas.fill",
            "earth-asia": "globe.asia.australia.fill",
            "earth-europe": "globe.europe.africa.fill",
            "flask": "flask.fill", "globe": "globe",
            "guitar": "guitars", "heart-pulse": "waveform.path.ecg",
            "infinity": "infinity", "landmark": "building.columns.fill",
            "language": "character.bubble.fill", "microchip": "cpu.fill",
            "music": "music.note", "chart-bar": "chart.bar.fill",
            "pizza-slice": "fork.knife", "plus": "plus.circle.fill",
            "puzzle-piece": "puzzlepiece.fill",
            "satellite": "antenna.radiowaves.left.and.right",
            "superscript": "x.squareroot", "table-cells": "tablecells.fill",
            "wave-square": "waveform", "golang": "chevron.left.forwardslash.chevron.right",
            "java": "curlybraces", "js": "curlybraces",
            "python": "curlybraces", "rust": "curlybraces",
        ]
        return map[key] ?? "book.fill"
    }
}
