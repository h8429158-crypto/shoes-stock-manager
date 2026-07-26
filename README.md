# Spend — Expense Tracker

A fast, offline-first mobile expense tracker with a clean dark theme (pure black
background, white text, yellow accent). Built as a single self-contained,
installable PWA so it runs on any phone straight from the browser — no build step,
no server, no dependencies. All data lives on your device in `localStorage`.

## Features

Three tabs in a bottom navigation bar:

- **Tap** (home) — the record screen. A big live amount display, a custom
  numeric keypad, a horizontal row of emoji category chips (selected chip glows
  yellow), an *add note* field with **automatic category detection** (type
  "KFC" and it picks Junk food), quick-amount and recent-note chips, a payment
  method selector, a receipt-photo attach, a *Credit* toggle for money received,
  and a Save button that stores the entry and resets the screen.
- **History** — expenses grouped by date with per-day totals, filter pills
  (Today / This Week / This Month / All), full-text **search**, and a sticky
  bottom bar showing the month's spend against your budget. Tap any row to edit
  or delete it (with **undo**).
- **Analytics** — spend for the selected period, budget progress, insights
  (vs. last month, projected month-end, biggest expense), a 7-day trend, a
  6-month comparison, a monthly **spend heatmap**, and breakdowns by category
  (with per-category budgets) and by payment method.

Categories: 🛍️ Shopping · 🎬 Entertainment · 🍎 Health · 🍕 Junk food ·
🚗 Vehicles · ⛽ Fuel · 🏠 Rent · 💊 Medicine · 📚 Education · 🎁 Other —
all editable, and you can add your own.

### Settings & data

Reachable from the gear icon on the History or Analytics tab:

- **Budgets** — monthly total plus optional per-category limits.
- **Categories** — add / rename / recolor / re-emoji.
- **Payment methods** — Cash / UPI / Card and any you add.
- **Recurring expenses** — auto-posted each month (rent, subscriptions…).
- **Currency** — pick the symbol used throughout.
- **App lock** — optional 4-digit PIN on open.
- **Backup** — export/restore JSON, export CSV, or reset.

A first-run onboarding sets your currency and budget. Everything is stored
locally on the device; nothing is uploaded.

## Run it

Open `docs/index.html` in any browser, or host the `docs/` folder (it is
GitHub-Pages ready). On a phone, use *Add to Home Screen* to install it as a
standalone app that works offline.

## Also in this repo

Two more independent PWAs deploy alongside Spend, each under its own path:

| App | Path | What it is |
|-----|------|------------|
| Spend | `/` | Expense tracker (this README) |
| Reward Habits | `/habits/` | Daily habit tracker that turns consistency into a monthly money reward (₹10,000–₹20,000, per-day accrual) |
| IRONLOG | `/ironlog/` | Gym tracker — build a split, log your lifts, see a progress graph, and get calories burned from the weight you lift |

The apps are fully separate — own storage, own icon, own offline cache. Each
service worker only clears caches under its own name prefix (`spend-` /
`reward-habits-` / `ironlog-`), so installing or updating one never wipes the
others' offline copy.

React Native / Expo sources live on their own branches: Reward Habits on
`claude/habit-tracker-react-native-5jlu2a`, and IRONLOG's Expo + TypeScript app
(`App.tsx`, `src/**`) on `claude/gym-performance-tracker-wccftp`.
