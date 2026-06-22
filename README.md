# Lingo

A lightweight, gamified language/skill learning app. Vanilla HTML/CSS/JS, no build step.

Live at [lingo.heyitsmejosh.com](https://lingo.heyitsmejosh.com).

## Features

- Lesson catalog loaded from `content/catalog.json`
- XP, streaks, hearts, and achievements (Duolingo-style progress mechanics)
- Local profile (display name + avatar), stored client-side — no backend account system
- Light/dark theme toggle
- PWA-ready (`manifest.json`, installable on mobile)

## Structure

```
index.html        # app shell
css/lingo.css      # all styling
js/lingo-app.js    # app state, auth/profile, lesson rendering
js/games.js        # lesson game-type logic
```

## Running locally

Static site — serve the directory with any HTTP server:

```bash
npx serve .
```

## Deployment

Deployed as a static site to `lingo.heyitsmejosh.com`.
