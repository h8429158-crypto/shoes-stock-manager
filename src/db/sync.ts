import NetInfo from '@react-native-community/netinfo';
import type { RealtimeChannel } from '@supabase/supabase-js';

import {
  cacheReplaceAll,
  initDb,
  outboxAdd,
  outboxCount,
  outboxList,
  outboxMarkFailed,
  outboxRemove,
  type CachedTable,
  type OutboxOp,
} from '@/db/database';
import { notify, notifyLowStockOnce } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import type { Product, StockMovement } from '@/lib/types';
import { useDataStore, userName } from '@/store/data';
import { useSyncStore } from '@/store/sync';

/**
 * Sync engine.
 *
 * Writes: every mutation goes through `enqueue()` — it is applied
 * optimistically to the store + SQLite cache by the caller (see mutations.ts),
 * saved durably to the outbox, and flushed to Supabase as soon as we're
 * online. Replays are ordered and idempotent (client-generated UUIDs;
 * duplicate-key errors count as success).
 *
 * Reads: `refetchAll()` pulls the org's tables and replaces the local cache.
 * Realtime keeps the store fresh in between.
 */

const MOVEMENT_FETCH_LIMIT = 500;

let started = false;
let netUnsubscribe: (() => void) | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let flushing = false;

export function startSyncEngine(): void {
  if (started) return;
  started = true;
  initDb();
  useSyncStore.getState().setPendingCount(outboxCount());

  netUnsubscribe = NetInfo.addEventListener((state) => {
    const online = !!state.isConnected && state.isInternetReachable !== false;
    const wasOnline = useSyncStore.getState().online;
    useSyncStore.getState().setOnline(online);
    if (online && !wasOnline) {
      // Back online: push queued work, then refresh.
      void flushOutbox().then(() => {
        const orgId = useDataStore.getState().hydratedOrgId;
        if (orgId) void refetchAll(orgId);
      });
    }
  });
}

export function stopSyncEngine(): void {
  netUnsubscribe?.();
  netUnsubscribe = null;
  started = false;
  void teardownRealtime();
}

function isNetworkError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err ?? '');
  return /network|fetch failed|failed to fetch|timeout|abort/i.test(msg);
}

function isDuplicateKey(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return e?.code === '23505' || /duplicate key/i.test(e?.message ?? '');
}

async function executeOp(op: OutboxOp): Promise<void> {
  if (op.kind === 'rpc') {
    const { error } = await supabase.rpc(op.fn, op.args);
    if (error) throw error;
    return;
  }
  if (op.kind === 'delete') {
    const { error } = await supabase.from(op.table).delete().eq('id', op.id);
    if (error) throw error;
    return;
  }
  if (op.kind === 'insert') {
    const { error } = await supabase.from(op.table).insert(op.payload);
    if (error && !isDuplicateKey(error)) throw error;
    return;
  }
  // upsert
  const { error } = await supabase.from(op.table).upsert(op.payload);
  if (error) throw error;
}

/** Push everything in the outbox, in order. Stops on network failure. */
export async function flushOutbox(): Promise<void> {
  if (flushing) return;
  const sync = useSyncStore.getState();
  if (!sync.online) return;

  flushing = true;
  sync.setSyncing(true);
  try {
    let rows = outboxList();
    while (rows.length > 0) {
      for (const row of rows) {
        try {
          await executeOp(row.op);
          outboxRemove(row.seq);
        } catch (err) {
          if (isNetworkError(err)) {
            // Still offline in practice — try again on the next trigger.
            useSyncStore.getState().setOnline(false);
            return;
          }
          // Permanent failure (validation/RLS). Retry a few times in case it
          // was ordering-related, then drop so it can't block the queue.
          outboxMarkFailed(row.seq, String((err as { message?: string })?.message ?? err));
          if (row.attempts + 1 >= 3) {
            console.warn('Dropping unsyncable op', row.op, err);
            outboxRemove(row.seq);
          } else {
            // Leave it; move on so one bad op doesn't wedge everything.
          }
        } finally {
          useSyncStore.getState().setPendingCount(outboxCount());
        }
      }
      const next = outboxList();
      // Guard against spinning on ops that keep failing non-fatally.
      if (next.length > 0 && next[0].seq === rows[0].seq && next.length === rows.length) break;
      rows = next;
    }
  } finally {
    flushing = false;
    useSyncStore.getState().setSyncing(false);
  }
}

/** Queue a mutation and try to sync immediately. */
export function enqueue(op: OutboxOp): void {
  outboxAdd(op);
  useSyncStore.getState().setPendingCount(outboxCount());
  void flushOutbox();
}

// ---------------------------------------------------------------------------
// Full refetch
// ---------------------------------------------------------------------------

