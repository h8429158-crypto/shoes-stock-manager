// Row types mirroring supabase/schema.sql. Money fields are integer cents.

export type Role = 'owner' | 'manager' | 'staff';

export type MovementType = 'in' | 'out' | 'adjust';

export type MovementReason =
  | 'purchase'
  | 'sale'
  | 'damage'
  | 'return'
  | 'adjustment'
  | 'stocktake'
  | 'po_received'
  | 'initial';

export type PoStatus = 'draft' | 'sent' | 'received' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string;
}

export interface Org {
  id: string;
  name: string;
  logo_url: string | null;
  currency: string;
  tax_rate: number; // percent
  invite_code: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  org_id: string;
  user_id: string;
  role: Role;
  created_at: string;
  /** joined from profiles */
  full_name?: string;
}

export interface Category {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  org_id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  lead_time_days: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  org_id: string;
  name: string;
  sku: string;
  barcode: string | null;
  category_id: string | null;
  supplier_id: string | null;
  cost_price: number;
  selling_price: number;
  quantity: number;
  reorder_level: number;
  unit: string;
  notes: string;
  image_url: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  org_id: string;
  product_id: string;
  user_id: string | null;
  type: MovementType;
  quantity_change: number; // signed
  reason: MovementReason;
  note: string;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  org_id: string;
  po_number: string;
  supplier_id: string | null;
  status: PoStatus;
  expected_date: string | null;
  notes: string;
  created_by: string | null;
  received_by: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  org_id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  org_id: string;
  invoice_number: string;
  customer_name: string;
  tax_rate: number;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  org_id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export function stockStatus(p: Pick<Product, 'quantity' | 'reorder_level'>): StockStatus {
  if (p.quantity <= 0) return 'out_of_stock';
  if (p.quantity <= p.reorder_level) return 'low_stock';
  return 'in_stock';
}

/** Suggested reorder quantity: bring stock back up to twice the reorder level. */
export function suggestedReorderQty(p: Pick<Product, 'quantity' | 'reorder_level'>): number {
  return Math.max(1, p.reorder_level * 2 - p.quantity);
}

/** Permissions helpers used to role-gate UI and actions. */
export const can = {
  manageProducts: (role: Role | null) => role === 'owner' || role === 'manager',
  manageOrders: (role: Role | null) => role === 'owner' || role === 'manager',
  manageCatalog: (role: Role | null) => role === 'owner' || role === 'manager',
  manageTeam: (role: Role | null) => role === 'owner',
  manageOrg: (role: Role | null) => role === 'owner',
  moveStock: (role: Role | null) => role !== null,
};
