export const COLORS = {
  primary: '#1f4e8c',
  primaryDark: '#163a69',
  accent: '#e8862d',
  background: '#f4f6fa',
  card: '#ffffff',
  text: '#1c2733',
  textLight: '#6b7a8c',
  border: '#dde4ee',
  danger: '#c0392b',
  success: '#1e8e5a',
  warning: '#f5e6cf',
};

// Change this symbol if you use a different currency (e.g. '$', 'Rs', 'AED').
export const CURRENCY = '₹';

export function formatMoney(value) {
  const n = Number(value) || 0;
  return `${CURRENCY}${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function toNumber(value) {
  const n = parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// A shoe article is "low stock" when this many cartons or fewer remain.
export const LOW_STOCK_CARTONS = 2;
