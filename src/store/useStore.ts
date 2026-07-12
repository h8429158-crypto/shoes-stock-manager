import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BodyWeightEntry,
  Exercise,
  ExercisePR,
  LoggedSet,
  Session,
  SessionExercise,
  Settings,
  Split,
  SplitDay,
  SplitExercise,
} from '@/types';
import { BUILTIN_BY_ID, BUILTIN_EXERCISES } from '@/data/exerciseLibrary';
import {
  buildSampleBodyweight,
  buildSampleSessions,
  buildSampleSplit,
  buildUpperLowerSplit,
} from '@/data/sampleData';
import { uid } from '@/utils/id';
import {
  bestEst1RM,
  bestSetVolume,
  sessionVolume,
  topSetWeight,
} from '@/utils/calc';

const DEFAULT_SETTINGS: Settings = {
  unit: 'kg',
  theme: 'dark',
  restDefaultSec: 90,
  soundEnabled: true,
  hapticsEnabled: true,
  barWeightKg: 20,
  activeSplitId: 'split_ppl',
};

export interface AppData {
  settings: Settings;
  splits: Split[];
  customExercises: Exercise[];
  sessions: Session[];
  bodyweight: BodyWeightEntry[];
}

interface StoreState extends AppData {
  activeSession: Session | null;
  _hasHydrated: boolean;
  _seeded: boolean;

  // lifecycle
  setHydrated: () => void;
  seedIfEmpty: () => void;

  // settings
  updateSettings: (patch: Partial<Settings>) => void;

  // exercises
  addCustomExercise: (name: string, muscle: Exercise['muscle']) => Exercise;

  // splits
  addSplit: (name: string) => Split;
  duplicateSplit: (id: string) => void;
  renameSplit: (id: string, name: string) => void;
  deleteSplit: (id: string) => void;
  setActiveSplit: (id: string) => void;
  setDayRest: (splitId: string, dayIndex: number, isRest: boolean) => void;
  setDayName: (splitId: string, dayIndex: number, name: string) => void;
  addDayExercise: (
    splitId: string,
    dayIndex: number,
    exerciseId: string
  ) => void;
  updateDayExercise: (
    splitId: string,
    dayIndex: number,
    sxId: string,
    patch: Partial<SplitExercise>
  ) => void;
  removeDayExercise: (splitId: string, dayIndex: number, sxId: string) => void;
  reorderDayExercises: (
    splitId: string,
    dayIndex: number,
    from: number,
    to: number
  ) => void;

  // active workout
  startSession: (splitId: string, dayIndex: number) => void;
  startEmptySession: (dayName?: string) => void;
  updateActiveSet: (
    exIndex: number,
    setId: string,
    patch: Partial<LoggedSet>
  ) => void;
  addSet: (exIndex: number) => void;
  removeSet: (exIndex: number, setId: string) => void;
  toggleSetDone: (exIndex: number, setId: string) => void;
  addExerciseToSession: (exerciseId: string) => void;
  setActiveNotes: (notes: string) => void;
  finishSession: () => Session | null;
  discardSession: () => void;

  // history
  deleteSession: (id: string) => void;

  // bodyweight
  addBodyweight: (weightKg: number) => void;
  deleteBodyweight: (id: string) => void;

  // import / export
  exportData: () => AppData;
  importData: (data: Partial<AppData>) => void;
}

