import {
  BodyWeightEntry,
  LoggedSet,
  Session,
  Split,
  SplitDay,
  SplitExercise,
} from '@/types';
import { uid } from '@/utils/id';
import { sessionVolume } from '@/utils/calc';
import { addDays } from '@/utils/date';

// Helper to build a split exercise pointing at a library id.
function sx(
  exerciseId: string,
  targetSets: number,
  repMin: number,
  repMax: number,
  targetWeightKg?: number
): SplitExercise {
  return { id: uid('sx_'), exerciseId, targetSets, repMin, repMax, targetWeightKg };
}

function day(name: string, exercises: SplitExercise[]): SplitDay {
  return { id: uid('d_'), name, isRest: false, exercises };
}

function rest(): SplitDay {
  return { id: uid('d_'), name: 'Rest', isRest: true, exercises: [] };
}

/** The seeded "Push / Pull / Legs" 6-day split. */
export function buildSampleSplit(): Split {
  return {
    id: 'split_ppl',
    name: 'PPL 6-Day',
    days: [
      // Mon — Push
      day('Push', [
        sx('x_chest_barbell_bench_press', 4, 6, 10, 80),
        sx('x_shoulders_overhead_press', 3, 8, 12, 45),
        sx('x_chest_incline_dumbbell_press', 3, 8, 12, 30),
        sx('x_shoulders_lateral_raise', 3, 12, 15, 12),
        sx('x_triceps_rope_pushdown', 3, 10, 15, 25),
      ]),
      // Tue — Pull
      day('Pull', [
        sx('x_back_deadlift', 3, 4, 6, 140),
        sx('x_back_pull_up', 4, 6, 10),
        sx('x_back_seated_cable_row', 3, 8, 12, 60),
        sx('x_back_face_pull', 3, 12, 15, 20),
        sx('x_biceps_barbell_curl', 3, 8, 12, 35),
      ]),
      // Wed — Legs
      day('Legs', [
        sx('x_legs_back_squat', 4, 5, 8, 110),
        sx('x_legs_romanian_deadlift', 3, 8, 12, 90),
        sx('x_legs_leg_press', 3, 10, 15, 180),
        sx('x_legs_lying_leg_curl', 3, 10, 15, 45),
        sx('x_legs_standing_calf_raise', 4, 12, 20, 80),
      ]),
      // Thu — Push
      day('Push', [
        sx('x_chest_incline_bench_press', 4, 6, 10, 70),
        sx('x_shoulders_seated_dumbbell_press', 3, 8, 12, 28),
        sx('x_chest_cable_fly', 3, 12, 15, 15),
        sx('x_triceps_skull_crusher', 3, 8, 12, 35),
        sx('x_shoulders_cable_lateral_raise', 3, 12, 20, 10),
      ]),
      // Fri — Pull
      day('Pull', [
        sx('x_back_barbell_row', 4, 6, 10, 80),
        sx('x_back_lat_pulldown', 3, 8, 12, 65),
        sx('x_back_dumbbell_row', 3, 8, 12, 32),
        sx('x_biceps_incline_dumbbell_curl', 3, 10, 12, 14),
        sx('x_biceps_hammer_curl', 3, 10, 12, 16),
      ]),
      // Sat — Legs
      day('Legs', [
        sx('x_legs_front_squat', 4, 6, 10, 80),
        sx('x_legs_hip_thrust', 3, 8, 12, 120),
        sx('x_legs_leg_extension', 3, 12, 15, 55),
        sx('x_legs_seated_leg_curl', 3, 12, 15, 45),
        sx('x_core_hanging_leg_raise', 3, 10, 15),
      ]),
      // Sun — Rest
      rest(),
    ],
  };
}

