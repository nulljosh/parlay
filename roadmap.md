# Lexly Roadmap

## Session handoff (2026-07-01)
- [x] **Naming resolved 2026-07-01**: final name is **Lexly** (matches ASC 6783501611/6783501927). Repo, web UI, plists, docs aligned; bundle IDs stay com.nulljosh.lingo(.mac).
- [ ] **No macos/ dir in this repo** — Mac builds can't be produced locally; the uploaded Mac builds came from elsewhere. Add a macos/ xcodegen target (mirror ios/) or recover the Mac project source.
- [ ] Screenshots + metadata (description, keywords, support URL) for iOS + Mac, then submit both.

## From icons-bugs.pdf (imported 2026-06-30)
- [x] Fix icon scaling — fixed 2026-07-02: regenerated 1024×1024 no-alpha icons for iOS+macOS (recovered from stale lingo/ clone before deleting it)

## From Lingo.pdf (imported 2026-07-01)
- [x] Sign-in broken since Supabase migration — fixed 2026-07-02 (4002822: hydrateFromDb wrapped in try/catch, profile auto-created on first sign-in). Verified live at lexly.heyitsmejosh.com.
- [x] Login popup background is transparent — fixed (f951b45, uses --bg-secondary)
- [x] Remove "choose avatar" step from signup flow — done 2026-07-02 (default avatar assigned, changeable in profile)
