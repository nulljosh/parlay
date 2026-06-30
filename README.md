<img src="assets/icon.svg" width="80" style="border-radius:18px">

# Parlay

![version](https://img.shields.io/badge/version-1.1.0-blue) ![license](https://img.shields.io/badge/license-MIT-green) [![GitHub](https://img.shields.io/badge/GitHub-nulljosh%2Fparlay-black?logo=github)](https://github.com/nulljosh/parlay)

A gamified language and skill learning app. Web + native iOS/macOS.

Live at [lingo.heyitsmejosh.com](https://lingo.heyitsmejosh.com).

## Platforms

| Platform | Name | App ID | Status |
|---|---|---|---|
| Web | Parlay | — | Live |
| iOS | Parlay (6783501611) | com.nulljosh.lingo | Build 1.1.0/6 ready to upload |
| macOS | Parlay Mac (6783501927) | com.nulljosh.lingo.mac | Build 1.1.0/6 ready to upload |

## Features

- 40+ courses: languages, programming, math, science, school (PC12, AP Bio 12), skills
- Spaced repetition review, XP, streaks, hearts, achievements
- Speech recognition for language courses
- Native iOS/macOS: SF Symbol icon chips, spring animations, per-unit progress
- Email/password auth via Supabase (spark project), progress syncs across platforms
- Light/dark theme, PWA-ready

## Structure

```
index.html              # web app shell
css/lingo.css           # all styling
js/lingo-app.js         # state, auth/profile, lesson rendering
js/games.js             # game-type logic
content/catalog.json    # course catalog
content/courses/        # individual course packs (JSON)
ios/Sources/Shared/     # SwiftUI views (cross-platform)
ios/Sources/iOS/        # iOS entry point
ios/Sources/macOS/      # macOS entry point
school/                 # BC curriculum HTML masterclass pages
```

## Running locally

```bash
npx serve .
```

## iOS/macOS

```bash
cd ios && xcodegen generate
# archive Lingo-iOS or Lingo-macOS, upload via asc-xcode-build skill
```

## Testing

```bash
node tools/validate-catalog.js
```
