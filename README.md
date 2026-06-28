<img src="assets/icon.svg" width="80">

# Lingo

![version](https://img.shields.io/badge/version-1.0.0-blue) ![license](https://img.shields.io/badge/license-MIT-green) [![GitHub](https://img.shields.io/badge/GitHub-nulljosh%2Flingo-black?logo=github)](https://github.com/nulljosh/lingo)

A gamified language and skill learning app. Web + native iOS/macOS (LingoAce / LingoAce Mac).

Live at [lingo.heyitsmejosh.com](https://lingo.heyitsmejosh.com).

<img src="assets/screenshot-ios.png" width="240"> <img src="assets/screenshot-ios-65.png" width="240">

## Platforms

| Platform | Name | Status |
|---|---|---|
| Web | Lingo | Live |
| iOS | LingoAce (6783501611) | PREPARE_FOR_SUBMISSION — upload screenshots |
| macOS | LingoAce Mac (6783501927) | PREPARE_FOR_SUBMISSION — upload screenshots |

## Features

- 40+ courses across languages, programming, math, science, school, and skills
- Spaced repetition review, XP, streaks, hearts, achievements
- Speech recognition for language courses
- Native iOS/macOS: SF Symbol icon chips, spring animations, per-unit progress, animated feedback
- Local profile only — no backend, no account required
- Light/dark theme, PWA-ready

## Structure

```
index.html              # web app shell
css/lingo.css           # all styling (Fraunces display, DM Sans body, #5B9BD5 accent)
js/lingo-app.js         # state, auth/profile, lesson rendering
js/games.js             # game-type logic
content/catalog.json    # course catalog
content/courses/        # individual course packs (JSON)
ios/Sources/Shared/     # native SwiftUI views (cross-platform)
ios/Sources/iOS/        # iOS entry point
ios/Sources/macOS/      # macOS entry point
school/                 # master class HTML pages (BC curriculum)
screenshots/            # App Store screenshots (6.5" + 6.7")
```

## Running locally

```bash
npx serve .
```

## iOS/macOS

```bash
cd ios && xcodegen generate
# open lingo.xcodeproj, build Lingo-iOS or Lingo-macOS scheme
```

## Testing

```bash
node tools/validate-catalog.js
```
