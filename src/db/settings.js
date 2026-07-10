import { getDb } from './database';
import {
  DEFAULT_REMINDER_HOUR,
  DEFAULT_REMINDER_MINUTE,
  REWARD_MIN,
  REWARD_MAX,
} from '../constants';

export async function getSetting(key, fallback = null) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', key);
  return row ? row.value : fallback;
}

export async function setSetting(key, value) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value == null ? null : String(value),
  );
}

// Read the full settings bundle with sensible defaults.
export async function getAppSettings() {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT key, value FROM settings');
  const map = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    name: map.name || '',
    onboarded: map.onboarded === '1',
    reminderEnabled: map.reminder_enabled == null ? true : map.reminder_enabled === '1',
    reminderHour: map.reminder_hour != null ? Number(map.reminder_hour) : DEFAULT_REMINDER_HOUR,
    reminderMinute: map.reminder_minute != null ? Number(map.reminder_minute) : DEFAULT_REMINDER_MINUTE,
    rewardMin: map.reward_min != null ? Number(map.reward_min) : REWARD_MIN,
    rewardMax: map.reward_max != null ? Number(map.reward_max) : REWARD_MAX,
  };
}

export async function setRewardRange(min, max) {
  await setSetting('reward_min', min);
  await setSetting('reward_max', max);
}

export async function setName(name) {
  await setSetting('name', name);
}

export async function setOnboarded(value = true) {
  await setSetting('onboarded', value ? '1' : '0');
}

export async function setReminder({ enabled, hour, minute }) {
  if (enabled != null) await setSetting('reminder_enabled', enabled ? '1' : '0');
  if (hour != null) await setSetting('reminder_hour', hour);
  if (minute != null) await setSetting('reminder_minute', minute);
}
