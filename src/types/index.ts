// ---------------------------------------------------------------------------
// Domain model. All weights are stored canonically in KILOGRAMS. The active
// unit setting only affects how weights are *displayed* and *entered*, so
// toggling kg <-> lb is lossless.
// ---------------------------------------------------------------------------

export type Unit = 'kg' | 'lb';

export type ThemeMode = 'dark' | 'light';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'core';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'core',
];

/** An exercise definition living in the library (built-in or custom). */
export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  /** true for user-created exercises. */
  custom?: boolean;
}

/** A prescribed exercise inside a split day (the plan, not the log). */
export interface SplitExercise {
  id: string;
  exerciseId: string;
  targetSets: number;
  repMin: number;
  repMax: number;
  /** Target working weight in kg, optional. */
  targetWeightKg?: number;
}

/** One of the seven days in a split. */
export interface SplitDay {
  id: string;
  /** Display name e.g. "Push". Ignored when isRest. */
  name: string;
  isRest: boolean;
  exercises: SplitExercise[];
}

/** A full weekly training split. days[0] = Monday ... days[6] = Sunday. */
export interface Split {
  id: string;
  name: string;
  days: SplitDay[];
}

/** A single logged set within an active/finished workout. */
export interface LoggedSet {
  id: string;
  weightKg: number;
  reps: number;
  done: boolean;
}

/** The logged performance of one exercise during a session. */
export interface SessionExercise {
  exerciseId: string;
  sets: LoggedSet[];
}

/** A finished (or in-progress) workout session. */
export interface Session {
  id: string;
  /** ISO date-time the session started. */
  startedAt: string;
  /** ISO date-time the session finished; undefined while in progress. */
  finishedAt?: string;
  splitId?: string;
  dayName: string;
  exercises: SessionExercise[];
  notes: string;
  /** Cached total volume in kg (Σ weight × reps of done sets). */
  totalVolumeKg: number;
  /** Duration in seconds. */
  durationSec: number;
}

export interface BodyWeightEntry {
  id: string;
  /** ISO date-time. */
  date: string;
  /** Body weight in kg. */
  weightKg: number;
}

export interface Settings {
  unit: Unit;
  theme: ThemeMode;
  restDefaultSec: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** Empty barbell weight in kg for the plate calculator. */
  barWeightKg: number;
  activeSplitId?: string;
}

/** Per-exercise personal-record snapshot, derived from history. */
export interface ExercisePR {
  exerciseId: string;
  heaviestWeightKg: number;
  bestSetVolumeKg: number;
  bestEst1RMKg: number;
  /** ISO date the best est. 1RM was achieved. */
  bestEst1RMDate?: string;
}
