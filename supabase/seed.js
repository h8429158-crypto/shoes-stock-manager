#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * StockRoom demo seed script.
 *
 * Creates:
 *   - 3 users: owner@demo.stockroom.app / manager@... / staff@... (password: Demo1234!)
 *   - 1 org  : "Demo Shoes Co." with all three users as members
 *   - 6 categories, 3 suppliers, 30 shoe products
 *   - realistic stock movements (initial stock-in, sales, damage, returns)
 *   - 1 purchase order in "sent" status
 *
 * Usage:
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service role key> \
 *   node supabase/seed.js
 *
 * Requires supabase/schema.sql to have been applied first. Safe to re-run:
 * it reuses existing demo users and skips seeding if the org already exists.
 */

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing env vars. Run with:\n' +
      '  SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> node supabase/seed.js'
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const PASSWORD = 'Demo1234!';
const USERS = [
  { email: 'owner@demo.stockroom.app', full_name: 'Olivia Owner', role: 'owner' },
  { email: 'manager@demo.stockroom.app', full_name: 'Marcus Manager', role: 'manager' },
  { email: 'staff@demo.stockroom.app', full_name: 'Sara Staff', role: 'staff' },
];

const CATEGORIES = ['Sneakers', 'Running', 'Boots', 'Sandals', 'Formal', 'Kids'];

const SUPPLIERS = [
  { name: 'Atlas Footwear Ltd.', contact_name: 'Jin Park', email: 'orders@atlasfootwear.example', phone: '+1 555 0101', lead_time_days: 10 },
  { name: 'Meridian Shoes Co.', contact_name: 'Ana Silva', email: 'sales@meridianshoes.example', phone: '+1 555 0102', lead_time_days: 14 },
  { name: 'UrbanSole Wholesale', contact_name: 'Tom Becker', email: 'hello@urbansole.example', phone: '+1 555 0103', lead_time_days: 5 },
];

// [name, category, supplierIdx, costCents, priceCents, reorderLevel, initialQty]
const PRODUCTS = [
  ['Court Classic Low White', 'Sneakers', 0, 3200, 6999, 10, 42],
  ['Court Classic Low Black', 'Sneakers', 0, 3200, 6999, 10, 35],
  ['Street Canvas Hi Navy', 'Sneakers', 2, 2100, 4999, 12, 58],
  ['Street Canvas Hi Red', 'Sneakers', 2, 2100, 4999, 12, 8],
  ['Retro Runner 88 Grey', 'Sneakers', 1, 3800, 8499, 8, 22],
  ['Retro Runner 88 Blue', 'Sneakers', 1, 3800, 8499, 8, 3],
  ['AeroGlide 3 Black', 'Running', 1, 5200, 11999, 6, 18],
  ['AeroGlide 3 Volt', 'Running', 1, 5200, 11999, 6, 0],
  ['Marathon Pro Carbon', 'Running', 1, 9800, 19999, 4, 7],
  ['TrailBlazer GTX', 'Running', 0, 6400, 13999, 5, 12],
  ['Featherlite Racer Pink', 'Running', 1, 4400, 9499, 6, 15],
  ['Chelsea Boot Brown', 'Boots', 0, 5900, 12999, 5, 14],
  ['Chelsea Boot Black', 'Boots', 0, 5900, 12999, 5, 9],
  ['Work Boot Steel Toe', 'Boots', 2, 7200, 14999, 6, 20],
  ['Hiker Ridge Waterproof', 'Boots', 0, 6800, 14499, 5, 4],
  ['Desert Boot Sand', 'Boots', 1, 4800, 9999, 4, 11],
  ['Slide Comfort Black', 'Sandals', 2, 900, 2499, 15, 64],
  ['Slide Comfort White', 'Sandals', 2, 900, 2499, 15, 47],
  ['Strap Sandal Tan', 'Sandals', 2, 1600, 3999, 10, 25],
  ['Flip Basic Blue', 'Sandals', 2, 500, 1499, 20, 0],
  ['Oxford Cap Toe Black', 'Formal', 1, 6900, 15999, 4, 10],
  ['Oxford Cap Toe Brown', 'Formal', 1, 6900, 15999, 4, 6],
  ['Derby Classic Black', 'Formal', 1, 6200, 13999, 4, 12],
  ['Loafer Penny Burgundy', 'Formal', 1, 5800, 12499, 4, 2],
  ['Monk Strap Double', 'Formal', 1, 7400, 16999, 3, 5],
  ['Kids Velcro Play White', 'Kids', 0, 1500, 3499, 12, 38],
  ['Kids Velcro Play Pink', 'Kids', 0, 1500, 3499, 12, 30],
  ['Kids Light-Up Runner', 'Kids', 0, 2200, 4999, 10, 16],
  ['Kids Rain Boot Yellow', 'Kids', 2, 1300, 2999, 8, 6],
  ['Kids School Shoe Black', 'Kids', 0, 1900, 4299, 10, 24],
];

const skuFor = (i) => `SKU-${String(i + 1).padStart(3, '0')}`;
const barcodeFor = (i) => `978020${String(1370000 + i * 7)}`;

async function ensureUser({ email, full_name }) {
  const { data: created, error } = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (!error) return created.user;

  // Already exists → look it up.
  const { data: list, error: listErr } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email === email);
  if (!existing) throw error;
  return existing;
}

