import SwiftUI

struct LessonView: View {
    var store: ContentStore
    var lesson: Lesson

    @State private var index = 0
    @State private var input = ""
    @State private var selected: String?
    @State private var feedback: FeedbackState?
    @State private var exerciseKey = UUID()
    @State private var pressedChoice: String?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 16) {
                if index < lesson.exercises.count {
                    let exercise = lesson.exercises[index]
                    VStack(alignment: .leading, spacing: 16) {
                        Text(exercise.question).font(.title3.bold())

                        if let choices = exercise.choices {
                            ForEach(choices, id: \.self) { choice in
                                ChoiceButton(
                                    choice: choice,
                                    isSelected: selected == choice,
                                    isPressed: pressedChoice == choice
                                ) {
                                    guard feedback == nil else { return }
                                    pressedChoice = choice
                                    withAnimation(.spring(response: 0.25, dampingFraction: 0.6)) {
                                        selected = choice
                                    }
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { pressedChoice = nil }
                                }
                            }
                        } else {
                            TextField("Your answer", text: $input)
                                .textFieldStyle(.roundedBorder)
                        }

                        Button(feedback == nil ? "Check" : "Continue") {
                            feedback == nil ? check(exercise) : advance()
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(feedback == nil && selected == nil && input.isEmpty)
                    }
                    .id(exerciseKey)
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing).combined(with: .opacity),
                        removal: .move(edge: .leading).combined(with: .opacity)
                    ))
                } else {
                    VStack(spacing: 12) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 64))
                            .foregroundStyle(Color(hex: "5B9BD5"))
                        Text("Lesson complete!").font(.title.bold())
                        Button("Done") { store.completeLesson(lesson.id); dismiss() }
                            .buttonStyle(.borderedProminent)
                    }
                    .frame(maxWidth: .infinity)
                }
                Spacer()
            }
            .padding()

            if let fb = feedback {
                FeedbackBanner(state: fb)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .navigationTitle(lesson.title)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: feedback)
    }

    private func check(_ exercise: Exercise) {
        let given = exercise.choices != nil ? (selected ?? "") : input.trimmingCharacters(in: .whitespaces)
        let correct = given.replacingOccurrences(of: " ", with: "").lowercased()
            == exercise.answer.replacingOccurrences(of: " ", with: "").lowercased()
        store.recordAnswer(correct: correct, exerciseId: exercise.id, lessonId: lesson.id)
        withAnimation { feedback = correct ? .correct : .incorrect(exercise.answer) }
    }

    private func advance() {
        withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
            feedback = nil; exerciseKey = UUID(); index += 1; input = ""; selected = nil
        }
    }
}

private struct ChoiceButton: View {
    let choice: String
    let isSelected: Bool
    let isPressed: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack { Text(choice); Spacer() }
                .padding()
                .background(isSelected ? Color(hex: "5B9BD5").opacity(0.15) : Color.secondary.opacity(0.12))
                .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(isSelected ? Color(hex: "5B9BD5") : .clear, lineWidth: 2))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
        .scaleEffect(isPressed ? 0.96 : 1.0)
        .animation(.spring(response: 0.2, dampingFraction: 0.6), value: isPressed)
    }
}

enum FeedbackState: Equatable {
    case correct
    case incorrect(String)
}

private struct FeedbackBanner: View {
    let state: FeedbackState
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: state == .correct ? "checkmark.circle.fill" : "xmark.circle.fill")
                .font(.title2)
            VStack(alignment: .leading, spacing: 2) {
                Text(state == .correct ? "Correct!" : "Incorrect").font(.headline)
                if case .incorrect(let answer) = state {
                    Text("Answer: \(answer)").font(.subheadline)
                }
            }
            Spacer()
        }
        .foregroundStyle(state == .correct ? Color(hex: "2d7a50") : Color(hex: "c44040"))
        .padding()
        .background(RoundedRectangle(cornerRadius: 16, style: .continuous)
            .fill(state == .correct ? Color(hex: "f0faf4") : Color(hex: "faf0f0")))
        .padding()
    }
}
