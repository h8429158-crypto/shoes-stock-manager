import { taskPoints } from './points';
import {
  indexCompletions,
  activeTasksOn,
  dayStatus,
  currentStreak,
  bestStreak,
  monthStreakBonus,
} from './dayStatus';
import { consistencyRatio, perDayShare, rewardFromAccrued } from './rewards';
import { REWARD_MIN, REWARD_MAX } from '../constants';
import { todayStr, addDays, daysInMonthKey } from './dates';

// Compute everything the Home screen needs from raw data. Kept pure so it can be
// unit-tested and recomputed cheaply on every tick for a live reward.
//
//   tasks             - all tasks (including archived, for history accuracy)
//   priorityCategory  - category matching this month's priority, or null
//   completions       - raw completion rows
//   today             - YYYY-MM-DD (injectable for tests)
//   min, max          - reward range (user-configurable)
export function computeSummary(
  tasks,
  priorityCategory,
  completions,
  today = todayStr(),
  min = REWARD_MIN,
  max = REWARD_MAX,
) {
  const byDate = indexCompletions(completions);
  const monthKey = today.slice(0, 7);
  const monthStart = `${monthKey}-01`;
  const totalDays = daysInMonthKey(monthKey);
  const perDay = perDayShare(totalDays, min, max);

  // ----- Today -----
  const todaysTasks = activeTasksOn(tasks, today).map((t) => {
    const pts = taskPoints(t, priorityCategory);
    const done = byDate[today] ? byDate[today].doneIds.has(t.id) : false;
    return { ...t, points: pts, done };
  });
  const todayPossible = todaysTasks.reduce((s, t) => s + t.points, 0);
  const todayEarned = todaysTasks.reduce((s, t) => s + (t.done ? t.points : 0), 0);
  const todayDone = todaysTasks.filter((t) => t.done).length;

  // ----- Month totals + per-day reward accrual -----
  // Each elapsed day banks (earned/possible) of its equal reward slice.
  let monthPossible = 0;
  let monthEarned = 0;
  let accrued = 0;
  let d = monthStart;
  while (d <= today) {
    const s = dayStatus(tasks, byDate, d, priorityCategory);
    monthPossible += s.possible;
    monthEarned += s.earned;
    if (s.possible > 0) accrued += (s.earned / s.possible) * perDay;
    d = addDays(d, 1);
  }

  const bonus = monthStreakBonus(tasks, byDate, priorityCategory, monthKey, today);
  const reward = rewardFromAccrued(accrued, min, max);
  const consistency = consistencyRatio(monthEarned, monthPossible); // avg daily completion
  const progress = max - min > 0 ? (reward - min) / (max - min) : 0; // money banked
  const totalPoints = monthEarned + bonus;

  const streakNow = currentStreak(tasks, byDate, priorityCategory, today);
  const streakBest = bestStreak(tasks, byDate, priorityCategory, today);

  // ----- Forecast: reward still reachable if every remaining day (today's
  // unfinished tasks + all future days that have tasks) is completed fully.
  const lastDay = `${monthKey}-${String(totalDays).padStart(2, '0')}`;
  const remainingToday =
    todayPossible > 0 ? (1 - todayEarned / todayPossible) * perDay : 0;
  let futureAccrual = 0;
  let fd = addDays(today, 1);
  while (fd <= lastDay) {
    if (activeTasksOn(tasks, fd).length > 0) futureAccrual += perDay;
    fd = addDays(fd, 1);
  }
  const projectedReward = rewardFromAccrued(
    accrued + remainingToday + futureAccrual,
    min,
    max,
  );

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
    progress,
    reward,
    perDay,
    rewardMin: min,
    rewardMax: max,
    daysInMonth: totalDays,
    currentStreak: streakNow,
    bestStreak: streakBest,
    projectedReward,
  };
}
