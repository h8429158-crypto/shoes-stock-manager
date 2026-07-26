import React, { useState } from 'react';
import { Alert, Pressable, Share, Switch, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Screen, ScreenTitle } from '@/components/Screen';
import { Button, Card, Divider, SectionHeader, Txt } from '@/components/ui';
import { Stepper } from '@/components/Stepper';
import { useTheme } from '@/theme/useTheme';
import { radius, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { AppData, useStore } from '@/store/useStore';
import { Unit } from '@/types';
import { clock } from '@/utils/date';
import { fromKg, toKg, weightStep } from '@/utils/units';
import { haptic } from '@/utils/feedback';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);

  const reseedSample = useStore((s) => s.reseedSample);
  const clearAllData = useStore((s) => s.clearAllData);

  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState('');

  const confirmReseed = () =>
    Alert.alert('Restore sample data?', 'This replaces your current splits, history and body-weight with the demo data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: () => {
          reseedSample();
          haptic.success();
        },
      },
    ]);

  const confirmClear = () =>
    Alert.alert('Clear all data?', 'Every split, workout and body-weight entry will be permanently deleted. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: () => {
          clearAllData();
          haptic.warning();
        },
      },
    ]);

  const doExport = async () => {
    try {
      const data = exportData();
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'Gym Tracker backup',
      });
    } catch {
      // user cancelled
    }
  };

  const doImport = () => {
    try {
      const parsed = JSON.parse(importText) as Partial<AppData>;
      if (typeof parsed !== 'object' || parsed === null) throw new Error();
      Alert.alert('Import data?', 'This replaces your splits, history, body-weight and settings.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: () => {
            importData(parsed);
            setImporting(false);
            setImportText('');
            haptic.success();
            Alert.alert('Imported', 'Your data has been restored.');
          },
        },
      ]);
    } catch {
      Alert.alert('Invalid data', 'That text is not a valid backup.');
    }
  };

  return (
    <Screen scroll>
      <ScreenTitle title="Settings" />

      <SectionHeader title="Units & display" />
      <Card padded={false}>
        <SegmentRow<Unit>
          label="Weight unit"
          value={settings.unit}
          options={[
            { label: 'kg', value: 'kg' },
            { label: 'lb', value: 'lb' },
          ]}
          onChange={(v) => updateSettings({ unit: v })}
        />
        <Divider />
        <ToggleRow
          label="Dark mode"
          value={settings.theme === 'dark'}
          onChange={(on) => updateSettings({ theme: on ? 'dark' : 'light' })}
        />
      </Card>

      <SectionHeader title="Workout" />
      <Card padded={false}>
        <Row>
          <View>
            <Txt weight="700">Rest timer default</Txt>
            <Txt dim size={13}>
              {clock(settings.restDefaultSec)} min
            </Txt>
          </View>
          <Stepper
            value={settings.restDefaultSec}
            step={15}
            min={15}
            max={600}
            width={56}
            suffix="s"
            onChange={(v) => updateSettings({ restDefaultSec: v })}
          />
        </Row>
        <Divider />
        <ToggleRow label="Sound on timer finish" value={settings.soundEnabled} onChange={(v) => updateSettings({ soundEnabled: v })} />
        <Divider />
        <ToggleRow label="Haptics" value={settings.hapticsEnabled} onChange={(v) => updateSettings({ hapticsEnabled: v })} />
        <Divider />
        <Row>
          <View>
            <Txt weight="700">Barbell weight</Txt>
            <Txt dim size={13}>
              Used by the plate calculator
            </Txt>
          </View>
          <Stepper
            value={Number(fromKg(settings.barWeightKg, settings.unit).toFixed(1))}
            step={weightStep(settings.unit)}
            min={0}
            width={56}
            suffix={settings.unit}
            onChange={(v) => updateSettings({ barWeightKg: toKg(v, settings.unit) })}
          />
        </Row>
      </Card>

      <SectionHeader title="Tools" />
      <Card padded={false}>
        <LinkRow icon="calculator-outline" label="Plate calculator" onPress={() => nav.navigate('PlateCalculator')} />
      </Card>

      <SectionHeader title="Data" />
      <Card padded={false}>
        <LinkRow icon="share-outline" label="Export all data (JSON)" onPress={doExport} />
        <Divider />
        <LinkRow icon="download-outline" label="Import data" onPress={() => setImporting((v) => !v)} />
      </Card>

      {importing && (
        <Card style={{ marginTop: spacing.md }}>
          <Txt dim size={12} weight="700" style={{ marginBottom: 6 }}>
            PASTE BACKUP JSON
          </Txt>
          <TextInput
            value={importText}
            onChangeText={setImportText}
            multiline
            placeholder='{"settings":...}'
            placeholderTextColor={t.faint}
            style={{
              minHeight: 120,
              backgroundColor: t.surfaceAlt,
              borderRadius: radius.md,
              color: t.text,
              padding: spacing.md,
              fontSize: 13,
              textAlignVertical: 'top',
            }}
          />
          <Button title="Import & replace" variant="danger" style={{ marginTop: spacing.md }} onPress={doImport} disabled={!importText.trim()} />
        </Card>
      )}

      <SectionHeader title="Manage" />
      <Card padded={false}>
        <LinkRow icon="refresh-outline" label="Restore sample data" onPress={confirmReseed} />
        <Divider />
        <Pressable onPress={confirmClear} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Ionicons name="trash-outline" size={20} color={t.danger} />
              <Txt weight="700" color={t.danger}>
                Clear all data
              </Txt>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.dim} />
          </View>
        </Pressable>
      </Card>

      <Txt faint size={12} center style={{ marginTop: spacing.xl }}>
        Gym Performance Tracker · offline · v1.0
      </Txt>
      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}

// --- rows ------------------------------------------------------------------

function Row({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg }}>
      {children}
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <Row>
      <Txt weight="700">{label}</Txt>
      <Switch
        value={value}
        onValueChange={(v) => {
          haptic.light();
          onChange(v);
        }}
        trackColor={{ true: t.primary, false: t.track }}
        thumbColor="#fff"
      />
    </Row>
  );
}

function SegmentRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <Row>
      <Txt weight="700">{label}</Txt>
      <View style={{ flexDirection: 'row', backgroundColor: t.surfaceAlt, borderRadius: radius.md, padding: 3 }}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => {
                haptic.light();
                onChange(o.value);
              }}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: 8,
                borderRadius: radius.sm,
                backgroundColor: active ? t.primary : 'transparent',
              }}
            >
              <Txt weight="800" color={active ? t.onPrimary : t.dim}>
                {o.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </Row>
  );
}

function LinkRow({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <Row>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Ionicons name={icon} size={20} color={t.primary} />
          <Txt weight="700">{label}</Txt>
        </View>
        <Ionicons name="chevron-forward" size={18} color={t.dim} />
      </Row>
    </Pressable>
  );
}
