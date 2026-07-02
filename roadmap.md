# Lexly Roadmap

## Session handoff (2026-07-01)
- [x] **Naming resolved 2026-07-01**: final name is **Lexly** (matches ASC 6783501611/6783501927). Repo, web UI, plists, docs aligned; bundle IDs stay com.nulljosh.lingo(.mac).
- [ ] **No macos/ dir in this repo** — Mac builds can't be produced locally; the uploaded Mac builds came from elsewhere. Add a macos/ xcodegen target (mirror ios/) or recover the Mac project source.
- [ ] Screenshots + metadata (description, keywords, support URL) for iOS + Mac, then submit both.

## From icons-bugs.pdf (imported 2026-06-30)
- [ ] Fix icon scaling — likely single asset/export issue, check AppIcon.appiconset in ~/Documents/Code/lingo/ios/Sources/{iOS,macOS}/Assets.xcassets

## From Lingo.pdf (imported 2026-07-01)
- [ ] Sign-in broken since Supabase migration — hangs on "Signing in…" and times out, app unusable
- [ ] Login popup background is transparent, should be opaque
- [ ] Remove "choose avatar" step from signup flow
