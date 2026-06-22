# CLAUDE.md

Guidance for working in this repo.

## What this is

Lingo — a static, vanilla JS/HTML/CSS gamified learning app. No framework, no bundler, no build step. Live at lingo.heyitsmejosh.com.

## Architecture

- `index.html` — single-page app shell, all screens are toggled divs
- `js/lingo-app.js` — app state, profile/auth (local only — no backend, profile is stored client-side), lesson loading from `content/catalog.json`
- `js/games.js` — individual lesson/game-type rendering and scoring logic
- `css/lingo.css` — all styles, includes light/dark theme via `data-theme` attribute on `<html>`

## Conventions

- No backend account system — "login" just sets a local profile (name + avatar), persisted in localStorage
- Lesson content is data-driven via JSON, not hardcoded per-lesson HTML
- Keep it framework-free; don't introduce a build step or bundler unless explicitly asked
- Accessibility: maintain `aria-label`s and skip-link already present in `index.html` when editing the header/nav

## Roadmap
- [ ] Confirm whether the app still exists/is current (recovered 2026-06-21 after accidental deletion)
- [ ] Build out: language quizzes + law quizzes, plus macOS/Windows "how to use computers" quizzes
- [ ] iOS + macOS parity (currently web-only, stubs on other platforms)
- [ ] Run `/mint` on it once it stands up
