import Foundation

@Observable
final class ContentStore {
    var catalog: Catalog?
    var progress: LingoProgress

    private let progressKey = "lingo.progress"

    init() {
        progress = ContentStore.loadProgress(key: progressKey)
        catalog = ContentStore.loadJSON("catalog", as: Catalog.self)
        Task { await syncFromCloud() }
    }

    func syncFromCloud() async {
        guard let uid = try? await supabase.auth.session.user.id.uuidString else { return }
        guard let row = try? await supabase.from("lingo_progress")
            .select().eq("id", value: uid).single().execute().value as DBProgress? else { return }
        progress.xp = row.xp
        progress.streak = row.streak
        progress.completedLessonIds = Set(row.lessons_completed.keys)
        save()
    }

    func loadCourse(_ subject: Subject) -> CoursePack? {
        let name = (subject.packPath as NSString).lastPathComponent.replacingOccurrences(of: ".json", with: "")
        return ContentStore.loadJSON(name, subdir: "courses", as: CoursePack.self)
    }

    func recordAnswer(correct: Bool, exerciseId: String, lessonId: String) {
        if correct { progress.xp += 10 }
    }

    func completeLesson(_ lessonId: String) {
        progress.completedLessonIds.insert(lessonId)
        save()
    }

    private func save() {
        if let data = try? JSONEncoder().encode(progress) {
            UserDefaults.standard.set(data, forKey: progressKey)
        }
        let snap = progress
        Task {
            guard let uid = try? await supabase.auth.session.user.id.uuidString else { return }
            let row = DBProgress(
                id: uid, xp: snap.xp, streak: snap.streak, hearts: 5,
                completed_subjects: [], trophy_ids: [],
                lessons_completed: Dictionary(uniqueKeysWithValues: snap.completedLessonIds.map { ($0, true) }),
                updated_at: ISO8601DateFormatter().string(from: Date())
            )
            try? await supabase.from("lingo_progress").upsert(row).execute()
        }
    }

    private static func loadProgress(key: String) -> LingoProgress {
        guard let data = UserDefaults.standard.data(forKey: key),
              let p = try? JSONDecoder().decode(LingoProgress.self, from: data) else {
            return LingoProgress()
        }
        return p
    }

    private static func loadJSON<T: Decodable>(_ name: String, subdir: String? = nil, as type: T.Type) -> T? {
        guard let url = Bundle.main.url(forResource: name, withExtension: "json", subdirectory: subdir),
              let data = try? Data(contentsOf: url),
              let decoded = try? JSONDecoder().decode(T.self, from: data) else {
            return nil
        }
        return decoded
    }
}
