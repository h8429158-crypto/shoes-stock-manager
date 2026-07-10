import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Switch, Pressable, Alert } from 'react-native';

import Screen, { SectionTitle } from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { colors, spacing, font, radius } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { pad2, formatMonthKey } from '../logic/dates';
import { formatRupees, formatPercent } from '../logic/rewards';

function TimeStepper({ label, value, onChange, min, max, step = 1 }) {
  const dec = () => onChange((value - step + (max + 1)) % (max + 1));
  const inc = () => onChange((value + step) % (max + 1));
  return (
    <View style={styles.stepperCol}>
      <Pressable onPress={inc} style={styles.stepBtn} hitSlop={8}>
        <Text style={styles.stepBtnText}>▲</Text>
      </Pressable>
      <Text style={styles.stepValue}>{pad2(value)}</Text>
      <Pressable onPress={dec} style={styles.stepBtn} hitSlop={8}>
        <Text style={styles.stepBtnText}>▼</Text>
      </Pressable>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const {
    settings,
    priority,
    saveName,
    updateReminder,
    factoryReset,
    payouts,
    totalPaid,
    exportBackup,
    importBackup,
    updateRewardRange,
    summary,
  } = useApp();

  const [name, setNameState] = useState(settings.name);
  const [hour, setHour] = useState(settings.reminderHour);
  const [minute, setMinute] = useState(settings.reminderMinute);
  const [enabled, setEnabled] = useState(settings.reminderEnabled);
  const [busy, setBusy] = useState(false);
  const [minText, setMinText] = useState(String(settings.rewardMin));
  const [maxText, setMaxText] = useState(String(settings.rewardMax));

  const saveRange = () => {
    const mn = Math.round(Number(minText));
    const mx = Math.round(Number(maxText));
    if (!Number.isFinite(mn) || !Number.isFinite(mx) || mn < 0 || mx <= mn) {
      Alert.alert('Invalid range', 'The maximum must be greater than the minimum.');
      return;
    }
    updateRewardRange(mn, mx);
    Alert.alert('Saved', 'Your reward range was updated.');
  };

  const doExport = async () => {
    setBusy(true);
    try {
      await exportBackup();
    } catch (e) {
      Alert.alert('Export failed', e.message || 'Could not create a backup file.');
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    Alert.alert(
      'Restore from backup?',
      'This replaces all current tasks, history, and rewards with the contents of the backup file.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose file',
          onPress: async () => {
            setBusy(true);
            try {
              const res = await importBackup();
              if (res.imported) {
                Alert.alert('Restored', 'Your data was imported successfully.');
              }
            } catch (e) {
              Alert.alert('Import failed', e.message || 'That file could not be read.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const saveNameNow = () => {
    if (name.trim() !== settings.name) saveName(name.trim());
  };

  const toggleReminder = (v) => {
    setEnabled(v);
    updateReminder({ enabled: v, hour, minute });
  };

  const saveTime = (h, m) => {
    setHour(h);
    setMinute(m);
    updateReminder({ enabled, hour: h, minute: m });
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset everything?',
      'This permanently deletes all tasks, history, and points. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => factoryReset() },
      ],
    );
  };

  const timeStr = `${pad2(hour)}:${pad2(minute)}`;

  return (
    <Screen title="Settings">
      <SectionTitle>Profile</SectionTitle>
      <Card>
        <Text style={styles.label}>Your name</Text>
        <TextInput
          value={name}
          onChangeText={setNameState}
          onBlur={saveNameNow}
          placeholder="Your name"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={saveNameNow}
        />
      </Card>

      <SectionTitle>Monthly priority</SectionTitle>
      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>
              {priority ? priority.label || priority.category : 'Not set'}
            </Text>
            <Text style={styles.rowSub}>
              {priority ? `${priority.category} · 2× points` : 'Set a focus for this month'}
            </Text>
          </View>
          <Button
            title="Change"
            variant="secondary"
            onPress={() => navigation.navigate('SetPriority')}
            style={styles.smallBtn}
          />
        </View>
      </Card>

      <SectionTitle>Rewards paid to yourself</SectionTitle>
      <Card>
        <Text style={styles.totalPaid}>{formatRupees(totalPaid)}</Text>
        <Text style={styles.rowSub}>Total you've paid yourself so far</Text>
        {payouts.length === 0 ? (
          <Text style={styles.ledgerEmpty}>
            No rewards logged yet. Finish a month and tap “Mark as paid”.
          </Text>
        ) : (
          <View style={styles.ledger}>
            {payouts.slice(0, 6).map((p) => (
              <View key={p.month} style={styles.ledgerRow}>
                <View>
                  <Text style={styles.ledgerMonth}>{formatMonthKey(p.month)}</Text>
                  <Text style={styles.ledgerSub}>
                    {formatPercent(p.consistency)} · {p.points} pts
                  </Text>
                </View>
                <Text style={styles.ledgerAmount}>{formatRupees(p.amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      <SectionTitle>Backup &amp; restore</SectionTitle>
      <Card>
        <Text style={styles.rowSub}>
          Everything lives only on this phone. Export a backup file to keep your
          history safe, or restore it on a new device. Fully offline.
        </Text>
        <View style={styles.backupRow}>
          <Button
            title="Export backup"
            variant="secondary"
            onPress={doExport}
            loading={busy}
            style={styles.backupBtn}
          />
          <Button
            title="Restore"
            variant="secondary"
            onPress={doImport}
            disabled={busy}
            style={styles.backupBtn}
          />
        </View>
      </Card>

      <SectionTitle>Daily reminder</SectionTitle>
      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Remind me daily</Text>
            <Text style={styles.rowSub}>
              {enabled ? `Every day at ${timeStr}` : 'Reminders off'}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={toggleReminder}
            trackColor={{ true: colors.primaryDark, false: colors.border }}
            thumbColor={enabled ? colors.primary : colors.textFaint}
          />
        </View>

        {enabled && (
          <View style={styles.stepperRow}>
            <TimeStepper
              label="Hour"
              value={hour}
              onChange={(h) => saveTime(h, minute)}
              min={0}
              max={23}
            />
            <Text style={styles.colon}>:</Text>
            <TimeStepper
              label="Minute"
              value={minute}
              onChange={(m) => saveTime(hour, m)}
              min={0}
              max={59}
              step={5}
            />
          </View>
        )}
      </Card>

      <SectionTitle>Reward range</SectionTitle>
      <Card>
        <Text style={styles.help}>
          The money you pay yourself. The minimum is guaranteed; the maximum is
          for a perfect month.
        </Text>
        <Text style={[styles.label, { marginTop: spacing.md }]}>Minimum (₹)</Text>
        <TextInput
          value={minText}
          onChangeText={setMinText}
          keyboardType="number-pad"
          style={styles.input}
        />
        <Text style={[styles.label, { marginTop: spacing.md }]}>Maximum (₹)</Text>
        <TextInput
          value={maxText}
          onChangeText={setMaxText}
          keyboardType="number-pad"
          style={styles.input}
        />
        <Button title="Save range" variant="secondary" onPress={saveRange} />
        <Text style={styles.rangeNote}>
          Each fully-completed day is worth ₹{summary.perDay.toFixed(2)} this month
          ({formatRupees(summary.rewardMax - summary.rewardMin)} ÷ {summary.daysInMonth} days).
        </Text>
      </Card>

      <SectionTitle>How rewards work</SectionTitle>
      <Card>
        <Text style={styles.help}>
          Each day you complete all your tasks, you bank one day's slice:
          (max − min) ÷ days in the month. Do everything every day to reach the
          maximum. A partial day banks part of its slice; a missed day banks
          nothing but never takes money away.
          {'\n\n'}Everything resets on the 1st; your task list carries over.
        </Text>
      </Card>

      <SectionTitle>Danger zone</SectionTitle>
      <Button
        title="Reset all data"
        variant="danger"
        onPress={confirmReset}
        style={{ marginBottom: spacing.xl }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textDim, fontSize: font.xs, fontWeight: '700', marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: font.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { color: colors.text, fontSize: font.md, fontWeight: '700' },
  rowSub: { color: colors.textDim, fontSize: font.sm, marginTop: 2, lineHeight: 20 },
  smallBtn: { minHeight: 44, paddingHorizontal: spacing.lg },
  totalPaid: { color: colors.primary, fontSize: font.xxl, fontWeight: '900' },
  ledgerEmpty: { color: colors.textFaint, fontSize: font.sm, marginTop: spacing.md, lineHeight: 20 },
  ledger: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ledgerMonth: { color: colors.text, fontSize: font.sm, fontWeight: '700' },
  ledgerSub: { color: colors.textDim, fontSize: font.xs, marginTop: 2 },
  ledgerAmount: { color: colors.primary, fontSize: font.md, fontWeight: '800' },
  backupRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  backupBtn: { flex: 1 },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  stepperCol: { alignItems: 'center' },
  stepBtn: { padding: spacing.sm },
  stepBtnText: { color: colors.primary, fontSize: font.lg, fontWeight: '800' },
  stepValue: { color: colors.text, fontSize: font.xxl, fontWeight: '900', width: 64, textAlign: 'center' },
  stepLabel: { color: colors.textFaint, fontSize: font.xs, marginTop: 4 },
  colon: { color: colors.text, fontSize: font.xxl, fontWeight: '900', marginHorizontal: spacing.md, marginBottom: 18 },
  help: { color: colors.textDim, fontSize: font.sm, lineHeight: 21 },
  rangeNote: { color: colors.textFaint, fontSize: font.xs, marginTop: spacing.md, lineHeight: 18 },
});
