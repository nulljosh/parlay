import Foundation

@Observable
final class ContentStore {
    var catalog: Catalog?
    var progress: LingoProgress

    private let progressKey = "lingo.progress"

    init() {
        progress = ContentStore.loadProgress(key: progressKey)
        catalog = ContentStore.loadJSON("catalog", as: Catalog.self)
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
