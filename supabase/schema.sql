-- ============================================================================
-- StockRoom — Inventory Management schema for Supabase
--
-- How to apply:
--   1. Create a Supabase project at https://supabase.com/dashboard
--   2. Open SQL Editor → New query, paste this entire file, and Run.
--      (Or: supabase db push / psql "$DATABASE_URL" -f supabase/schema.sql)
--   3. Then run supabase/storage.sql notes below are already included here —
--      this file is self-contained and idempotent-ish (drops nothing, uses
--      IF NOT EXISTS where possible). Run it once on a fresh project.
--   4. In Dashboard → Authentication → Providers, keep Email enabled.
--      For local testing you may disable "Confirm email" so demo accounts
--      can log in immediately.
--
-- Conventions:
--   * All money columns are integers in minor units (cents).
--   * Every tenant table carries org_id and is protected by RLS.
--   * Roles: owner > manager > staff (stored on org_members.role).
--   * stock_movements is immutable (insert + select only) and is the single
--     source of truth for quantity changes: a trigger keeps products.quantity
--     in sync with inserted movements.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Helpers
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 8-char human-friendly invite code (no ambiguous chars)
create or replace function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random() * 32) + 1)::int, 1),
    ''
  )
  from generate_series(1, 8);
$$;

-- ----------------------------------------------------------------------------
-- Profiles (mirror of auth.users for display names)
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Organizations & membership
-- ----------------------------------------------------------------------------

create table if not exists public.orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  currency    text not null default 'USD',
  tax_rate    numeric(5,2) not null default 0,          -- percent, e.g. 7.50
  invite_code text not null unique default public.generate_invite_code(),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger orgs_updated_at
  before update on public.orgs
  for each row execute function public.set_updated_at();

