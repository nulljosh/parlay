import Foundation

struct Catalog: Decodable {
    let categories: [String: Category]
}

struct Category: Decodable {
    let title: String
    let subjects: [Subject]
}

struct Subject: Decodable, Identifiable {
    let id: String
    let name: String
    let icon: String
    let level: String
    let packPath: String
}

struct CoursePack: Decodable {
    let id: String
    let name: String
    let category: String
    let level: String
    let units: [Unit]
}

struct Unit: Decodable, Identifiable {
    let id: String
    let title: String
    let lessons: [Lesson]
}

struct Lesson: Decodable, Identifiable {
    let id: String
    let title: String
    let exercises: [Exercise]
}

struct Exercise: Decodable, Identifiable {
    let type: String
    let question: String
    let answer: String
    let choices: [String]?
    let id: String
}

struct LingoProgress: Codable {
    var xp: Int = 0
    var streak: Int = 0
    var completedLessonIds: Set<String> = []
}