/** A second, simpler split so the switcher isn't lonely. */
export function buildUpperLowerSplit(): Split {
  return {
    id: 'split_ul',
    name: 'Upper / Lower',
    days: [
      day('Upper', [
        sx('x_chest_barbell_bench_press', 4, 6, 10, 80),
        sx('x_back_barbell_row', 4, 6, 10, 80),
        sx('x_shoulders_overhead_press', 3, 8, 12, 45),
        sx('x_biceps_dumbbell_curl', 3, 10, 12, 16),
        sx('x_triceps_triceps_pushdown', 3, 10, 12, 25),
      ]),
      day('Lower', [
        sx('x_legs_back_squat', 4, 5, 8, 110),
        sx('x_legs_romanian_deadlift', 3, 8, 12, 90),
        sx('x_legs_leg_press', 3, 10, 15, 180),
        sx('x_legs_standing_calf_raise', 4, 12, 20, 80),
      ]),
      rest(),
      day('Upper', [
        sx('x_chest_incline_bench_press', 4, 6, 10, 70),
        sx('x_back_lat_pulldown', 3, 8, 12, 65),
        sx('x_shoulders_lateral_raise', 3, 12, 15, 12),
        sx('x_biceps_hammer_curl', 3, 10, 12, 16),
        sx('x_triceps_skull_crusher', 3, 8, 12, 35),
      ]),
      day('Lower', [
        sx('x_legs_front_squat', 4, 6, 10, 80),
        sx('x_legs_lying_leg_curl', 3, 10, 15, 45),
        sx('x_legs_leg_extension', 3, 12, 15, 55),
        sx('x_legs_hip_thrust', 3, 8, 12, 120),
      ]),
      rest(),
      rest(),
      rest(),
    ],
  };
}

// --- Session history -------------------------------------------------------

function set(weightKg: number, reps: number): LoggedSet {
  return { id: uid('s_'), weightKg, reps, done: true };
}

// Deterministic-ish helper: builds N progressively heavier sets.
function ramp(base: number, sets: number, reps: number, growth = 0): LoggedSet[] {
  return Array.from({ length: sets }, () => set(base + growth, reps));
}

function finish(session: Session): Session {
  const s = { ...session };
  s.totalVolumeKg = sessionVolume(s);
  return s;
}

/**
 * Builds ~4 weeks of realistic PPL history with a mild upward trend, so the
 * charts and history screen are populated on first launch.
 */
export function buildSampleSessions(split: Split): Session[] {
  const sessions: Session[] = [];
  const today = new Date();
  today.setHours(18, 0, 0, 0);

  // Iterate the last 28 days; on non-rest split days, log a session with a
  // gentle progression driven by how long ago it was.
  for (let ago = 28; ago >= 1; ago--) {
    const date = addDays(today, -ago);
    const dow = (date.getDay() + 6) % 7; // 0 = Mon
    const splitDay = split.days[dow];
    if (splitDay.isRest || splitDay.exercises.length === 0) continue;
    // Skip ~1 in 5 to look human.
    if ((ago * 7) % 5 === 0) continue;

    const weeksAgo = Math.floor(ago / 7);
    const bump = (3 - weeksAgo) * 2.5; // heavier as we approach today

    const exercises = splitDay.exercises.map((se) => {
      const baseW = (se.targetWeightKg ?? 20) + bump;
      const reps = Math.round((se.repMin + se.repMax) / 2);
      return {
        exerciseId: se.exerciseId,
        sets: ramp(Math.max(2.5, baseW), se.targetSets, reps),
      };
    });

    const started = new Date(date);
    const durationSec = 55 * 60 + ((ago * 137) % 900); // ~55–70 min
    sessions.push(
      finish({
        id: uid('sess_'),
        startedAt: started.toISOString(),
        finishedAt: new Date(started.getTime() + durationSec * 1000).toISOString(),
        splitId: split.id,
        dayName: splitDay.name,
        exercises,
        notes: '',
        totalVolumeKg: 0,
        durationSec,
      })
    );
  }
  return sessions;
}

export function buildSampleBodyweight(): BodyWeightEntry[] {
  const entries: BodyWeightEntry[] = [];
  const today = new Date();
  today.setHours(8, 0, 0, 0);
  let w = 82.5;
  for (let ago = 30; ago >= 0; ago -= 3) {
    const date = addDays(today, -ago);
    // slow recomposition downward with tiny noise
    w = 82.5 - (30 - ago) * 0.05 + ((ago % 4) - 1.5) * 0.15;
    entries.push({
      id: uid('bw_'),
      date: date.toISOString(),
      weightKg: Number(w.toFixed(1)),
    });
  }
  return entries;
}
