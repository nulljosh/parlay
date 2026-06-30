# CLAUDE.md

Guidance for working in this repo.

## What this is

Parlay — a static, vanilla JS/HTML/CSS gamified learning app. No framework, no bundler, no build step. Live at parlay.heyitsmejosh.com.

## Architecture

- `index.html` — single-page app shell, all screens are toggled divs
- `js/parlay-app.js` — app state, profile/auth (local only — no backend, profile is stored client-side), lesson loading from `content/catalog.json`
- `js/games.js` — individual lesson/game-type rendering and scoring logic
- `css/parlay.css` — all styles, includes light/dark theme via `data-theme` attribute on `<html>`

## Conventions

- No backend account system — "login" just sets a local profile (name + avatar), persisted in localStorage
- Lesson content is data-driven via JSON, not hardcoded per-lesson HTML
- Keep it framework-free; don't introduce a build step or bundler unless explicitly asked
- Accessibility: maintain `aria-label`s and skip-link already present in `index.html` when editing the header/nav

## Roadmap
- [x] School content (precalc11, precalc12, anatomy12, AP Bio 12) in `school` category
- [x] SwiftUI polish: icon chips, spring animations, feedback banner, unit progress (2026-06-28)
- [x] Dark mode card colors fixed — cards visible (2026-06-29)
- [x] Auth modal background fixed — no longer transparent (2026-06-29)
- [x] Signup emailRedirectTo set to window.location.origin (2026-06-29)
- [x] Mac build version fixed: 1.1.0 / build 6 (2026-06-29)
- [ ] Add `https://lingo.heyitsmejosh.com` to Supabase spark project redirect allow list (dashboard only)
- [ ] Upload screenshots to ASC (files at screenshots/6.7/ and 6.5/) then submit both apps
- [ ] macOS screenshot still needed before submission

## Testing
- `node tools/validate-catalog.js` — smoke-checks catalog.json structure + every course pack referenced from it
- `ios/Tests/ContentStoreTests.swift` — XCTest decoding catalog.json/course packs directly from disk (not via Bundle, to skip test-target resource wiring)
