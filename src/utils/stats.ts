import { MuscleGroup, Session, Split } from '@/types';
import { epley1RM, sessionVolume } from '@/utils/calc';
import { addDays, dayKey, mondayIndex, startOfWeek } from '@/utils/date';

/** Map of YYYY-MM-DD -> total volume that day (done sets). */
export function volumeByDay(sessions: Session[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sessions) {
    const k = dayKey(new Date(s.finishedAt ?? s.startedAt));
    map[k] = (map[k] ?? 0) + s.totalVolumeKg;
  }
  return map;
}

export interface WeekStats {
  workouts: number;
  volumeKg: number;
  target: number;
}

export function weekStats(
  sessions: Session[],
  split: Split | undefined,
  ref = new Date()
): WeekStats {
  const ws = startOfWeek(ref);
  const we = addDays(ws, 7);
  const inWeek = sessions.filter((s) => {
    const d = new Date(s.finishedAt ?? s.startedAt);
    return d >= ws && d < we;
  });
  const volumeKg = inWeek.reduce((sum, s) => sum + s.totalVolumeKg, 0);
  const target = split ? split.days.filter((d) => !d.isRest).length : 0;
  return { workouts: inWeek.length, volumeKg, target };
}

/**
 * Consecutive-day streak that respects the active split: a scheduled training
 * day with a logged session keeps the streak; a rest day passes through; a
 * scheduled training day with no session breaks it. Today is forgiving (an
 * as-yet-unlogged training day doesn't break the streak).
 */
export function computeStreak(sessions: Session[], split: Split | undefined): number {
  const done = new Set(
    sessions.map((s) => dayKey(new Date(s.finishedAt ?? s.startedAt)))
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 400; i++) {
    const d = addDays(today, -i);
    const key = dayKey(d);
    const isRest = split ? split.days[mondayIndex(d)]?.isRest : false;
    const trained = done.has(key);
    if (trained) {
      streak++;
    } else if (isRest) {
      // rest day: passes through without adding or breaking
      continue;
    } else if (i === 0) {
      // today's training not logged yet — don't break
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export interface PRItem {
  exerciseId: string;
  est1RMKg: number;
  weightKg: number;
  reps: number;
  date: string;
}

/**
 * Detects, per exercise, the sessions that set a new all-time est-1RM record,
 * returning the most recent ones as a feed.
 */
export function recentPRs(sessions: Session[], limit = 6): PRItem[] {
  const chrono = [...sessions].sort((a, b) =>
    (a.finishedAt ?? a.startedAt).localeCompare(b.finishedAt ?? b.startedAt)
  );
  const best: Record<string, number> = {};
  const prs: PRItem[] = [];
  for (const s of chrono) {
    for (const ex of s.exercises) {
      for (const st of ex.sets) {
        if (!st.done) continue;
        const e1 = epley1RM(st.weightKg, st.reps);
        if (e1 > (best[ex.exerciseId] ?? 0) + 1e-6) {
          best[ex.exerciseId] = e1;
          prs.push({
            exerciseId: ex.exerciseId,
            est1RMKg: e1,
            weightKg: st.weightKg,
            reps: st.reps,
            date: s.finishedAt ?? s.startedAt,
          });
        }
      }
    }
  }
  return prs.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

/**
 * Weekly volume per muscle group for the last `weeks` weeks (oldest first).
 * `muscleOf` resolves an exercise id to its muscle group.
 */
export function weeklyMuscleVolume(
  sessions: Session[],
  muscleOf: (exId: string) => MuscleGroup | undefined,
  weeks = 6
): { weekStart: Date; totals: Record<MuscleGroup, number>; total: number }[] {
  const thisWeekStart = startOfWeek(new Date());
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDays(thisWeekStart, -(weeks - 1 - i) * 7);
    return {
      weekStart,
      totals: {} as Record<MuscleGroup, number>,
      total: 0,
    };
  });
  for (const s of sessions) {
    const d = new Date(s.finishedAt ?? s.startedAt);
    const bucket = buckets.find(
      (b) => d >= b.weekStart && d < addDays(b.weekStart, 7)
    );
    if (!bucket) continue;
    for (const ex of s.exercises) {
      const m = muscleOf(ex.exerciseId);
      if (!m) continue;
      const vol = ex.sets.reduce(
        (sum, st) => (st.done ? sum + st.weightKg * st.reps : sum),
        0
      );
      bucket.totals[m] = (bucket.totals[m] ?? 0) + vol;
      bucket.total += vol;
    }
  }
  return buckets;
}

/** Est-1RM and top-set series for one exercise over time (chronological). */
export function exerciseSeries(
  sessions: Session[],
  exerciseId: string
): { date: number; est1RM: number; topSet: number }[] {
  const points: { date: number; est1RM: number; topSet: number }[] = [];
  const chrono = [...sessions].sort((a, b) =>
    (a.finishedAt ?? a.startedAt).localeCompare(b.finishedAt ?? b.startedAt)
  );
  for (const s of chrono) {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    let e1 = 0;
    let top = 0;
    for (const st of ex.sets) {
      if (!st.done) continue;
      e1 = Math.max(e1, epley1RM(st.weightKg, st.reps));
      top = Math.max(top, st.weightKg);
    }
    if (e1 > 0) {
      points.push({
        date: new Date(s.finishedAt ?? s.startedAt).getTime(),
        est1RM: e1,
        topSet: top,
      });
    }
  }
  return points;
}
