// All money is stored as integer minor units (cents).

const SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  NGN: '₦',
  KES: 'KSh',
  ZAR: 'R',
  AED: 'د.إ',
  SAR: '﷼',
};

export function currencySymbol(currency: string): string {
  return SYMBOLS[currency] ?? currency + ' ';
}

/** 12345 → "$123.45" */
export function formatMoney(cents: number, currency = 'USD'): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.round(cents));
  const major = Math.floor(abs / 100);
  const minor = String(abs % 100).padStart(2, '0');
  const grouped = major.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${currencySymbol(currency)}${grouped}.${minor}`;
}

/** "123.45" → 12345, tolerant of symbols/commas. Returns NaN when unparsable. */
export function parseMoney(text: string): number {
  const cleaned = text.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  if (!cleaned) return NaN;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return NaN;
  return Math.round(value * 100);
}

/** 12345 → "123.45" for prefilling inputs. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
