import { taskPoints } from './points';
import {
  indexCompletions,
  activeTasksOn,
  dayStatus,
  currentStreak,
  bestStreak,
  monthStreakBonus,
} from './dayStatus';
import { consistencyRatio, rewardForConsistency } from './rewards';
import { todayStr, addDays, daysInMonthKey } from './dates';

// Compute everything the Home screen needs from raw data. Kept pure so it can be
// unit-tested and recomputed cheaply on every tick for a live reward.
//
//   tasks             - all tasks (including archived, for history accuracy)
//   priorityCategory  - category matching this month's priority, or null
//   completions       - raw completion rows
//   today             - YYYY-MM-DD (injectable for tests)
export function computeSummary(tasks, priorityCategory, completions, today = todayStr()) {
  const byDate = indexCompletions(completions);
  const monthKey = today.slice(0, 7);
  const monthStart = `${monthKey}-01`;

  // ----- Today -----
  const todaysTasks = activeTasksOn(tasks, today).map((t) => {
    const pts = taskPoints(t, priorityCategory);
    const done = byDate[today] ? byDate[today].doneIds.has(t.id) : false;
    return { ...t, points: pts, done };
  });
  const todayPossible = todaysTasks.reduce((s, t) => s + t.points, 0);
  const todayEarned = todaysTasks.reduce((s, t) => s + (t.done ? t.points : 0), 0);
  const todayDone = todaysTasks.filter((t) => t.done).length;

  // ----- Month totals -----
  // Possible = sum over each elapsed day of that day's active-task points.
  // Earned   = sum over each elapsed day of that day's completed points.
  let monthPossible = 0;
  let monthEarned = 0;
  let d = monthStart;
  while (d <= today) {
    const s = dayStatus(tasks, byDate, d, priorityCategory);
    monthPossible += s.possible;
    monthEarned += s.earned;
    d = addDays(d, 1);
  }

  const bonus = monthStreakBonus(tasks, byDate, priorityCategory, monthKey, today);
  const consistency = consistencyRatio(monthEarned, monthPossible);
  const reward = rewardForConsistency(consistency);
  const totalPoints = monthEarned + bonus;

  const streakNow = currentStreak(tasks, byDate, priorityCategory, today);
  const streakBest = bestStreak(tasks, byDate, priorityCategory, today);

  // ----- Forecast: the best reward still reachable if every remaining
  // scheduled task (today's unfinished + all future days this month) is done.
  const totalDays = daysInMonthKey(monthKey);
  const lastDay = `${monthKey}-${String(totalDays).padStart(2, '0')}`;
  let futurePossible = 0;
  let fd = addDays(today, 1);
  while (fd <= lastDay) {
    for (const t of activeTasksOn(tasks, fd)) {
      futurePossible += taskPoints(t, priorityCategory);
    }
    fd = addDays(fd, 1);
  }
  const todayRemaining = todayPossible - todayEarned;
  const fullMonthPossible = monthPossible + futurePossible;
  const projectedEarned = monthEarned + todayRemaining + futurePossible;
  const projectedConsistency = consistencyRatio(projectedEarned, fullMonthPossible);
  const projectedReward = rewardForConsistency(projectedConsistency);

  return {
    today,
    monthKey,
    todaysTasks,
    todayPossible,
    todayEarned,
    todayDone,
    todayCount: todaysTasks.length,
    monthPossible,
    monthEarned,
    bonus,
    totalPoints,
    consistency,
    reward,
    currentStreak: streakNow,
    bestStreak: streakBest,
    fullMonthPossible,
    projectedConsistency,
    projectedReward,
  };
}
