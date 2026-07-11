import * as Crypto from 'expo-crypto';

/** Client-generated UUIDs so records can be created offline. */
export function newId(): string {
  return Crypto.randomUUID();
}

/** Auto-generate a SKU that doesn't collide with existing ones. */
export function nextSku(existing: { sku: string }[]): string {
  let max = 0;
  for (const { sku } of existing) {
    const m = /^SKU-(\d+)$/.exec(sku.trim());
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `SKU-${String(max + 1).padStart(3, '0')}`;
}

/** Local, human-readable doc numbers for offline-created POs/invoices. */
export function localDocNumber(prefix: string): string {
  const d = new Date();
  const stamp = [
    d.getFullYear().toString().slice(2),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('');
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${stamp}${rand}`;
}
