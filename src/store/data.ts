import { create } from 'zustand';

import {
  cacheDelete,
  cacheGetAll,
  cacheIdFor,
  cachePut,
  type CachedTable,
} from '@/db/database';
import type {
  Category,
  Invoice,
  InvoiceItem,
  Org,
  OrgMember,
  Product,
  Profile,
  PurchaseOrder,
  PurchaseOrderItem,
  StockMovement,
  Supplier,
} from '@/lib/types';

/**
 * All org-scoped data lives here. It is hydrated from the SQLite cache on
 * startup (instant, offline-friendly), refreshed from Supabase by the sync
 * engine, and patched live by Realtime events and optimistic local writes.
 */

interface DataState {
  hydratedOrgId: string | null;
  org: Org | null;
  members: OrgMember[];
  profiles: Record<string, Profile>;
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  movements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  poItems: PurchaseOrderItem[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];

  hydrateFromCache: (orgId: string) => void;
  setOrg: (org: Org) => void;
  setTable: (table: CachedTable, rows: unknown[]) => void;
  /** Apply one row change (from Realtime or an optimistic local write). */
  applyRow: (table: CachedTable, row: Record<string, unknown>, persist?: boolean) => void;
  removeRow: (table: CachedTable, id: string, persist?: boolean) => void;
  adjustProductQuantity: (productId: string, delta: number) => void;
  reset: () => void;
}

const SORTERS: Partial<Record<CachedTable, (a: any, b: any) => number>> = {
  products: (a: Product, b: Product) => a.name.localeCompare(b.name),
  categories: (a: Category, b: Category) => a.name.localeCompare(b.name),
  suppliers: (a: Supplier, b: Supplier) => a.name.localeCompare(b.name),
  stock_movements: (a: StockMovement, b: StockMovement) => b.created_at.localeCompare(a.created_at),
  purchase_orders: (a: PurchaseOrder, b: PurchaseOrder) => b.created_at.localeCompare(a.created_at),
  invoices: (a: Invoice, b: Invoice) => b.created_at.localeCompare(a.created_at),
};

const TABLE_TO_KEY: Record<CachedTable, keyof DataState | null> = {
  products: 'products',
  categories: 'categories',
  suppliers: 'suppliers',
  stock_movements: 'movements',
  purchase_orders: 'purchaseOrders',
  purchase_order_items: 'poItems',
  invoices: 'invoices',
  invoice_items: 'invoiceItems',
  org_members: 'members',
  profiles: null, // handled specially (record, not array)
  orgs: null, // handled specially
};

const emptyState = {
  hydratedOrgId: null,
  org: null,
  members: [] as OrgMember[],
  profiles: {} as Record<string, Profile>,
  products: [] as Product[],
  categories: [] as Category[],
  suppliers: [] as Supplier[],
  movements: [] as StockMovement[],
  purchaseOrders: [] as PurchaseOrder[],
  poItems: [] as PurchaseOrderItem[],
  invoices: [] as Invoice[],
  invoiceItems: [] as InvoiceItem[],
};

export const useDataStore = create<DataState>((set, get) => ({
  ...emptyState,

  hydrateFromCache: (orgId) => {
    const profiles: Record<string, Profile> = {};
    for (const p of cacheGetAll<Profile>('profiles')) profiles[p.id] = p;
    const orgs = cacheGetAll<Org>('orgs', orgId).filter((o) => o.id === orgId);
    set({
      hydratedOrgId: orgId,
      org: orgs[0] ?? null,
      profiles,
      members: cacheGetAll<OrgMember>('org_members', orgId),
      products: cacheGetAll<Product>('products', orgId).sort(SORTERS.products!),
      categories: cacheGetAll<Category>('categories', orgId).sort(SORTERS.categories!),
      suppliers: cacheGetAll<Supplier>('suppliers', orgId).sort(SORTERS.suppliers!),
      movements: cacheGetAll<StockMovement>('stock_movements', orgId).sort(SORTERS.stock_movements!),
      purchaseOrders: cacheGetAll<PurchaseOrder>('purchase_orders', orgId).sort(SORTERS.purchase_orders!),
      poItems: cacheGetAll<PurchaseOrderItem>('purchase_order_items', orgId),
      invoices: cacheGetAll<Invoice>('invoices', orgId).sort(SORTERS.invoices!),
      invoiceItems: cacheGetAll<InvoiceItem>('invoice_items', orgId),
    });
  },

  setOrg: (org) => {
    cachePut('orgs', [org as unknown as Record<string, unknown>]);
    set({ org });
  },

  setTable: (table, rows) => {
    if (table === 'profiles') {
      const profiles: Record<string, Profile> = { ...get().profiles };
      for (const p of rows as Profile[]) profiles[p.id] = p;
      set({ profiles });
      return;
    }
    if (table === 'orgs') {
      const org = (rows as Org[])[0];
      if (org) set({ org });
      return;
    }
    const key = TABLE_TO_KEY[table];
    if (!key) return;
    const sorted = SORTERS[table] ? [...(rows as any[])].sort(SORTERS[table]!) : (rows as any[]);
    set({ [key]: sorted } as Partial<DataState>);
  },

  applyRow: (table, row, persist = true) => {
    if (persist) cachePut(table, [row]);
    if (table === 'profiles') {
      const p = row as unknown as Profile;
      set({ profiles: { ...get().profiles, [p.id]: p } });
      return;
    }
    if (table === 'orgs') {
      const org = row as unknown as Org;
      if (get().org?.id === org.id || !get().org) set({ org });
      return;
    }
    const key = TABLE_TO_KEY[table];
    if (!key) return;
    const list = get()[key] as any[];
    const rowId = cacheIdFor(table, row);
    const next = list.filter((r) => cacheIdFor(table, r) !== rowId);
    next.push(row);
    if (SORTERS[table]) next.sort(SORTERS[table]!);
    set({ [key]: next } as Partial<DataState>);
  },

  removeRow: (table, id, persist = true) => {
    if (persist) cacheDelete(table, id);
    const key = TABLE_TO_KEY[table];
    if (!key) return;
    const list = get()[key] as any[];
    set({ [key]: list.filter((r) => cacheIdFor(table, r) !== id) } as Partial<DataState>);
  },

  adjustProductQuantity: (productId, delta) => {
    const products = get().products.map((p) =>
      p.id === productId ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p
    );
    const changed = products.find((p) => p.id === productId);
    if (changed) cachePut('products', [changed as unknown as Record<string, unknown>]);
    set({ products });
  },

  reset: () => set({ ...emptyState }),
}));

/** Convenience selectors */
export function userName(profiles: Record<string, Profile>, userId: string | null | undefined): string {
  if (!userId) return 'Someone';
  const name = profiles[userId]?.full_name?.trim();
  return name || 'Teammate';
}
