import { checkLowStock, enqueue } from '@/db/sync';
import { newId } from '@/lib/ids';
import { friendlyError, supabase } from '@/lib/supabase';
import type {
  Category,
  Invoice,
  InvoiceItem,
  MovementReason,
  MovementType,
  Org,
  Product,
  PurchaseOrder,
  PurchaseOrderItem,
  StockMovement,
  Supplier,
} from '@/lib/types';
import { useDataStore } from '@/store/data';
import { useSyncStore } from '@/store/sync';

/**
 * Domain-level write API. Every function:
 *   1. applies the change optimistically to the Zustand store + SQLite cache
 *   2. enqueues the server mutation in the outbox (flushed immediately when
 *      online, replayed later when offline)
 *
 * Product.quantity is never written directly to the server — it is derived
 * from immutable stock_movements by a DB trigger. Locally we mirror that by
 * adjusting quantity alongside each recorded movement.
 */

const now = () => new Date().toISOString();

// Strip fields the server owns (quantity via trigger) before enqueueing.
function productPayload(p: Product): Record<string, unknown> {
  const { quantity: _quantity, ...rest } = p;
  return rest as unknown as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface NewProductInput {
  name: string;
  sku: string;
  barcode: string | null;
  category_id: string | null;
  supplier_id: string | null;
  cost_price: number;
  selling_price: number;
  reorder_level: number;
  unit: string;
  notes: string;
  image_url: string | null;
  initialQuantity: number;
}

export function createProduct(orgId: string, userId: string, input: NewProductInput): Product {
  const { initialQuantity, ...fields } = input;
  const product: Product = {
    id: newId(),
    org_id: orgId,
    ...fields,
    quantity: 0,
    archived: false,
    created_at: now(),
    updated_at: now(),
  };
  useDataStore.getState().applyRow('products', product as unknown as Record<string, unknown>);
  enqueue({ kind: 'upsert', table: 'products', payload: productPayload(product) });

  if (initialQuantity > 0) {
    recordMovement({
      orgId,
      userId,
      product,
      type: 'in',
      quantity: initialQuantity,
      reason: 'initial',
      note: 'Initial stock',
    });
  }
  return product;
}

export function updateProduct(product: Product, changes: Partial<Product>): Product {
  const updated: Product = { ...product, ...changes, updated_at: now() };
  useDataStore.getState().applyRow('products', updated as unknown as Record<string, unknown>);
  enqueue({ kind: 'upsert', table: 'products', payload: productPayload(updated) });
  return updated;
}

export function deleteProduct(productId: string): void {
  useDataStore.getState().removeRow('products', productId);
  enqueue({ kind: 'delete', table: 'products', id: productId });
}

// ---------------------------------------------------------------------------
// Stock movements
// ---------------------------------------------------------------------------

export interface MovementInput {
  orgId: string;
  userId: string;
  product: Product;
  type: MovementType;
  /** positive count; sign is derived from type ('adjust' passes signed delta) */
  quantity: number;
  reason: MovementReason;
  note?: string;
}

export function recordMovement(input: MovementInput): StockMovement {
  const delta =
    input.type === 'in' ? Math.abs(input.quantity)
    : input.type === 'out' ? -Math.abs(input.quantity)
    : input.quantity;

  if (delta === 0) throw new Error('Quantity cannot be zero');

  const movement: StockMovement = {
    id: newId(),
    org_id: input.orgId,
    product_id: input.product.id,
    user_id: input.userId,
    type: input.type,
    quantity_change: delta,
    reason: input.reason,
    note: input.note ?? '',
    created_at: now(),
  };

  const data = useDataStore.getState();
  data.applyRow('stock_movements', movement as unknown as Record<string, unknown>);
  data.adjustProductQuantity(input.product.id, delta);

  enqueue({ kind: 'insert', table: 'stock_movements', payload: movement as unknown as Record<string, unknown> });

  const after = useDataStore.getState().products.find((p) => p.id === input.product.id);
  if (after && delta < 0) checkLowStock(after);
  return movement;
}

/** Stocktake: apply a batch of counted corrections as adjustment movements. */
export function applyStocktake(
  orgId: string,
  userId: string,
  corrections: { product: Product; countedQuantity: number }[]
): number {
  let applied = 0;
  for (const { product, countedQuantity } of corrections) {
    const delta = countedQuantity - product.quantity;
    if (delta === 0) continue;
    recordMovement({
      orgId,
      userId,
      product,
      type: 'adjust',
      quantity: delta,
      reason: 'stocktake',
      note: `Stocktake: counted ${countedQuantity}, was ${product.quantity}`,
    });
    applied++;
  }
  return applied;
}

// ---------------------------------------------------------------------------
// Categories & suppliers
// ---------------------------------------------------------------------------

export function saveCategory(orgId: string, name: string, existing?: Category): Category {
  const category: Category = existing
    ? { ...existing, name, updated_at: now() }
    : { id: newId(), org_id: orgId, name, created_at: now(), updated_at: now() };
  useDataStore.getState().applyRow('categories', category as unknown as Record<string, unknown>);
  enqueue({ kind: 'upsert', table: 'categories', payload: category as unknown as Record<string, unknown> });
  return category;
}

export function deleteCategory(categoryId: string): void {
  useDataStore.getState().removeRow('categories', categoryId);
  enqueue({ kind: 'delete', table: 'categories', id: categoryId });
}

export interface SupplierInput {
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  lead_time_days: number;
  notes: string;
}

export function saveSupplier(orgId: string, input: SupplierInput, existing?: Supplier): Supplier {
  const supplier: Supplier = existing
    ? { ...existing, ...input, updated_at: now() }
    : { id: newId(), org_id: orgId, ...input, created_at: now(), updated_at: now() };
  useDataStore.getState().applyRow('suppliers', supplier as unknown as Record<string, unknown>);
  enqueue({ kind: 'upsert', table: 'suppliers', payload: supplier as unknown as Record<string, unknown> });
  return supplier;
}

export function deleteSupplier(supplierId: string): void {
  useDataStore.getState().removeRow('suppliers', supplierId);
  enqueue({ kind: 'delete', table: 'suppliers', id: supplierId });
}

// ---------------------------------------------------------------------------
// Purchase orders
// ---------------------------------------------------------------------------

export interface PoItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export function createPurchaseOrder(
  orgId: string,
  userId: string,
  poNumber: string,
  input: { supplierId: string; expectedDate: string | null; notes: string; items: PoItemInput[] },
  status: 'draft' | 'sent' = 'draft'
): PurchaseOrder {
  const po: PurchaseOrder = {
    id: newId(),
    org_id: orgId,
    po_number: poNumber,
    supplier_id: input.supplierId,
    status,
    expected_date: input.expectedDate,
    notes: input.notes,
    created_by: userId,
    received_by: null,
    received_at: null,
    created_at: now(),
    updated_at: now(),
  };
  const data = useDataStore.getState();
  data.applyRow('purchase_orders', po as unknown as Record<string, unknown>);
  enqueue({ kind: 'upsert', table: 'purchase_orders', payload: po as unknown as Record<string, unknown> });

  for (const item of input.items) {
    const row: PurchaseOrderItem = {
      id: newId(),
      org_id: orgId,
      purchase_order_id: po.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_cost: item.unitCost,
      created_at: now(),
    };
    data.applyRow('purchase_order_items', row as unknown as Record<string, unknown>);
    enqueue({ kind: 'insert', table: 'purchase_order_items', payload: row as unknown as Record<string, unknown> });
  }
  return po;
}

export function updatePoStatus(po: PurchaseOrder, status: 'draft' | 'sent' | 'cancelled'): void {
  const updated = { ...po, status, updated_at: now() };
  useDataStore.getState().applyRow('purchase_orders', updated as unknown as Record<string, unknown>);
  enqueue({ kind: 'upsert', table: 'purchase_orders', payload: updated as unknown as Record<string, unknown> });
}

/**
 * Receive a PO: optimistically stock in all lines locally, then run the
 * server-side RPC (which inserts the authoritative movements atomically).
 * The next refetch reconciles the optimistic local movement rows.
 */
export function receivePurchaseOrder(po: PurchaseOrder, userId: string): void {
  const data = useDataStore.getState();
  const items = data.poItems.filter((i) => i.purchase_order_id === po.id);

  const updated: PurchaseOrder = {
    ...po,
    status: 'received',
    received_by: userId,
    received_at: now(),
    updated_at: now(),
  };
  data.applyRow('purchase_orders', updated as unknown as Record<string, unknown>);

  for (const item of items) {
    const product = data.products.find((p) => p.id === item.product_id);
    if (!product) continue;
    // Local-only optimistic movement; the server RPC creates the real ones.
    const movement: StockMovement = {
      id: newId(),
      org_id: po.org_id,
      product_id: item.product_id,
      user_id: userId,
      type: 'in',
      quantity_change: item.quantity,
      reason: 'po_received',
      note: `Received PO ${po.po_number}`,
      created_at: now(),
    };
    data.applyRow('stock_movements', movement as unknown as Record<string, unknown>);
    data.adjustProductQuantity(item.product_id, item.quantity);
  }

  enqueue({ kind: 'rpc', fn: 'receive_purchase_order', args: { p_po: po.id } });
}

export function deletePurchaseOrder(po: PurchaseOrder): void {
  const data = useDataStore.getState();
  for (const item of data.poItems.filter((i) => i.purchase_order_id === po.id)) {
    data.removeRow('purchase_order_items', item.id);
  }
  data.removeRow('purchase_orders', po.id);
  enqueue({ kind: 'delete', table: 'purchase_orders', id: po.id });
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export interface InvoiceItemInput {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export function createInvoice(
  orgId: string,
  userId: string,
  invoiceNumber: string,
  input: { customerName: string; taxRate: number; notes: string; items: InvoiceItemInput[] }
): Invoice {
  const invoice: Invoice = {
    id: newId(),
    org_id: orgId,
    invoice_number: invoiceNumber,
    customer_name: input.customerName,
    tax_rate: input.taxRate,
    notes: input.notes,
    created_by: userId,
    created_at: now(),
    updated_at: now(),
  };
  const data = useDataStore.getState();
  data.applyRow('invoices', invoice as unknown as Record<string, unknown>);
  enqueue({ kind: 'upsert', table: 'invoices', payload: invoice as unknown as Record<string, unknown> });

  for (const item of input.items) {
    const row: InvoiceItem = {
      id: newId(),
      org_id: orgId,
      invoice_id: invoice.id,
      product_id: item.productId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      created_at: now(),
    };
    data.applyRow('invoice_items', row as unknown as Record<string, unknown>);
    enqueue({ kind: 'insert', table: 'invoice_items', payload: row as unknown as Record<string, unknown> });

    // Auto stock-out each sold item.
    const product = data.products.find((p) => p.id === item.productId);
    if (product) {
      recordMovement({
        orgId,
        userId,
        product,
        type: 'out',
        quantity: item.quantity,
        reason: 'sale',
        note: `Invoice ${invoiceNumber}`,
      });
    }
  }
  return invoice;
}

// ---------------------------------------------------------------------------
// Org & team (online-only: these are rare, permission-sensitive operations)
// ---------------------------------------------------------------------------

function requireOnline(): void {
  if (!useSyncStore.getState().online) {
    throw new Error('This action needs an internet connection.');
  }
}

export async function changeMemberRole(orgId: string, userId: string, role: 'owner' | 'manager' | 'staff'): Promise<void> {
  requireOnline();
  const { error } = await supabase
    .from('org_members')
    .update({ role })
    .eq('org_id', orgId)
    .eq('user_id', userId);
  if (error) throw new Error(friendlyError(error));
  const data = useDataStore.getState();
  const member = data.members.find((m) => m.user_id === userId);
  if (member) data.applyRow('org_members', { ...member, role } as unknown as Record<string, unknown>);
}

export async function removeMember(orgId: string, userId: string): Promise<void> {
  requireOnline();
  const { error } = await supabase.from('org_members').delete().eq('org_id', orgId).eq('user_id', userId);
  if (error) throw new Error(friendlyError(error));
  useDataStore.getState().removeRow('org_members', `${orgId}:${userId}`);
}

export async function regenerateInviteCode(orgId: string): Promise<string> {
  requireOnline();
  const { data, error } = await supabase.rpc('regenerate_invite_code', { p_org: orgId });
  if (error) throw new Error(friendlyError(error));
  const org = useDataStore.getState().org;
  if (org) useDataStore.getState().setOrg({ ...org, invite_code: data as string });
  return data as string;
}

export async function updateOrgSettings(
  org: Org,
  changes: Partial<Pick<Org, 'name' | 'currency' | 'tax_rate' | 'logo_url'>>
): Promise<void> {
  requireOnline();
  const { error } = await supabase.from('orgs').update(changes).eq('id', org.id);
  if (error) throw new Error(friendlyError(error));
  useDataStore.getState().setOrg({ ...org, ...changes, updated_at: now() });
}

// ---------------------------------------------------------------------------
// Image upload (online-only; product saves still work offline without photo)
// ---------------------------------------------------------------------------

export async function uploadImage(orgId: string, localUri: string): Promise<string> {
  requireOnline();
  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${orgId}/${newId()}.${ext}`;
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  const { error } = await supabase.storage.from('product-images').upload(path, arrayBuffer, {
    contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
    upsert: false,
  });
  if (error) throw new Error(friendlyError(error));
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}
