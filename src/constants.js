// Domain constants shared across the app.

export const CATEGORIES = ['Health', 'Business', 'Learning', 'Discipline', 'Other'];

export const IMPORTANCE_LEVELS = ['High', 'Medium', 'Low'];

// Base points earned for completing a task, by importance.
export const IMPORTANCE_POINTS = {
  High: 30,
  Medium: 20,
  Low: 10,
};

// Tasks whose category matches the monthly priority earn this multiplier.
export const PRIORITY_MULTIPLIER = 2;

// Money reward bounds (Indian Rupees).
export const REWARD_MIN = 10000;
export const REWARD_MAX = 20000;

// Bonus points awarded for every full 7 consecutive completed days.
export const STREAK_BONUS_DAYS = 7;
export const STREAK_BONUS_POINTS = 50;

// Default daily reminder time (24h).
export const DEFAULT_REMINDER_HOUR = 20;
export const DEFAULT_REMINDER_MINUTE = 0;

// Per-task scheduling. A task's `days` field is a comma-separated list of
// weekday indices (0 = Sun … 6 = Sat), or the literal 'all' for every day.
// Days on which no task is scheduled become neutral "rest days": they never
// break a streak and don't count against consistency.
export const SCHEDULE_ALL = 'all';
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_ONLY = '1,2,3,4,5'; // Mon–Fri
