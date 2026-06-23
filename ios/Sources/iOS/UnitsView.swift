import SwiftUI

struct UnitsView: View {
    var store: ContentStore
    var subject: Subject
    @State private var course: CoursePack?

    var body: some View {
        List {
            if let course {
                ForEach(course.units) { unit in
                    Section(unit.title) {
                        ForEach(unit.lessons) { lesson in
                            NavigationLink {
                                LessonView(store: store, lesson: lesson)
                            } label: {
                                HStack {
                                    Text(lesson.title)
                                    if store.progress.completedLessonIds.contains(lesson.id) {
                                        Spacer()
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(.green)
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                Text("Couldn't load \(subject.name).")
            }
        }
        .navigationTitle(subject.name)
        .onAppear {
            if course == nil {
                course = store.loadCourse(subject)
            }
        }
    }
}
