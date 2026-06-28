import Foundation
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "https://tjsxsqlxjmanwvmywwvw.supabase.co")!,
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqc3hzcWx4am1hbnd2bXl3d3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTc0MDEsImV4cCI6MjA4NjA3MzQwMX0.LphLfho3wdQC20MhtcnBpzQUNuBoTOobrugQbNGxc68"
)

@Observable
final class AuthStore {
    var session: Session?
    var isLoading = true

    init() {
        Task { await refresh() }
    }

    var isSignedIn: Bool { session != nil }

    func refresh() async {
        session = try? await supabase.auth.session
        isLoading = false
    }

    func signUp(email: String, password: String, displayName: String, avatarId: String) async throws {
        let result = try await supabase.auth.signUp(email: email, password: password)
        session = result.session
        guard let uid = result.user.id.uuidString as String? else { return }
        try await supabase.from("lingo_profiles")
            .upsert(["id": uid, "display_name": displayName, "avatar_id": avatarId])
            .execute()
        try await supabase.from("lingo_progress")
            .upsert(["id": uid, "xp": 0, "streak": 0, "hearts": 5,
                     "completed_subjects": [], "lessons_completed": [:],
                     "trophy_ids": [], "srs": [:]] as [String: AnyJSON])
            .execute()
    }

    func signIn(email: String, password: String) async throws {
        let result = try await supabase.auth.signIn(email: email, password: password)
        session = result.session
    }

    func signOut() async throws {
        try await supabase.auth.signOut()
        session = nil
    }
}
