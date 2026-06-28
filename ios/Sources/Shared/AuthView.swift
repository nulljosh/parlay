import SwiftUI

struct AuthView: View {
    var auth: AuthStore
    @State private var mode: Mode = .signIn
    @State private var email = ""
    @State private var password = ""
    @State private var displayName = ""
    @State private var errorMessage = ""
    @State private var busy = false

    enum Mode { case signIn, signUp }

    var body: some View {
        VStack(spacing: 24) {
            Text("LingoAce").font(.largeTitle.bold())
            Text("Learn anything.").foregroundStyle(.secondary)

            Picker("Mode", selection: $mode) {
                Text("Sign In").tag(Mode.signIn)
                Text("Sign Up").tag(Mode.signUp)
            }
            .pickerStyle(.segmented)

            VStack(spacing: 12) {
                if mode == .signUp {
                    TextField("Display name", text: $displayName)
                        .textContentType(.name)
                        .textFieldStyle(.roundedBorder)
                }
                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .textFieldStyle(.roundedBorder)
                SecureField("Password", text: $password)
                    .textContentType(mode == .signUp ? .newPassword : .password)
                    .textFieldStyle(.roundedBorder)
            }

            if !errorMessage.isEmpty {
                Text(errorMessage).foregroundStyle(.red).font(.footnote)
            }

            Button(action: submit) {
                if busy {
                    ProgressView().frame(maxWidth: .infinity)
                } else {
                    Text(mode == .signIn ? "Sign In" : "Create Account").frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(busy)
        }
        .padding(32)
    }

    private func submit() {
        errorMessage = ""
        busy = true
        Task {
            do {
                if mode == .signUp {
                    try await auth.signUp(email: email, password: password,
                                         displayName: displayName.isEmpty ? "Learner" : displayName,
                                         avatarId: "falcon")
                } else {
                    try await auth.signIn(email: email, password: password)
                }
            } catch {
                errorMessage = error.localizedDescription
            }
            busy = false
        }
    }
}
