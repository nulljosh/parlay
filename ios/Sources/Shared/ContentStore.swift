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
            .select().eq("id", value: uid).single().execute().value as [String: AnyJSON]? else { return }
        var p = progress
        if case .integer(let v) = row["xp"] { p.xp = Int(v) }
        if case .integer(let v) = row["streak"] { p.streak = Int(v) }
        if case .array(let arr) = row["completed_subjects"] {
            // completed_subjects drives completedLessonIds indirectly; store streak/xp is enough for now
            _ = arr
        }
        if case .object(let obj) = row["lessons_completed"] {
            p.completedLessonIds = Set(obj.keys)
        }
        progress = p
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
        Task {
            guard let uid = try? await supabase.auth.session.user.id.uuidString else { return }
            let lessonsObj = Dictionary(uniqueKeysWithValues: progress.completedLessonIds.map { ($0, true) })
            try? await supabase.from("lingo_progress").upsert([
                "id": uid,
                "xp": String(progress.xp),
                "streak": String(progress.streak),
                "hearts": "5",
                "completed_subjects": "[]",
                "lessons_completed": (try? String(data: JSONSerialization.data(withJSONObject: lessonsObj), encoding: .utf8)) ?? "{}",
                "trophy_ids": "[]",
                "updated_at": ISO8601DateFormatter().string(from: Date()),
            ]).execute()
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
