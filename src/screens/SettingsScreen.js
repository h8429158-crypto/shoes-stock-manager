import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Switch, Pressable, Alert } from 'react-native';

import Screen, { SectionTitle } from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { colors, spacing, font, radius } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { pad2 } from '../logic/dates';

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
  const { settings, priority, saveName, updateReminder, factoryReset } = useApp();

  const [name, setNameState] = useState(settings.name);
  const [hour, setHour] = useState(settings.reminderHour);
  const [minute, setMinute] = useState(settings.reminderMinute);
  const [enabled, setEnabled] = useState(settings.reminderEnabled);

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

      <SectionTitle>How rewards work</SectionTitle>
      <Card>
        <Text style={styles.help}>
          Each month you earn a real-money reward you pay yourself: a guaranteed
          ₹10,000, rising to ₹20,000 at 100% consistency.
          {'\n\n'}Reward = ₹10,000 + (consistency × ₹10,000){'\n'}
          Consistency = points earned ÷ points possible this month.
          {'\n\n'}Points reset on the 1st of each month; your task list carries over.
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
  rowSub: { color: colors.textDim, fontSize: font.sm, marginTop: 2 },
  smallBtn: { minHeight: 44, paddingHorizontal: spacing.lg },
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
});
