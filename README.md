# Gym Performance Tracker

A dark, high-contrast, offline-first personal training log for iOS and Android.
Design a weekly split, log every set as you lift, and watch your strength climb.
No login, no backend — everything lives on-device.

Built with **Expo (SDK 52) + React Native + TypeScript**.

---

## Features

### 🏠 Home (Dashboard)
- Today's scheduled day from your active split with a big **Start Workout** button.
- Current day streak, workouts this week vs. your split target, and total weekly volume.
- Recent PRs feed (est. 1RM records).
- Quick body-weight entry.

### 🏋️ Workout — Split Builder + Active Logging
- **Split Builder:** 7-day (Mon–Sun) view. Each day is a Rest Day or a named training
  day. Add exercises from a searchable library grouped by muscle, plus custom exercises.
  Set per-exercise targets (sets, rep range, optional weight). Reorder, swipe-to-delete,
  edit inline. Save multiple splits and switch the active one.
- **Active Workout** (the core screen): auto-loads today's exercises, one card at a time
  (swipe or tap the pills to move). Set-by-set rows with **big steppers** (2.5 for weight,
  1 for reps) *and* a numeric keypad on tap. Last session's numbers show as greyed
  placeholders. Add/remove sets on the fly; **long-press a set to copy it down**. A
  **circular rest timer** auto-starts when you check off a set — it keeps running with the
  screen off and fires a **local notification** (with haptic + sound) when it ends. The
  screen **stays awake** during a workout. Finish saves date, duration, total volume and notes.

### 📅 History
- Workouts listed by date; tap to expand every logged set.
- Calendar **heatmap** of training days (shaded by volume).
- Swipe to delete (with confirmation).

### 📈 Progress
- Per-exercise line chart of **estimated 1RM** and **top-set weight** over time
  (Epley: `1RM = weight × (1 + reps / 30)`).
- PR tracking per exercise: heaviest weight, best set volume, best est. 1RM.
- A **celebratory haptic + banner** the moment you beat a PR mid-workout.
- Weekly **muscle-group volume** bar chart and a **body-weight** chart.

### ⚙️ Settings
- **kg / lb** toggle — weights are stored canonically in kg and converted everywhere.
- Rest-timer default, sound on/off, haptics on/off, barbell weight.
- **Export** all data as JSON (share sheet) and **import** it back.
- Dark mode by default with a light-mode toggle.

### Extras
- **Plate calculator** — enter a target barbell weight, see the plates per side
  (editable 20 kg / 15 kg / 45 lb bars, colour-coded).
- **Warm-up suggestions** ramped from your working weight.
- **Progressive-overload nudge** — if you hit the top of the rep range on every set last
  session, it suggests +2.5 kg.
- Seeded with realistic sample data (two splits, ~4 weeks of history, body-weight trend)
  so charts and history aren't empty on first launch.
- Confirmation before any delete.

---

## Running it

```bash
npm install
npx expo start        # then press i / a, or scan the QR with Expo Go
```

- `npm run ios` / `npm run android` — open directly on a simulator/emulator.
- `npm run typecheck` — TypeScript, no emit.

> Rest-timer notifications and background delivery require a development build or a
> physical device; some notification behaviour is limited inside Expo Go.

---

## Architecture

```
App.tsx                     Root: gesture handler, safe-area, hydration gate, seeding
index.ts                    registerRootComponent
src/
  types/                    Domain model (all weights stored in kg)
  theme/                    Dark & light palettes, spacing/radius scale, useTheme()
  data/                     Built-in exercise library + sample-data generators
  store/useStore.ts         Zustand store persisted to AsyncStorage + pure selectors
  utils/                    units, calc (1RM/volume/plates/warmup/overload),
                            date, stats, feedback (haptics), notifications
  hooks/useRestTimer.ts     Absolute-timestamp countdown + scheduled notification
  components/               Reusable UI, Stepper, charts (react-native-svg), rest ring
  navigation/               Root stack (tabs + modals) + workout stack
  screens/                  Home, Split list/editor/day, Active workout, Exercise picker,
                            History, Progress, Settings, Plate calculator
```

**State & persistence.** A single Zustand store holds settings, splits, custom exercises,
finished sessions, the in-progress session and body-weight entries. It is persisted to
`AsyncStorage`; the in-progress workout is persisted too, so a session survives an app
restart. Sample data is seeded once, after rehydration, only when storage is empty.

**Units.** Everything is stored in kilograms and converted at the display/entry boundary,
so the kg⇄lb toggle is lossless.

Offline-first by design: there is no network code anywhere in the app.