export async function refetchAll(orgId: string): Promise<void> {
  const data = useDataStore.getState();
  const sync = useSyncStore.getState();
  sync.setSyncing(true);
  try {
    // Flush pending writes first so we don't overwrite them with stale reads.
    await flushOutbox();
    if (outboxCount() > 0 && !useSyncStore.getState().online) return;

    const simple: CachedTable[] = [
      'products',
      'categories',
      'suppliers',
      'purchase_orders',
      'purchase_order_items',
      'invoices',
      'invoice_items',
    ];
    for (const table of simple) {
      const { data: rows, error } = await supabase.from(table).select('*').eq('org_id', orgId);
      if (error) throw error;
      cacheReplaceAll(table, orgId, rows ?? []);
      data.setTable(table, rows ?? []);
    }

    const { data: movements, error: movErr } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(MOVEMENT_FETCH_LIMIT);
    if (movErr) throw movErr;
    cacheReplaceAll('stock_movements', orgId, movements ?? []);
    data.setTable('stock_movements', movements ?? []);

    const { data: members, error: memErr } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_id', orgId);
    if (memErr) throw memErr;
    cacheReplaceAll('org_members', orgId, members ?? []);
    data.setTable('org_members', members ?? []);

    const userIds = (members ?? []).map((m) => m.user_id);
    if (userIds.length > 0) {
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      if (profErr) throw profErr;
      cacheReplaceAll('profiles', null, profiles ?? []);
      data.setTable('profiles', profiles ?? []);
    }

    const { data: org, error: orgErr } = await supabase.from('orgs').select('*').eq('id', orgId).single();
    if (orgErr) throw orgErr;
    if (org) data.setOrg(org);

    useSyncStore.getState().setLastSyncAt(new Date().toISOString());
  } catch (err) {
    if (isNetworkError(err)) {
      useSyncStore.getState().setOnline(false);
    } else {
      console.warn('refetchAll failed', err);
    }
  } finally {
    useSyncStore.getState().setSyncing(false);
  }
}

// ---------------------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------------------

const LIVE_TABLES: CachedTable[] = [
  'products',
  'stock_movements',
  'purchase_orders',
  'purchase_order_items',
  'org_members',
  'orgs',
];

export async function setupRealtime(orgId: string, selfUserId: string): Promise<void> {
  await teardownRealtime();

  const channel = supabase.channel(`org-${orgId}`);
  for (const table of LIVE_TABLES) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: table === 'orgs' ? `id=eq.${orgId}` : `org_id=eq.${orgId}`,
      },
      (payload) => {
        const data = useDataStore.getState();
        if (payload.eventType === 'DELETE') {
          const old = payload.old as Record<string, unknown>;
          const id =
            table === 'org_members'
              ? `${old.org_id}:${old.user_id}`
              : String(old.id ?? '');
          if (id) data.removeRow(table, id);
          return;
        }
        const row = payload.new as Record<string, unknown>;
        data.applyRow(table, row);

        if (table === 'stock_movements' && payload.eventType === 'INSERT') {
          handleIncomingMovement(row as unknown as StockMovement, selfUserId);
        }
        if (
          table === 'purchase_orders' &&
          payload.eventType === 'UPDATE' &&
          (row as { status?: string }).status === 'received'
        ) {
          const receivedBy = (row as { received_by?: string }).received_by;
          if (receivedBy && receivedBy !== selfUserId) {
            void notify(
              'Purchase order received',
              `${userName(useDataStore.getState().profiles, receivedBy)} received PO ${(row as { po_number?: string }).po_number ?? ''}.`
            );
          }
        }
      }
    );
  }

  channel.subscribe();
  realtimeChannel = channel;
}

async function teardownRealtime(): Promise<void> {
  if (realtimeChannel) {
    await supabase.removeChannel(realtimeChannel).catch(() => {});
    realtimeChannel = null;
  }
}

function handleIncomingMovement(movement: StockMovement, selfUserId: string): void {
  // The products table change arrives separately; here we only alert.
  const product = useDataStore.getState().products.find((p) => p.id === movement.product_id);
  if (!product) return;
  const newQty = Math.max(0, product.quantity); // product row already updated via its own event (or will be)
  if (movement.quantity_change < 0 && newQty <= product.reorder_level) {
    void notifyLowStockOnce(product.id, product.name, newQty);
  }
  if (movement.user_id && movement.user_id !== selfUserId) {
    // Teammate activity shows up in the dashboard feed automatically.
  }
}

/** Check products for low stock after local writes and alert (once each). */
export function checkLowStock(product: Product): void {
  if (product.quantity <= product.reorder_level) {
    void notifyLowStockOnce(product.id, product.name, product.quantity);
  }
}
