import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import { getDb } from './database';

const BACKUP_VERSION = 1;
const TABLES = ['tasks', 'completions', 'priorities', 'payouts', 'settings'];

// Gather every table into a single JSON snapshot.
export async function buildBackupObject() {
  const db = await getDb();
  const data = {};
  for (const t of TABLES) {
    // eslint-disable-next-line no-await-in-loop
    data[t] = await db.getAllAsync(`SELECT * FROM ${t}`);
  }
  return {
    app: 'reward-habits',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

// Write the snapshot to a file and open the share sheet so the user can save it
// to Files / Drive / email. Stays fully offline — no server involved.
export async function exportBackup() {
  const backup = await buildBackupObject();
  const json = JSON.stringify(backup, null, 2);
  const stamp = new Date().toISOString().slice(0, 10);
  const uri = `${FileSystem.cacheDirectory}reward-habits-backup-${stamp}.json`;
  await FileSystem.writeAsStringAsync(uri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save your Reward Habits backup',
      UTI: 'public.json',
    });
  }
  return uri;
}

function assertShape(parsed) {
  if (!parsed || parsed.app !== 'reward-habits' || !parsed.data) {
    throw new Error('This file is not a Reward Habits backup.');
  }
}

// Restore from a picked backup file, replacing all current data in one
// transaction. Returns a small summary of what was imported.
export async function importBackup() {
  const res = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets || res.assets.length === 0) {
    return { imported: false, canceled: true };
  }

  const raw = await FileSystem.readAsStringAsync(res.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const parsed = JSON.parse(raw);
  assertShape(parsed);

  const db = await getDb();
  const { data } = parsed;

  await db.withTransactionAsync(async () => {
    for (const t of TABLES) {
      await db.runAsync(`DELETE FROM ${t}`);
    }
    for (const t of TABLES) {
      const rows = data[t] || [];
      for (const row of rows) {
        const keys = Object.keys(row);
        if (keys.length === 0) continue;
        const placeholders = keys.map(() => '?').join(', ');
        await db.runAsync(
          `INSERT INTO ${t} (${keys.join(', ')}) VALUES (${placeholders})`,
          ...keys.map((k) => row[k]),
        );
      }
    }
  });

  const counts = {};
  for (const t of TABLES) counts[t] = (data[t] || []).length;
  return { imported: true, counts };
}
