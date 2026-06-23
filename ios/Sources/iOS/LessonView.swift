import SwiftUI

struct LessonView: View {
    var store: ContentStore
    var lesson: Lesson

    @State private var index = 0
    @State private var input = ""
    @State private var selected: String?
    @State private var feedback: String?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if index < lesson.exercises.count {
                let exercise = lesson.exercises[index]
                Text(exercise.question)
                    .font(.title3.bold())

                if let choices = exercise.choices {
                    ForEach(choices, id: \.self) { choice in
                        Button {
                            selected = choice
                        } label: {
                            HStack {
                                Text(choice)
                                Spacer()
                            }
                            .padding()
                            .background(selected == choice ? Color.accentColor.opacity(0.2) : Color(.secondarySystemBackground))
                            .cornerRadius(8)
                        }
                        .buttonStyle(.plain)
                    }
                } else {
                    TextField("Your answer", text: $input)
                        .textFieldStyle(.roundedBorder)
                }

                if let feedback {
                    Text(feedback)
                        .foregroundStyle(feedback.hasPrefix("Correct") ? .green : .red)
                }

                Button(feedback == nil ? "Check" : "Continue") {
                    if feedback == nil {
                        check(exercise)
                    } else {
                        advance()
                    }
                }
                .buttonStyle(.borderedProminent)
            } else {
                Text("Lesson complete.")
                    .font(.title.bold())
                Button("Done") {
                    store.completeLesson(lesson.id)
                    dismiss()
                }
                .buttonStyle(.borderedProminent)
            }
            Spacer()
        }
        .padding()
        .navigationTitle(lesson.title)
    }

    private func check(_ exercise: Exercise) {
        let given = exercise.choices != nil ? (selected ?? "") : input.trimmingCharacters(in: .whitespaces)
        let correct = given.replacingOccurrences(of: " ", with: "").lowercased()
            == exercise.answer.replacingOccurrences(of: " ", with: "").lowercased()
        store.recordAnswer(correct: correct, exerciseId: exercise.id, lessonId: lesson.id)
        feedback = correct ? "Correct." : "Incorrect. Answer: \(exercise.answer)"
    }

    private func advance() {
        index += 1
        input = ""
        selected = nil
        feedback = nil
    }
}
