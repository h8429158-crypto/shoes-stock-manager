import React, { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card, IconButton, Pill, Txt } from '@/components/ui';
import { Stepper } from '@/components/Stepper';
import { useTheme } from '@/theme/useTheme';
import { radius, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { useStore } from '@/store/useStore';
import { calcPlates } from '@/utils/calc';
import { formatWeight, fromKg, toKg, weightStep } from '@/utils/units';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Colour code plates by kg for quick visual loading.
const plateColor = (kg: number): string => {
  if (kg >= 25) return '#EF4444';
  if (kg >= 20) return '#3B82F6';
  if (kg >= 15) return '#EAB308';
  if (kg >= 10) return '#22C55E';
  if (kg >= 5) return '#F8FAFC';
  return '#94A3B8';
};

export function PlateCalculatorScreen() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const unit = useStore((s) => s.settings.unit);
  const barKg = useStore((s) => s.settings.barWeightKg);
  const updateSettings = useStore((s) => s.updateSettings);

  const [target, setTarget] = useState<number>(() => Number(fromKg(60, unit).toFixed(1)));

  const targetKg = toKg(target, unit);
  const result = useMemo(() => calcPlates(targetKg, barKg), [targetKg, barKg]);

  return (
    <Screen scroll edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: spacing.sm, gap: spacing.sm }}>
        <IconButton name="chevron-back" onPress={() => nav.goBack()} />
        <Txt size={22} weight="900">
          Plate Calculator
        </Txt>
      </View>

      <Card style={{ marginTop: spacing.md, alignItems: 'center' }}>
        <Txt dim size={12} weight="800">
          TARGET WEIGHT ({unit})
        </Txt>
        <TextInput
          value={String(target)}
          onChangeText={(txt) => {
            const v = parseFloat(txt.replace(',', '.'));
            setTarget(isFinite(v) ? v : 0);
          }}
          keyboardType="decimal-pad"
          selectTextOnFocus
          style={{ fontSize: 52, fontWeight: '900', color: t.text, textAlign: 'center', paddingVertical: 4, minWidth: 160 }}
        />
        <Stepper value={target} step={weightStep(unit)} min={0} width={80} onChange={setTarget} />
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt weight="700">Barbell weight</Txt>
          <Stepper
            value={Number(fromKg(barKg, unit).toFixed(1))}
            step={weightStep(unit)}
            min={0}
            width={56}
            suffix={unit}
            onChange={(v) => updateSettings({ barWeightKg: toKg(v, unit) })}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <Pill label={unit === 'kg' ? '20 kg bar' : '45 lb bar'} onPress={() => updateSettings({ barWeightKg: unit === 'kg' ? 20 : toKg(45, 'lb') })} />
          <Pill label={unit === 'kg' ? '15 kg bar' : '35 lb bar'} onPress={() => updateSettings({ barWeightKg: unit === 'kg' ? 15 : toKg(35, 'lb') })} />
          <Pill label="EZ 10 kg" onPress={() => updateSettings({ barWeightKg: 10 })} />
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Txt dim size={12} weight="800" style={{ marginBottom: spacing.md }}>
          PER SIDE
        </Txt>
        {result.perSide.length === 0 ? (
          <Txt dim center style={{ paddingVertical: spacing.lg }}>
            {targetKg <= barKg ? 'Target is at or below the bar weight.' : 'No plates needed.'}
          </Txt>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', alignItems: 'flex-end', minHeight: 90 }}>
            {result.perSide.map((p, i) => {
              const c = plateColor(p);
              const h = 50 + Math.min(40, p * 1.6);
              return (
                <View key={i} style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 34,
                      height: h,
                      borderRadius: 6,
                      backgroundColor: c,
                      borderWidth: 1,
                      borderColor: t.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Txt size={12} weight="900" color={p >= 5 && p < 10 ? '#0B0F14' : '#0B0F14'}>
                      {fromKg(p, unit) % 1 === 0 ? Math.round(fromKg(p, unit)) : fromKg(p, unit).toFixed(1)}
                    </Txt>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {result.leftoverKg > 0.01 && (
          <Txt size={13} color={t.warning} center style={{ marginTop: spacing.md }}>
            ~{formatWeight(result.leftoverKg, unit)} can't be matched with standard plates.
          </Txt>
        )}

        <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
          <Txt dim size={13}>
            Bar {formatWeight(barKg, unit)} + {result.perSide.length} plate{result.perSide.length === 1 ? '' : 's'}/side
          </Txt>
          <Txt size={20} weight="900" style={{ marginTop: 2 }}>
            = {formatWeight(barKg + result.perSide.reduce((a, b) => a + b, 0) * 2, unit)}
          </Txt>
        </View>
      </Card>
      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}
