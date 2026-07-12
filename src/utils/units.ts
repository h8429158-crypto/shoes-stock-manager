import { Unit } from '@/types';

const KG_PER_LB = 0.45359237;

export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const lbToKg = (lb: number) => lb * KG_PER_LB;

/** Convert a canonical kg value into the display unit. */
export function fromKg(kg: number, unit: Unit): number {
  return unit === 'kg' ? kg : kgToLb(kg);
}

/** Convert a value entered in the display unit back into canonical kg. */
export function toKg(value: number, unit: Unit): number {
  return unit === 'kg' ? value : lbToKg(value);
}

/** The stepper increment in the *display* unit (2.5 kg / 5 lb). */
export function weightStep(unit: Unit): number {
  return unit === 'kg' ? 2.5 : 5;
}

/** Round to a tidy number for display: 1 decimal, trailing zeros trimmed. */
export function tidy(n: number, decimals = 1): string {
  if (!isFinite(n)) return '0';
  const rounded = Number(n.toFixed(decimals));
  return String(rounded);
}

/** Format a canonical kg weight in the active unit, e.g. "60 kg". */
export function formatWeight(kg: number, unit: Unit, withUnit = true): string {
  const v = tidy(fromKg(kg, unit));
  return withUnit ? `${v} ${unit}` : v;
}

/** Format a volume (kg) as a compact string in the active unit. */
export function formatVolume(kg: number, unit: Unit): string {
  const v = fromKg(kg, unit);
  if (v >= 1000) return `${tidy(v / 1000, 1)}k ${unit}`;
  return `${Math.round(v)} ${unit}`;
}