async function main() {
  console.log('Seeding StockRoom demo data →', url);

  // 1. Users
  const users = {};
  for (const spec of USERS) {
    const user = await ensureUser(spec);
    users[spec.role] = user;
    await db.from('profiles').upsert({ id: user.id, full_name: spec.full_name });
    console.log(`  user ${spec.email} (${spec.role})`);
  }

  // 2. Org (skip everything else if it already exists)
  const { data: existingOrg } = await db.from('orgs').select('id').eq('name', 'Demo Shoes Co.').maybeSingle();
  if (existingOrg) {
    console.log('Org "Demo Shoes Co." already exists — nothing to do.');
    return;
  }

  const { data: org, error: orgErr } = await db
    .from('orgs')
    .insert({ name: 'Demo Shoes Co.', currency: 'USD', tax_rate: 8.5, created_by: users.owner.id })
    .select()
    .single();
  if (orgErr) throw orgErr;
  console.log(`  org "${org.name}" — invite code ${org.invite_code}`);

  const memberRows = USERS.map((u) => ({ org_id: org.id, user_id: users[u.role].id, role: u.role }));
  const { error: memErr } = await db.from('org_members').insert(memberRows);
  if (memErr) throw memErr;

  // 3. Categories & suppliers
  const { data: cats, error: catErr } = await db
    .from('categories')
    .insert(CATEGORIES.map((name) => ({ org_id: org.id, name })))
    .select();
  if (catErr) throw catErr;
  const catId = Object.fromEntries(cats.map((c) => [c.name, c.id]));

  const { data: sups, error: supErr } = await db
    .from('suppliers')
    .insert(SUPPLIERS.map((s) => ({ ...s, org_id: org.id })))
    .select();
  if (supErr) throw supErr;

  // 4. Products (quantity starts at 0; movements below build it up)
  const productRows = PRODUCTS.map(([name, cat, supIdx, cost, price, reorder], i) => ({
    org_id: org.id,
    name,
    sku: skuFor(i),
    barcode: barcodeFor(i),
    category_id: catId[cat],
    supplier_id: sups[supIdx].id,
    cost_price: cost,
    selling_price: price,
    quantity: 0,
    reorder_level: reorder,
    unit: 'pairs',
  }));
  const { data: products, error: prodErr } = await db.from('products').insert(productRows).select();
  if (prodErr) throw prodErr;
  console.log(`  ${products.length} products`);

  // 5. Movements: initial stock-in by the manager, then some activity.
  const bySku = Object.fromEntries(products.map((p) => [p.sku, p]));
  const movements = [];
  const daysAgo = (d) => new Date(Date.now() - d * 86400e3).toISOString();

  PRODUCTS.forEach(([, , , , , , qty], i) => {
    if (qty > 0) {
      movements.push({
        org_id: org.id,
        product_id: bySku[skuFor(i)].id,
        user_id: users.manager.id,
        type: 'in',
        quantity_change: qty,
        reason: 'initial',
        note: 'Opening stock',
        created_at: daysAgo(30),
      });
    }
  });

  const activity = [
    [0, 'out', -3, 'sale', 'staff', 25], [2, 'out', -5, 'sale', 'staff', 22],
    [6, 'out', -2, 'sale', 'manager', 20], [16, 'out', -8, 'sale', 'staff', 18],
    [11, 'out', -1, 'damage', 'staff', 15], [3, 'out', -4, 'sale', 'staff', 14],
    [0, 'in', 2, 'return', 'staff', 12], [8, 'out', -1, 'sale', 'manager', 10],
    [13, 'in', 10, 'purchase', 'manager', 9], [17, 'out', -6, 'sale', 'staff', 7],
    [25, 'out', -2, 'sale', 'staff', 5], [4, 'adjust', -1, 'stocktake', 'manager', 4],
    [26, 'out', -3, 'sale', 'staff', 3], [12, 'out', -2, 'sale', 'staff', 2],
    [21, 'out', -1, 'sale', 'owner', 1], [17, 'out', -4, 'sale', 'staff', 0.5],
  ];
  for (const [idx, type, change, reason, role, days] of activity) {
    movements.push({
      org_id: org.id,
      product_id: bySku[skuFor(idx)].id,
      user_id: users[role].id,
      type,
      quantity_change: change,
      reason,
      created_at: daysAgo(days),
    });
  }

  // Insert sequentially-ish (bulk is fine; trigger applies per row)
  const { error: movErr } = await db.from('stock_movements').insert(movements);
  if (movErr) throw movErr;
  console.log(`  ${movements.length} stock movements`);

  // 6. One purchase order (sent, awaiting receipt)
  const { data: po, error: poErr } = await db
    .from('purchase_orders')
    .insert({
      org_id: org.id,
      supplier_id: sups[1].id,
      status: 'sent',
      expected_date: new Date(Date.now() + 7 * 86400e3).toISOString().slice(0, 10),
      notes: 'Restock of low running stock',
      created_by: users.manager.id,
    })
    .select()
    .single();
  if (poErr) throw poErr;

  const poItems = [
    { sku: skuFor(7), qty: 12 },  // AeroGlide 3 Volt (out of stock)
    { sku: skuFor(5), qty: 10 },  // Retro Runner 88 Blue (low)
    { sku: skuFor(8), qty: 6 },   // Marathon Pro Carbon
  ].map(({ sku, qty }) => ({
    org_id: org.id,
    purchase_order_id: po.id,
    product_id: bySku[sku].id,
    quantity: qty,
    unit_cost: bySku[sku].cost_price,
  }));
  const { error: poiErr } = await db.from('purchase_order_items').insert(poItems);
  if (poiErr) throw poiErr;
  console.log(`  PO ${po.po_number} with ${poItems.length} lines`);

  console.log('\nDone! Demo accounts (password for all: Demo1234!):');
  for (const u of USERS) console.log(`  ${u.role.padEnd(7)} ${u.email}`);
  console.log(`\nOrg invite code: ${org.invite_code}`);
}

main().catch((err) => {
  console.error('Seed failed:', err.message || err);
  process.exit(1);
});
