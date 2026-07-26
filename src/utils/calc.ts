import { LoggedSet, Session, SessionExercise } from '@/types';

/** Epley estimated 1RM: weight × (1 + reps / 30). */
export function epley1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  return weightKg * (1 + reps / 30);
}

/** Volume of a single set (weight × reps). */
export const setVolume = (s: LoggedSet) => s.weightKg * s.reps;

/** Total volume of the *done* sets in a session-exercise. */
export function exerciseVolume(ex: SessionExercise): number {
  return ex.sets.reduce((sum, s) => (s.done ? sum + setVolume(s) : sum), 0);
}

/** Total volume of all done sets in a session. */
export function sessionVolume(session: Session): number {
  return session.exercises.reduce((sum, ex) => sum + exerciseVolume(ex), 0);
}

/** Best (highest) est. 1RM among the done sets of an exercise. */
export function bestEst1RM(ex: SessionExercise): number {
  return ex.sets.reduce(
    (best, s) => (s.done ? Math.max(best, epley1RM(s.weightKg, s.reps)) : best),
    0
  );
}

/** Heaviest weight lifted among done sets. */
export function topSetWeight(ex: SessionExercise): number {
  return ex.sets.reduce((best, s) => (s.done ? Math.max(best, s.weightKg) : best), 0);
}

/** Best single-set volume among done sets. */
export function bestSetVolume(ex: SessionExercise): number {
  return ex.sets.reduce(
    (best, s) => (s.done ? Math.max(best, setVolume(s)) : best),
    0
  );
}

// --- Plate calculator ------------------------------------------------------

export interface PlateResult {
  /** plates (in kg) for ONE side, largest first. */
  perSide: number[];
  /** weight that couldn't be represented exactly (kg, whole bar). */
  leftoverKg: number;
}

const DEFAULT_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

/**
 * Given a target total weight and bar weight (both kg), compute the plates
 * required per side using a greedy fill from the available plate set.
 */
export function calcPlates(
  targetKg: number,
  barKg: number,
  plates: number[] = DEFAULT_PLATES_KG
): PlateResult {
  const perSideTarget = Math.max(0, (targetKg - barKg) / 2);
  let remaining = perSideTarget;
  const perSide: number[] = [];
  const sorted = [...plates].sort((a, b) => b - a);
  for (const p of sorted) {
    while (remaining + 1e-9 >= p) {
      perSide.push(p);
      remaining -= p;
    }
  }
  return { perSide, leftoverKg: remaining * 2 };
}

// --- Warm-up suggestions ---------------------------------------------------

export interface WarmupSet {
  percent: number;
  weightKg: number;
  reps: number;
}

/**
 * Classic warm-up ramp toward a working weight: empty bar → 50% → 70% → 85%.
 * Weights are snapped to the nearest 2.5 kg for easy loading.
 */
export function warmupSets(workingKg: number, barKg = 20): WarmupSet[] {
  const snap = (n: number) => Math.max(barKg, Math.round(n / 2.5) * 2.5);
  const ramp = [
    { percent: 0, reps: 10 }, // empty bar
    { percent: 0.5, reps: 5 },
    { percent: 0.7, reps: 3 },
    { percent: 0.85, reps: 2 },
  ];
  return ramp.map((r) => ({
    percent: r.percent,
    reps: r.reps,
    weightKg: r.percent === 0 ? barKg : snap(workingKg * r.percent),
  }));
}

// --- Progressive overload nudge -------------------------------------------

/**
 * If every done set last session hit the TOP of the target rep range, suggest
 * a +2.5 kg bump. Returns the suggested new working weight (kg) or null.
 */
export function overloadSuggestion(
  ex: SessionExercise,
  repMax: number
): number | null {
  const done = ex.sets.filter((s) => s.done);
  if (done.length === 0) return null;
  const allHitTop = done.every((s) => s.reps >= repMax);
  if (!allHitTop) return null;
  const top = topSetWeight(ex);
  if (top <= 0) return null;
  return top + 2.5;
}
