import { Exercise, MuscleGroup } from '@/types';

// Built-in exercises. Ids are stable strings prefixed by muscle so custom
// exercises (uid based) never collide with these.
function mk(muscle: MuscleGroup, names: string[]): Exercise[] {
  return names.map((name) => ({
    id: `x_${muscle}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    name,
    muscle,
  }));
}

export const BUILTIN_EXERCISES: Exercise[] = [
  ...mk('chest', [
    'Barbell Bench Press',
    'Incline Bench Press',
    'Dumbbell Bench Press',
    'Incline Dumbbell Press',
    'Machine Chest Press',
    'Cable Fly',
    'Pec Deck',
    'Push-Up',
    'Dips (Chest)',
  ]),
  ...mk('back', [
    'Deadlift',
    'Barbell Row',
    'Pull-Up',
    'Chin-Up',
    'Lat Pulldown',
    'Seated Cable Row',
    'Dumbbell Row',
    'T-Bar Row',
    'Face Pull',
    'Straight-Arm Pulldown',
  ]),
  ...mk('shoulders', [
    'Overhead Press',
    'Seated Dumbbell Press',
    'Arnold Press',
    'Lateral Raise',
    'Cable Lateral Raise',
    'Rear Delt Fly',
    'Upright Row',
    'Front Raise',
  ]),
  ...mk('biceps', [
    'Barbell Curl',
    'Dumbbell Curl',
    'Hammer Curl',
    'Incline Dumbbell Curl',
    'Preacher Curl',
    'Cable Curl',
    'Concentration Curl',
  ]),
  ...mk('triceps', [
    'Close-Grip Bench Press',
    'Triceps Pushdown',
    'Overhead Triceps Extension',
    'Skull Crusher',
    'Dips (Triceps)',
    'Rope Pushdown',
    'Diamond Push-Up',
  ]),
  ...mk('legs', [
    'Back Squat',
    'Front Squat',
    'Leg Press',
    'Romanian Deadlift',
    'Bulgarian Split Squat',
    'Leg Extension',
    'Lying Leg Curl',
    'Seated Leg Curl',
    'Walking Lunge',
    'Standing Calf Raise',
    'Seated Calf Raise',
    'Hip Thrust',
  ]),
  ...mk('core', [
    'Plank',
    'Hanging Leg Raise',
    'Cable Crunch',
    'Ab Wheel Rollout',
    'Russian Twist',
    'Decline Sit-Up',
  ]),
];

export const BUILTIN_BY_ID: Record<string, Exercise> = Object.fromEntries(
  BUILTIN_EXERCISES.map((e) => [e.id, e])
);