// Immutable helper to patch a single day of a split.
function patchDay(
  splits: Split[],
  splitId: string,
  dayIndex: number,
  fn: (day: SplitDay) => SplitDay
): Split[] {
  return splits.map((s) =>
    s.id === splitId
      ? { ...s, days: s.days.map((d, i) => (i === dayIndex ? fn(d) : d)) }
      : s
  );
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      splits: [],
      customExercises: [],
      sessions: [],
      bodyweight: [],
      activeSession: null,
      _hasHydrated: false,
      _seeded: false,

      setHydrated: () => set({ _hasHydrated: true }),

      seedIfEmpty: () => {
        if (get()._seeded) return;
        const ppl = buildSampleSplit();
        const ul = buildUpperLowerSplit();
        set({
          _seeded: true,
          splits: [ppl, ul],
          sessions: buildSampleSessions(ppl),
          bodyweight: buildSampleBodyweight(),
          settings: { ...get().settings, activeSplitId: ppl.id },
        });
      },

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      addCustomExercise: (name, muscle) => {
        const ex: Exercise = { id: uid('cx_'), name: name.trim(), muscle, custom: true };
        set((s) => ({ customExercises: [...s.customExercises, ex] }));
        return ex;
      },

      addSplit: (name) => {
        const split: Split = {
          id: uid('split_'),
          name: name.trim() || 'New Split',
          days: Array.from({ length: 7 }, () => ({
            id: uid('d_'),
            name: 'Rest',
            isRest: true,
            exercises: [],
          })),
        };
        set((s) => ({ splits: [...s.splits, split] }));
        return split;
      },

      duplicateSplit: (id) =>
        set((s) => {
          const src = s.splits.find((x) => x.id === id);
          if (!src) return {};
          const copy: Split = {
            ...src,
            id: uid('split_'),
            name: `${src.name} (copy)`,
            days: src.days.map((d) => ({
              ...d,
              id: uid('d_'),
              exercises: d.exercises.map((e) => ({ ...e, id: uid('sx_') })),
            })),
          };
          return { splits: [...s.splits, copy] };
        }),

      renameSplit: (id, name) =>
        set((s) => ({
          splits: s.splits.map((x) => (x.id === id ? { ...x, name } : x)),
        })),

      deleteSplit: (id) =>
        set((s) => {
          const splits = s.splits.filter((x) => x.id !== id);
          const activeSplitId =
            s.settings.activeSplitId === id
              ? splits[0]?.id
              : s.settings.activeSplitId;
          return { splits, settings: { ...s.settings, activeSplitId } };
        }),

      setActiveSplit: (id) =>
        set((s) => ({ settings: { ...s.settings, activeSplitId: id } })),

      setDayRest: (splitId, dayIndex, isRest) =>
        set((s) => ({
          splits: patchDay(s.splits, splitId, dayIndex, (d) => ({
            ...d,
            isRest,
            name: isRest ? 'Rest' : d.name === 'Rest' ? 'Training' : d.name,
          })),
        })),

      setDayName: (splitId, dayIndex, name) =>
        set((s) => ({
          splits: patchDay(s.splits, splitId, dayIndex, (d) => ({ ...d, name })),
        })),

      addDayExercise: (splitId, dayIndex, exerciseId) =>
        set((s) => ({
          splits: patchDay(s.splits, splitId, dayIndex, (d) => ({
            ...d,
            isRest: false,
            name: d.isRest ? 'Training' : d.name,
            exercises: [
              ...d.exercises,
              {
                id: uid('sx_'),
                exerciseId,
                targetSets: 3,
                repMin: 8,
                repMax: 12,
              },
            ],
          })),
        })),

      updateDayExercise: (splitId, dayIndex, sxId, patch) =>
        set((s) => ({
          splits: patchDay(s.splits, splitId, dayIndex, (d) => ({
            ...d,
            exercises: d.exercises.map((e) =>
              e.id === sxId ? { ...e, ...patch } : e
            ),
          })),
        })),

      removeDayExercise: (splitId, dayIndex, sxId) =>
        set((s) => ({
          splits: patchDay(s.splits, splitId, dayIndex, (d) => ({
            ...d,
            exercises: d.exercises.filter((e) => e.id !== sxId),
          })),
        })),

      reorderDayExercises: (splitId, dayIndex, from, to) =>
        set((s) => ({
          splits: patchDay(s.splits, splitId, dayIndex, (d) => {
            const list = [...d.exercises];
            if (from < 0 || from >= list.length || to < 0 || to >= list.length)
              return d;
            const [moved] = list.splice(from, 1);
            list.splice(to, 0, moved);
            return { ...d, exercises: list };
          }),
        })),

      startSession: (splitId, dayIndex) => {
        const state = get();
        const split = state.splits.find((x) => x.id === splitId);
        const day = split?.days[dayIndex];
        const exercises: SessionExercise[] = (day?.exercises ?? []).map((se) => {
          const last = lastSessionForExercise(state.sessions, se.exerciseId);
          const lastSets = last?.sets ?? [];
          const sets: LoggedSet[] = Array.from({ length: se.targetSets }, (_, i) => ({
            id: uid('s_'),
            // pre-fill from the target weight (or last session) so steppers
            // start somewhere sensible; reps default to the low end of range.
            weightKg: se.targetWeightKg ?? lastSets[i]?.weightKg ?? lastSets[0]?.weightKg ?? 0,
            reps: se.repMin,
            done: false,
          }));
          return { exerciseId: se.exerciseId, sets };
        });
        set({
          activeSession: {
            id: uid('sess_'),
            startedAt: new Date().toISOString(),
            splitId,
            dayName: day?.name ?? 'Workout',
            exercises,
            notes: '',
            totalVolumeKg: 0,
            durationSec: 0,
          },
        });
      },

      startEmptySession: (dayName) =>
        set({
          activeSession: {
            id: uid('sess_'),
            startedAt: new Date().toISOString(),
            dayName: dayName ?? 'Freestyle',
            exercises: [],
            notes: '',
            totalVolumeKg: 0,
            durationSec: 0,
          },
        }),

      updateActiveSet: (exIndex, setId, patch) =>
        set((s) => {
          if (!s.activeSession) return {};
          const exercises = s.activeSession.exercises.map((ex, i) =>
            i === exIndex
              ? {
                  ...ex,
                  sets: ex.sets.map((st) =>
                    st.id === setId ? { ...st, ...patch } : st
                  ),
                }
              : ex
          );
          return { activeSession: { ...s.activeSession, exercises } };
        }),

      addSet: (exIndex) =>
        set((s) => {
          if (!s.activeSession) return {};
          const exercises = s.activeSession.exercises.map((ex, i) => {
            if (i !== exIndex) return ex;
            const last = ex.sets[ex.sets.length - 1];
            return {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  id: uid('s_'),
                  weightKg: last?.weightKg ?? 0,
                  reps: last?.reps ?? 8,
                  done: false,
                },
              ],
            };
          });
          return { activeSession: { ...s.activeSession, exercises } };
        }),

      removeSet: (exIndex, setId) =>
        set((s) => {
          if (!s.activeSession) return {};
          const exercises = s.activeSession.exercises.map((ex, i) =>
            i === exIndex
              ? { ...ex, sets: ex.sets.filter((st) => st.id !== setId) }
              : ex
          );
          return { activeSession: { ...s.activeSession, exercises } };
        }),

      toggleSetDone: (exIndex, setId) =>
        set((s) => {
          if (!s.activeSession) return {};
          const exercises = s.activeSession.exercises.map((ex, i) =>
            i === exIndex
              ? {
                  ...ex,
                  sets: ex.sets.map((st) =>
                    st.id === setId ? { ...st, done: !st.done } : st
                  ),
                }
              : ex
          );
          return { activeSession: { ...s.activeSession, exercises } };
        }),

      addExerciseToSession: (exerciseId) =>
        set((s) => {
          if (!s.activeSession) return {};
          const last = lastSessionForExercise(s.sessions, exerciseId);
          const w = last?.sets[0]?.weightKg ?? 0;
          const newEx: SessionExercise = {
            exerciseId,
            sets: [
              { id: uid('s_'), weightKg: w, reps: 8, done: false },
              { id: uid('s_'), weightKg: w, reps: 8, done: false },
              { id: uid('s_'), weightKg: w, reps: 8, done: false },
            ],
          };
          return {
            activeSession: {
              ...s.activeSession,
              exercises: [...s.activeSession.exercises, newEx],
            },
          };
        }),

      setActiveNotes: (notes) =>
        set((s) =>
          s.activeSession
            ? { activeSession: { ...s.activeSession, notes } }
            : {}
        ),

      finishSession: () => {
        const s = get();
        const active = s.activeSession;
        if (!active) return null;
        const finishedAt = new Date().toISOString();
        const durationSec = Math.round(
          (new Date(finishedAt).getTime() - new Date(active.startedAt).getTime()) /
            1000
        );
        // Drop exercises whose sets were never completed.
        const exercises = active.exercises
          .map((ex) => ({ ...ex, sets: ex.sets.filter((st) => st.done) }))
          .filter((ex) => ex.sets.length > 0);
        const finished: Session = {
          ...active,
          finishedAt,
          durationSec,
          exercises,
          totalVolumeKg: 0,
        };
        finished.totalVolumeKg = sessionVolume(finished);
        set((st) => ({
          sessions: [finished, ...st.sessions],
          activeSession: null,
        }));
        return finished;
      },

      discardSession: () => set({ activeSession: null }),

      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      addBodyweight: (weightKg) =>
        set((s) => ({
          bodyweight: [
            ...s.bodyweight,
            { id: uid('bw_'), date: new Date().toISOString(), weightKg },
          ].sort((a, b) => a.date.localeCompare(b.date)),
        })),

      deleteBodyweight: (id) =>
        set((s) => ({ bodyweight: s.bodyweight.filter((x) => x.id !== id) })),

      exportData: () => {
        const { settings, splits, customExercises, sessions, bodyweight } = get();
        return { settings, splits, customExercises, sessions, bodyweight };
      },

      importData: (data) =>
        set((s) => ({
          settings: { ...s.settings, ...(data.settings ?? {}) },
          splits: data.splits ?? s.splits,
          customExercises: data.customExercises ?? s.customExercises,
          sessions: data.sessions ?? s.sessions,
          bodyweight: data.bodyweight ?? s.bodyweight,
          _seeded: true,
        })),
    }),
    {
      name: 'gym-tracker-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        splits: state.splits,
        customExercises: state.customExercises,
        sessions: state.sessions,
        bodyweight: state.bodyweight,
        activeSession: state.activeSession,
        _seeded: state._seeded,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

// ---------------------------------------------------------------------------
// Pure selectors / helpers (work off state passed in so they can be reused in
// sample-data generation and components alike).
// ---------------------------------------------------------------------------

export function allExercises(state: StoreState): Exercise[] {
  return [...BUILTIN_EXERCISES, ...state.customExercises];
}

export function exerciseName(state: StoreState, id: string): string {
  return (
    BUILTIN_BY_ID[id]?.name ??
    state.customExercises.find((e) => e.id === id)?.name ??
    'Exercise'
  );
}

export function exerciseById(
  state: StoreState,
  id: string
): Exercise | undefined {
  return BUILTIN_BY_ID[id] ?? state.customExercises.find((e) => e.id === id);
}

/** The most recent finished session-exercise for a given exercise id. */
export function lastSessionForExercise(
  sessions: Session[],
  exerciseId: string
): SessionExercise | undefined {
  const sorted = [...sessions].sort((a, b) =>
    (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt)
  );
  for (const s of sorted) {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (ex && ex.sets.length) return ex;
  }
  return undefined;
}

/** Compute the PR snapshot for one exercise across all finished sessions. */
export function computePR(
  sessions: Session[],
  exerciseId: string
): ExercisePR {
  let heaviest = 0;
  let bestVol = 0;
  let best1rm = 0;
  let best1rmDate: string | undefined;
  for (const s of sessions) {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    heaviest = Math.max(heaviest, topSetWeight(ex));
    bestVol = Math.max(bestVol, bestSetVolume(ex));
    const e1 = bestEst1RM(ex);
    if (e1 > best1rm) {
      best1rm = e1;
      best1rmDate = s.finishedAt ?? s.startedAt;
    }
  }
  return {
    exerciseId,
    heaviestWeightKg: heaviest,
    bestSetVolumeKg: bestVol,
    bestEst1RMKg: best1rm,
    bestEst1RMDate: best1rmDate,
  };
}

/** All exercise ids that appear in history, most-recent first. */
export function exercisesInHistory(sessions: Session[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  const sorted = [...sessions].sort((a, b) =>
    (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt)
  );
  for (const s of sorted) {
    for (const ex of s.exercises) {
      if (!seen.has(ex.exerciseId)) {
        seen.add(ex.exerciseId);
        order.push(ex.exerciseId);
      }
    }
  }
  return order;
}
