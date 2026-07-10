import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';

import { initDatabase, resetAllData } from '../db/database';
import { getAllTasks, addTask, updateTask, deleteTask } from '../db/tasks';
import { getAllCompletions, toggleCompletion } from '../db/completions';
import { getPriority, setPriority as dbSetPriority } from '../db/priorities';
import {
  getAllPayouts,
  markPaid as dbMarkPaid,
  unmarkPaid as dbUnmarkPaid,
} from '../db/payouts';
import { exportBackup as dbExportBackup, importBackup as dbImportBackup } from '../db/backup';
import {
  getAppSettings,
  setName as dbSetName,
  setOnboarded as dbSetOnboarded,
  setReminder as dbSetReminder,
  setRewardRange as dbSetRewardRange,
} from '../db/settings';
import { computeSummary } from '../logic/summary';
import { lockedTaskIds } from '../logic/locks';
import { currentMonthKey } from '../logic/dates';
import { scheduleDailyReminder } from '../notifications/reminders';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState([]); // all tasks incl. archived
  const [completions, setCompletions] = useState([]);
  const [priority, setPriorityRow] = useState(null); // { month, category, label }
  const [payouts, setPayouts] = useState([]);
  const [settings, setSettings] = useState({
    name: '',
    onboarded: false,
    reminderEnabled: true,
    reminderHour: 20,
    reminderMinute: 0,
    rewardMin: 10000,
    rewardMax: 20000,
  });

  // Pull everything fresh from SQLite and recompute derived state.
  const reload = useCallback(async () => {
    const [allTasks, allCompletions, prio, appSettings, allPayouts] = await Promise.all([
      getAllTasks(),
      getAllCompletions(),
      getPriority(currentMonthKey()),
      getAppSettings(),
      getAllPayouts(),
    ]);
    setTasks(allTasks);
    setCompletions(allCompletions);
    setPriorityRow(prio || null);
    setSettings(appSettings);
    setPayouts(allPayouts);
    return { allTasks, allCompletions, prio, appSettings, allPayouts };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await initDatabase();
      const data = await reload();
      if (!mounted) return;
      setReady(true);
      // Best-effort schedule the reminder with the current pending count.
      const summary = computeSummary(
        data.allTasks,
        data.prio ? data.prio.category : null,
        data.allCompletions,
      );
      scheduleDailyReminder({
        enabled: data.appSettings.reminderEnabled,
        hour: data.appSettings.reminderHour,
        minute: data.appSettings.reminderMinute,
        pendingCount: summary.todayCount - summary.todayDone,
      });
    })();
    return () => {
      mounted = false;
    };
  }, [reload]);

  const priorityCategory = priority ? priority.category : null;

  const summary = useMemo(
    () =>
      computeSummary(
        tasks,
        priorityCategory,
        completions,
        undefined,
        settings.rewardMin,
        settings.rewardMax,
      ),
    [tasks, priorityCategory, completions, settings.rewardMin, settings.rewardMax],
  );

  const lockedIds = useMemo(
    () => lockedTaskIds(completions, currentMonthKey()),
    [completions],
  );

  const totalPaid = useMemo(
    () => payouts.reduce((s, p) => s + (p.paid ? p.amount : 0), 0),
    [payouts],
  );

  // Keep the scheduled reminder body in sync with pending count / settings.
  useEffect(() => {
    if (!ready) return;
    scheduleDailyReminder({
      enabled: settings.reminderEnabled,
      hour: settings.reminderHour,
      minute: settings.reminderMinute,
      pendingCount: summary.todayCount - summary.todayDone,
    });
  }, [
    ready,
    settings.reminderEnabled,
    settings.reminderHour,
    settings.reminderMinute,
    summary.todayCount,
    summary.todayDone,
  ]);

  // ----- Actions -----
  const actions = useMemo(
    () => ({
      reload,
      async toggleTask(task) {
        await toggleCompletion(task.id, summary.today, task.points);
        const all = await getAllCompletions();
        setCompletions(all);
      },
      async createTask(data) {
        await addTask(data);
        await reload();
      },
      async editTask(id, data) {
        await updateTask(id, data);
        await reload();
      },
      async removeTask(id) {
        const result = await deleteTask(id);
        await reload();
        return result;
      },
      async savePriority(category, label) {
        await dbSetPriority(category, label);
        setPriorityRow(await getPriority(currentMonthKey()));
      },
      async markMonthPaid(month, details) {
        await dbMarkPaid(month, details);
        setPayouts(await getAllPayouts());
      },
      async unmarkMonthPaid(month) {
        await dbUnmarkPaid(month);
        setPayouts(await getAllPayouts());
      },
      async exportBackup() {
        return dbExportBackup();
      },
      async importBackup() {
        const result = await dbImportBackup();
        if (result.imported) await reload();
        return result;
      },
      async saveName(name) {
        await dbSetName(name);
        setSettings((s) => ({ ...s, name }));
      },
      async completeOnboarding({ name, priorityCategory: cat, priorityLabel, firstTasks }) {
        if (name != null) await dbSetName(name);
        if (cat) await dbSetPriority(cat, priorityLabel || '');
        for (const t of firstTasks || []) {
          if (t.title && t.title.trim()) await addTask(t);
        }
        await dbSetOnboarded(true);
        await reload();
      },
      async updateRewardRange(min, max) {
        await dbSetRewardRange(min, max);
        setSettings((s) => ({ ...s, rewardMin: min, rewardMax: max }));
      },
      async updateReminder(next) {
        await dbSetReminder(next);
        setSettings((s) => ({
          ...s,
          reminderEnabled: next.enabled != null ? next.enabled : s.reminderEnabled,
          reminderHour: next.hour != null ? next.hour : s.reminderHour,
          reminderMinute: next.minute != null ? next.minute : s.reminderMinute,
        }));
      },
      async factoryReset() {
        await resetAllData();
        await reload();
      },
    }),
    [reload, summary.today],
  );

  const value = useMemo(
    () => ({
      ready,
      tasks,
      completions,
      priority,
      priorityCategory,
      settings,
      summary,
      payouts,
      totalPaid,
      lockedIds,
      ...actions,
    }),
    [
      ready,
      tasks,
      completions,
      priority,
      priorityCategory,
      settings,
      summary,
      payouts,
      totalPaid,
      lockedIds,
      actions,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
