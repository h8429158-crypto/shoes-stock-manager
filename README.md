# Reward Habits 🏆

A minimal, offline-first **self-improvement / habit tracker** for mobile, built
with **React Native + Expo** and **SQLite (expo-sqlite)**. Tick your daily tasks,
earn points, and convert consistency into a real-money reward you pay yourself
each month — a guaranteed **₹10,000**, rising to **₹20,000** at 100% consistency.

Everything runs **fully offline** on the device. No login, no internet, no accounts.

---

## The core loop

1. Set daily tasks (e.g. *No sugar*, *Workout 30 min*, *Read 20 pages*).
2. Each day the tasks appear as a checklist. **Tick = done = points.**
3. Each day builds your **monthly reward**, which accrues one equal slice per day:

   ```
   per-day slice = (max − min) ÷ days in the month     // e.g. ₹10,000 ÷ 31 = ₹322.58
   reward        = min + Σ over each day (day's completion % × per-day slice)
   ```

   A fully-completed day banks the whole slice; a partial day banks part of it; a
   missed day banks nothing — but never subtracts what you've already earned.
   Complete everything every day of the month to reach the **maximum**.

The **Current Reward** on the Home screen updates live every time you tick a task,
and the **reward range (min/max) is editable** in Settings (default ₹10,000–₹20,000).

## Points

| Importance | Base points |
|------------|-------------|
| High       | 30          |
| Medium     | 20          |
| Low        | 10          |

- Every month you pick **one priority** and tag it with a category
  (Health, Business, Learning, Discipline, Other).
- Tasks whose category matches the monthly priority earn **2×** points.
- **Streak bonus:** +50 points for every full 7-day run of 100%-complete days.

## Rules that keep it honest

- Tasks **reset every day at midnight** (a new day starts empty).
- You can **only tick today's tasks** — past days are read-only, so there's no
  back-dating or cheating.
- **Month-lock guardrail:** once you've earned points from a task this month, its
  points and schedule are frozen and it can't be deleted until the 1st — so a
  mid-month edit can't retroactively inflate your reward. Titles stay editable,
  and new tasks can always be added (they only raise the target).
- On the **1st of the month** points reset to zero and you can set a new
  priority; your task list carries over.

## Features

- **Home** — today's date & checklist, big live ₹ reward, a **reward forecast**
  ("finish the month → up to ₹X"), today's points earned/possible, current
  streak, and a monthly consistency progress bar.
- **Tasks** — add / edit / delete daily tasks with category, importance, and a
  **repeat schedule** (every day, weekdays, or custom weekdays). Days with no
  scheduled task become **rest days** that never break a streak.
- **History** — calendar coloured green (all done), yellow (partial), red (missed).
- **Stats** — last-7-days and last-6-months points charts, plus a per-category
  breakdown for the month.
- **Streaks** — current & best streak of consecutive 100% days.
- **Month Complete** — end-of-month summary: total points, consistency %, final
  reward, and best streak — with **“Mark as paid to myself”**.
- **Payout ledger** — every reward you pay yourself is logged in Settings, with a
  running **total paid to yourself**.
- **Backup & restore** — export all data to a JSON file (share to Files/Drive)
  and restore it on any device. Fully offline, no account.
- **Daily reminder** — a local notification at a time you choose (default 8 PM):
  *"You have X tasks pending today"*.
- **Onboarding** — first launch asks for your name, monthly priority, and first
  three tasks.

## Design

- Clean, minimal **dark theme** by default.
- Large tap targets, a satisfying tick animation, and **haptic feedback**.
- All currency shown in **₹ (Indian Rupees)** using the Indian numbering system.

---

## Running the app

Requires [Node.js](https://nodejs.org) and the [Expo](https://expo.dev) toolchain.

```bash
npm install          # install dependencies
npm start            # start the Expo dev server
# then press "a" (Android), "i" (iOS), or scan the QR code with Expo Go
```

> Notifications and haptics require a physical device or a dev build; they are
> gracefully skipped where unsupported (e.g. web).

## Project structure

```
App.js                     App root (providers + navigation)
src/
  constants.js             Points, categories, reward bounds
  theme/theme.js           Colours, spacing, typography tokens
  db/                      SQLite access
    database.js            Schema + init + migrations
    tasks.js  completions.js  priorities.js  settings.js
    payouts.js             Reward ledger (mark-as-paid, total paid)
    backup.js              JSON export / import (offline share sheet)
  logic/                   Pure, testable business logic
    dates.js               Local-date helpers
    points.js              Per-task point value (+ priority 2×)
    rewards.js             Consistency → ₹ reward, ₹ formatting
    dayStatus.js           Day colour + streak / bonus math (schedule-aware)
    summary.js             Home-screen roll-up (live reward + forecast)
    schedule.js            Per-task repeat schedules / rest days
    locks.js               Month-lock guardrail
    stats.js               Chart & category aggregations
  state/AppContext.js      Global state; loads DB, recomputes on every tick
  components/              Reusable UI (TaskRow, Button, charts, calendar…)
  screens/                 Home, Tasks, TaskEdit, History, Stats, Settings,
                           Onboarding, SetPriority, MonthComplete
  navigation/RootNavigator.js  Tabs + modal stack
  notifications/reminders.js   Daily local reminder scheduling
```

The business logic under `src/logic` is deliberately free of React Native
imports so it can be reasoned about — and unit-tested — in isolation.
