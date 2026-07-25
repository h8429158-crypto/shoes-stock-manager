# Spend — Expense Tracker

A fast, offline-first mobile expense tracker with a clean dark theme (pure black
background, white text, yellow accent). Built as a single self-contained,
installable PWA so it runs on any phone straight from the browser — no build step,
no server, no dependencies. All data lives on your device in `localStorage`.

## Features

Three tabs in a bottom navigation bar:

- **Tap** (home) — the record screen. A big live `₹` amount display, a custom
  numeric keypad, a horizontal row of emoji category chips (selected chip glows
  yellow), an *add note* field, a *Credit* toggle for money received, and a large
  Save button that stores the entry and resets the screen.
- **History** — expenses grouped by date with per-day totals, filter pills
  (Today / This Week / This Month / All), and a sticky bottom bar showing the
  month's spend against your budget. Tap any row to edit or delete it.
- **Analytics** — spend for the selected period, budget progress, transaction
  count and average, a 7-day trend chart, and a spend-by-category breakdown.

Categories: 🛍️ Shopping · 🎬 Entertainment · 🍎 Health · 🍕 Junk food ·
🚗 Vehicles · ⛽ Fuel · 🏠 Rent · 💊 Medicine · 📚 Education · 🎁 Other.

## Run it

Open `docs/index.html` in any browser, or host the `docs/` folder (it is
GitHub-Pages ready). On a phone, use *Add to Home Screen* to install it as a
standalone app that works offline.
