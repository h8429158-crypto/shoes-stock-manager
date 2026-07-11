# StockRoom — multi-user inventory management app

A React Native (Expo) inventory app for small teams: products, barcode
scanning, stock in/out with a full audit trail, purchase orders, sales
invoices with PDF export, low-stock alerts, reports — multi-user with
roles, realtime sync, and offline-first storage.

Built with **Expo SDK 57 + TypeScript**, **Expo Router**, **Supabase**
(Postgres, Auth, Storage, Realtime), **expo-sqlite** (offline cache +
mutation outbox), **Zustand**, **Zod**, and **React Native Paper**.

## Features

- **Auth & teams** — email/password sign up, login, password reset. On first
  login, create an organization or join one with an 8-character invite code.
  Roles: **Owner** (everything), **Manager** (products, stock, POs, invoices),
  **Staff** (stock in/out + scanning). Enforced by Postgres Row Level Security
  *and* role-gated UI.
- **Dashboard** — product count, stock value, low/out-of-stock counts, value
  by category, stock in/out over the last 30 days, and a live activity feed
  with user names (“Sara stocked out 3× SKU-001”).
- **Products** — search, category chips, stock-status filters, sorting;
  add/edit with auto-generated SKU, barcode, prices (stored as integer
  cents), reorder level, notes, photos (camera or gallery → Supabase
  Storage); swipe a row for quick stock in/out or delete.
- **Barcode scanner** — center tab. Scans EAN/UPC/Code128/QR etc.; a known
  barcode opens Stock In / Stock Out / Add to PO / Details; an unknown one
  offers to create the product. **Continuous count mode** turns scanning
  into a stocktake session — review counted vs. system quantities and apply
  all corrections in bulk as adjustment movements.
- **Stock operations** — quantity stepper, reason codes (purchase, sale,
  damage, return, adjustment), notes, haptics. Every movement is an
  **immutable** `stock_movements` row recording who did it; product
  quantities are derived from movements by a DB trigger — never edited
  directly.
- **Purchase orders** — pick supplier, add lines by search or scan, expected
  date; Draft → Sent → Received. “Receive” stocks in every line atomically
  (server RPC). Low-stock items grouped by supplier can be turned into a PO
  in one tap, with suggested reorder quantities.
- **Invoices** — customer name, line items (auto stock-out on save), tax.
  POs and invoices export as **PDF** (org logo, line items, totals, tax) via
  expo-print and share with the system sheet.
- **Alerts** — low/out-of-stock lists with suggested quantities, one-tap
  “Create PO”, and local push notifications on low stock and PO received
  (fired from Realtime events while the app runs; true server-sent push
  would need a small backend worker — not included).
- **Reports** — stock valuation, movement history with date + user filters,
  dead stock (no movement in 30/60/90 days), all exportable as CSV.
- **Offline-first** — every screen reads from a local SQLite mirror, so the
  app opens and works with no connection. Writes apply optimistically and
  queue in a durable **outbox**; when connectivity returns they replay in
  order, then data refetches. A subtle banner shows offline state and the
  pending-sync count.
- **Realtime** — teammates' stock changes, PO updates, and role changes
  appear live via Supabase Realtime.
- **Dark/light mode**, pull-to-refresh, skeleton loaders, empty states,
  confirmation dialogs.

## Project structure

```
supabase/schema.sql   Complete DB schema: tables, RLS policies, triggers, RPCs
supabase/seed.js      Demo data seeder (org, 3 users, 30 products, PO, movements)
src/app/              Screens (Expo Router): (auth), (tabs), product/, po/, invoice/…
src/components/       Reusable UI (charts, product list, forms, pickers, banner…)
src/db/               Offline layer: SQLite cache + outbox, sync engine, mutations
src/lib/              Supabase client, types, zod schemas, money, pdf, csv, theme
src/store/            Zustand stores: auth, data, sync, settings, stocktake
```

## Setup

### 1. Create the Supabase project

1. Create a project at <https://supabase.com/dashboard>.
2. Open **SQL Editor → New query**, paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates all
   tables, RLS policies, triggers, RPC functions, the `product-images`
   storage bucket, and Realtime publications.
3. (For quick testing) **Authentication → Sign In / Up → Email**: disable
   *Confirm email* so new accounts can log in immediately.

### 2. Configure the app

```bash
npm install
cp .env.example .env
```

Fill `.env` from **Project Settings → API**:

```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

### 3. Seed demo data (optional but recommended)

```bash
SUPABASE_URL=https://<your-project-ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service role key> \
npm run seed
```

This creates one demo org (**Demo Shoes Co.**, invite code printed at the
end) with 6 categories, 3 suppliers, 30 products, a month of stock
movements, one open PO, and three ready-to-use accounts:

| Role    | Email                        | Password    |
|---------|------------------------------|-------------|
| Owner   | `owner@demo.stockroom.app`   | `Demo1234!` |
| Manager | `manager@demo.stockroom.app` | `Demo1234!` |
| Staff   | `staff@demo.stockroom.app`   | `Demo1234!` |

> The service-role key bypasses RLS — use it only for this script, never in
> the app.

To create demo accounts manually instead: sign up three users in the app,
have the first create an org (they become Owner), share the invite code
from the **Team** screen with the other two, then promote one to Manager.

### 4. Run

```bash
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS with
Expo Go installed). Everything used here is supported by Expo Go — no
custom dev client needed. Press `a`/`i` to launch an emulator/simulator
instead.

Try it: log in as the Manager, scan/search a product, stock some out, and
watch the movement appear live on the Owner's dashboard. Then enable
airplane mode, make changes, and watch them queue and sync when you're
back online.

## Architecture notes

- **Money** is stored as integer minor units (cents) everywhere.
- **Quantities** are never written directly: every change is an immutable
  `stock_movements` insert (with the acting user), and a trigger updates
  `products.quantity`. Receiving a PO is a `receive_purchase_order` RPC that
  stocks in all lines atomically. Quantity is clamped at zero so queued
  offline movements always replay cleanly.
- **Offline sync**: mutations go through `src/db/mutations.ts`, which applies
  them optimistically to the Zustand store + SQLite cache and enqueues the
  server call in an outbox table. A NetInfo listener flushes the outbox in
  order when back online, then refetches. Client-generated UUIDs make
  replays idempotent. Team/org management and photo uploads intentionally
  require a connection.
- **RLS**: every tenant table carries `org_id`; policies check membership and
  role via `security definer` helper functions. Staff can only insert
  movements as themselves; the movements log accepts no updates or deletes.

## Scripts

| Command             | What it does                        |
|---------------------|-------------------------------------|
| `npx expo start`    | Start the dev server                |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`)   |
| `npm run lint`      | ESLint via `expo lint`              |
| `npm run seed`      | Seed demo data (needs service key)  |