create table if not exists public.org_members (
  org_id     uuid not null references public.orgs (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Security-definer helpers so RLS policies never recurse into org_members.
create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where org_id = p_org and user_id = auth.uid()
  );
$$;

create or replace function public.org_role(p_org uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.org_members
  where org_id = p_org and user_id = auth.uid();
$$;

create or replace function public.has_org_role(p_org uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.org_role(p_org) = any (p_roles), false);
$$;

-- Do two users share at least one org? (used for profile visibility)
create or replace function public.shares_org_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members a
    join public.org_members b on a.org_id = b.org_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

-- ----------------------------------------------------------------------------
-- Catalog: categories & suppliers
-- ----------------------------------------------------------------------------

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.orgs (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create table if not exists public.suppliers (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.orgs (id) on delete cascade,
  name           text not null,
  contact_name   text not null default '',
  email          text not null default '',
  phone          text not null default '',
  lead_time_days integer not null default 7 check (lead_time_days >= 0),
  notes          text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Products
-- ----------------------------------------------------------------------------

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs (id) on delete cascade,
  name          text not null,
  sku           text not null,
  barcode       text,
  category_id   uuid references public.categories (id) on delete set null,
  supplier_id   uuid references public.suppliers (id) on delete set null,
  cost_price    integer not null default 0 check (cost_price >= 0),     -- cents
  selling_price integer not null default 0 check (selling_price >= 0),  -- cents
  quantity      integer not null default 0,
  reorder_level integer not null default 0 check (reorder_level >= 0),
  unit          text not null default 'pcs',
  notes         text not null default '',
  image_url     text,
  archived      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (org_id, sku)
);

create index if not exists products_org_idx     on public.products (org_id);
create index if not exists products_barcode_idx on public.products (org_id, barcode);

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Stock movements (immutable audit log; drives products.quantity)
-- ----------------------------------------------------------------------------

create table if not exists public.stock_movements (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs (id) on delete cascade,
  product_id      uuid not null references public.products (id) on delete cascade,
  user_id         uuid references auth.users (id) on delete set null,
  type            text not null check (type in ('in', 'out', 'adjust')),
  quantity_change integer not null check (quantity_change <> 0),  -- signed delta
  reason          text not null check (reason in
                    ('purchase', 'sale', 'damage', 'return', 'adjustment',
                     'stocktake', 'po_received', 'initial')),
  note            text not null default '',
  created_at      timestamptz not null default now()
);

create index if not exists movements_org_created_idx
  on public.stock_movements (org_id, created_at desc);
create index if not exists movements_product_idx
  on public.stock_movements (product_id, created_at desc);

-- Keep products.quantity in sync. Quantity is clamped at zero so that
-- offline-queued movements can always be replayed without hard failures;
-- the movement log remains the authoritative audit trail.
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set quantity = greatest(0, quantity + new.quantity_change)
  where id = new.product_id;
  return new;
end;
$$;

create trigger stock_movements_apply
  after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

-- Belt & braces immutability (RLS already grants no update/delete).
create or replace function public.forbid_change()
returns trigger
language plpgsql
as $$
begin
  raise exception 'stock_movements are immutable';
end;
$$;

create trigger stock_movements_immutable
  before update or delete on public.stock_movements
  for each row execute function public.forbid_change();

-- ----------------------------------------------------------------------------
-- Purchase orders
-- ----------------------------------------------------------------------------

create sequence if not exists public.po_number_seq;

create table if not exists public.purchase_orders (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs (id) on delete cascade,
  po_number     text not null default ('PO-' || lpad(nextval('public.po_number_seq')::text, 5, '0')),
  supplier_id   uuid references public.suppliers (id) on delete set null,
  status        text not null default 'draft' check (status in ('draft', 'sent', 'received', 'cancelled')),
  expected_date date,
  notes         text not null default '',
  created_by    uuid references auth.users (id) on delete set null,
  received_by   uuid references auth.users (id) on delete set null,
  received_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists purchase_orders_org_idx on public.purchase_orders (org_id, created_at desc);

create trigger purchase_orders_updated_at
  before update on public.purchase_orders
  for each row execute function public.set_updated_at();

create table if not exists public.purchase_order_items (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.orgs (id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders (id) on delete cascade,
  product_id        uuid not null references public.products (id) on delete cascade,
  quantity          integer not null check (quantity > 0),
  unit_cost         integer not null default 0 check (unit_cost >= 0),  -- cents
  created_at        timestamptz not null default now()
);

create index if not exists po_items_po_idx on public.purchase_order_items (purchase_order_id);

-- Receive a PO atomically: mark received and stock in every line item.
create or replace function public.receive_purchase_order(p_po uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status text;
  v_item record;
begin
  select org_id, status into v_org, v_status
  from public.purchase_orders where id = p_po;

  if v_org is null then
    raise exception 'purchase order not found';
  end if;
  if not public.has_org_role(v_org, array['owner', 'manager']) then
    raise exception 'only owners and managers can receive purchase orders';
  end if;
  if v_status = 'received' then
    raise exception 'purchase order already received';
  end if;

  for v_item in
    select product_id, quantity, unit_cost
    from public.purchase_order_items
    where purchase_order_id = p_po
  loop
    insert into public.stock_movements (org_id, product_id, user_id, type, quantity_change, reason, note)
    values (v_org, v_item.product_id, auth.uid(), 'in', v_item.quantity, 'po_received',
            'Received PO ' || (select po_number from public.purchase_orders where id = p_po));

    -- refresh cost price to the latest purchase cost
    update public.products
    set cost_price = v_item.unit_cost
    where id = v_item.product_id and v_item.unit_cost > 0;
  end loop;

  update public.purchase_orders
  set status = 'received', received_by = auth.uid(), received_at = now()
  where id = p_po;
end;
$$;

-- ----------------------------------------------------------------------------
-- Invoices (sales)
-- ----------------------------------------------------------------------------

create sequence if not exists public.invoice_number_seq;

create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.orgs (id) on delete cascade,
  invoice_number text not null default ('INV-' || lpad(nextval('public.invoice_number_seq')::text, 5, '0')),
  customer_name  text not null,
  tax_rate       numeric(5,2) not null default 0,
  notes          text not null default '',
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists invoices_org_idx on public.invoices (org_id, created_at desc);

create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create table if not exists public.invoice_items (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.orgs (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  description text not null default '',
  quantity   integer not null check (quantity > 0),
  unit_price integer not null default 0 check (unit_price >= 0),  -- cents
  created_at timestamptz not null default now()
);

create index if not exists invoice_items_invoice_idx on public.invoice_items (invoice_id);

-- ----------------------------------------------------------------------------
-- Org lifecycle RPCs
-- ----------------------------------------------------------------------------

-- Create an org and make the caller its owner.
create or replace function public.create_org(p_name text)
returns public.orgs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.orgs;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'organization name is required';
  end if;

  insert into public.orgs (name, created_by)
  values (trim(p_name), auth.uid())
  returning * into v_org;

  insert into public.org_members (org_id, user_id, role)
  values (v_org.id, auth.uid(), 'owner');

  return v_org;
end;
$$;

-- Join an org with an invite code (new members join as staff).
create or replace function public.join_org(p_code text)
returns public.orgs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.orgs;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_org
  from public.orgs
  where invite_code = upper(trim(p_code));

  if v_org.id is null then
    raise exception 'invalid invite code';
  end if;

  insert into public.org_members (org_id, user_id, role)
  values (v_org.id, auth.uid(), 'staff')
  on conflict (org_id, user_id) do nothing;

  return v_org;
end;
$$;

-- Owner-only: rotate the invite code.
create or replace function public.regenerate_invite_code(p_org uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.has_org_role(p_org, array['owner']) then
    raise exception 'only owners can regenerate the invite code';
  end if;

  update public.orgs
  set invite_code = public.generate_invite_code()
  where id = p_org
  returning invite_code into v_code;

  return v_code;
end;
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table public.profiles             enable row level security;
alter table public.orgs                 enable row level security;
alter table public.org_members          enable row level security;
alter table public.categories           enable row level security;
alter table public.suppliers            enable row level security;
alter table public.products             enable row level security;
alter table public.stock_movements      enable row level security;
alter table public.purchase_orders      enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.invoices             enable row level security;
alter table public.invoice_items        enable row level security;

-- profiles: you can see yourself and anyone you share an org with
create policy "profiles: read own or co-members"
  on public.profiles for select
  using (id = auth.uid() or public.shares_org_with(id));

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: insert own"
  on public.profiles for insert
  with check (id = auth.uid());

-- orgs: members read; owner updates. Creation goes through create_org().
create policy "orgs: members read"
  on public.orgs for select
  using (public.is_org_member(id));

create policy "orgs: owner updates"
  on public.orgs for update
  using (public.has_org_role(id, array['owner']))
  with check (public.has_org_role(id, array['owner']));

-- org_members: members can see the team; only owners manage it.
create policy "org_members: members read"
  on public.org_members for select
  using (public.is_org_member(org_id));

create policy "org_members: owner inserts"
  on public.org_members for insert
  with check (public.has_org_role(org_id, array['owner']));

create policy "org_members: owner updates roles"
  on public.org_members for update
  using (public.has_org_role(org_id, array['owner']))
  with check (public.has_org_role(org_id, array['owner']));

create policy "org_members: owner removes, or leave yourself"
  on public.org_members for delete
  using (public.has_org_role(org_id, array['owner']) or user_id = auth.uid());

-- categories / suppliers: members read; owner+manager write.
create policy "categories: members read"
  on public.categories for select using (public.is_org_member(org_id));
create policy "categories: managers write"
  on public.categories for insert with check (public.has_org_role(org_id, array['owner','manager']));
create policy "categories: managers update"
  on public.categories for update
  using (public.has_org_role(org_id, array['owner','manager']))
  with check (public.has_org_role(org_id, array['owner','manager']));
create policy "categories: managers delete"
  on public.categories for delete using (public.has_org_role(org_id, array['owner','manager']));

create policy "suppliers: members read"
  on public.suppliers for select using (public.is_org_member(org_id));
create policy "suppliers: managers write"
  on public.suppliers for insert with check (public.has_org_role(org_id, array['owner','manager']));
create policy "suppliers: managers update"
  on public.suppliers for update
  using (public.has_org_role(org_id, array['owner','manager']))
  with check (public.has_org_role(org_id, array['owner','manager']));
create policy "suppliers: managers delete"
  on public.suppliers for delete using (public.has_org_role(org_id, array['owner','manager']));

-- products: members read; owner+manager write/delete.
create policy "products: members read"
  on public.products for select using (public.is_org_member(org_id));
create policy "products: managers insert"
  on public.products for insert with check (public.has_org_role(org_id, array['owner','manager']));
create policy "products: managers update"
  on public.products for update
  using (public.has_org_role(org_id, array['owner','manager']))
  with check (public.has_org_role(org_id, array['owner','manager']));
create policy "products: managers delete"
  on public.products for delete using (public.has_org_role(org_id, array['owner','manager']));

-- stock_movements: members read; ANY member (incl. staff) inserts as themself.
-- No update/delete policies: the log is immutable.
create policy "movements: members read"
  on public.stock_movements for select using (public.is_org_member(org_id));
create policy "movements: members insert as self"
  on public.stock_movements for insert
  with check (public.is_org_member(org_id) and user_id = auth.uid());

-- purchase orders: members read; owner+manager write.
create policy "pos: members read"
  on public.purchase_orders for select using (public.is_org_member(org_id));
create policy "pos: managers insert"
  on public.purchase_orders for insert with check (public.has_org_role(org_id, array['owner','manager']));
create policy "pos: managers update"
  on public.purchase_orders for update
  using (public.has_org_role(org_id, array['owner','manager']))
  with check (public.has_org_role(org_id, array['owner','manager']));
create policy "pos: managers delete"
  on public.purchase_orders for delete using (public.has_org_role(org_id, array['owner','manager']));

create policy "po_items: members read"
  on public.purchase_order_items for select using (public.is_org_member(org_id));
create policy "po_items: managers insert"
  on public.purchase_order_items for insert with check (public.has_org_role(org_id, array['owner','manager']));
create policy "po_items: managers update"
  on public.purchase_order_items for update
  using (public.has_org_role(org_id, array['owner','manager']))
  with check (public.has_org_role(org_id, array['owner','manager']));
create policy "po_items: managers delete"
  on public.purchase_order_items for delete using (public.has_org_role(org_id, array['owner','manager']));

-- invoices: members read; owner+manager write.
create policy "invoices: members read"
  on public.invoices for select using (public.is_org_member(org_id));
create policy "invoices: managers insert"
  on public.invoices for insert with check (public.has_org_role(org_id, array['owner','manager']));
create policy "invoices: managers update"
  on public.invoices for update
  using (public.has_org_role(org_id, array['owner','manager']))
  with check (public.has_org_role(org_id, array['owner','manager']));
create policy "invoices: managers delete"
  on public.invoices for delete using (public.has_org_role(org_id, array['owner','manager']));

create policy "invoice_items: members read"
  on public.invoice_items for select using (public.is_org_member(org_id));
create policy "invoice_items: managers insert"
  on public.invoice_items for insert with check (public.has_org_role(org_id, array['owner','manager']));
create policy "invoice_items: managers update"
  on public.invoice_items for update
  using (public.has_org_role(org_id, array['owner','manager']))
  with check (public.has_org_role(org_id, array['owner','manager']));
create policy "invoice_items: managers delete"
  on public.invoice_items for delete using (public.has_org_role(org_id, array['owner','manager']));

-- ----------------------------------------------------------------------------
-- Storage: product images (public-read bucket, member-scoped writes)
-- Files are stored under <org_id>/<uuid>.jpg
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product images: public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product images: members upload to their org folder"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "product images: members update in their org folder"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "product images: members delete in their org folder"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

-- ----------------------------------------------------------------------------
-- Realtime: broadcast changes on the tables the app watches live
-- ----------------------------------------------------------------------------

alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.stock_movements;
alter publication supabase_realtime add table public.purchase_orders;
alter publication supabase_realtime add table public.org_members;
alter publication supabase_realtime add table public.orgs;

-- Done. Next: run the seed script (see supabase/seed.js) to load demo data.
