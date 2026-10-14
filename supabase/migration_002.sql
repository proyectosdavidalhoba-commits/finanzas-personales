-- Incremento al esquema: transferencias entre cuentas y cuentas por cobrar (facturación).
-- Ejecutar completo en el SQL Editor de tu proyecto Supabase (Dashboard -> SQL Editor -> New query).
-- Seguro de correr una sola vez sobre una base que ya tiene supabase/migration.sql aplicado.

-- ============ TRANSFERENCIAS ENTRE CUENTAS (neutras: no son income/expense) ============

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_account_id uuid not null references public.accounts(id) on delete restrict,
  to_account_id uuid not null references public.accounts(id) on delete restrict,
  amount numeric not null check (amount > 0),
  description text not null default '',
  date date not null default current_date,
  created_at timestamptz not null default now(),
  check (from_account_id <> to_account_id)
);

create index if not exists transfers_user_date_idx on public.transfers (user_id, date desc);

alter table public.transfers enable row level security;

create policy "transfers_select" on public.transfers for select using (auth.uid() = user_id);
create policy "transfers_insert" on public.transfers for insert with check (auth.uid() = user_id);
create policy "transfers_update" on public.transfers for update using (auth.uid() = user_id);
create policy "transfers_delete" on public.transfers for delete using (auth.uid() = user_id);

-- ============ CUENTAS POR COBRAR (facturación simple) ============

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null,
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price > 0),
  created_at timestamptz not null default now()
);

-- Un pago registrado contra una factura genera una transacción real de tipo 'income'.
create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  transaction_id uuid references public.transactions(id) on delete set null,
  amount numeric not null check (amount > 0),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists invoice_items_invoice_idx on public.invoice_items (invoice_id);
create index if not exists invoice_payments_invoice_idx on public.invoice_payments (invoice_id);

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_payments enable row level security;

create policy "invoices_select" on public.invoices for select using (auth.uid() = user_id);
create policy "invoices_insert" on public.invoices for insert with check (auth.uid() = user_id);
create policy "invoices_update" on public.invoices for update using (auth.uid() = user_id);
create policy "invoices_delete" on public.invoices for delete using (auth.uid() = user_id);

create policy "invoice_items_select" on public.invoice_items for select using (auth.uid() = user_id);
create policy "invoice_items_insert" on public.invoice_items for insert with check (auth.uid() = user_id);
create policy "invoice_items_update" on public.invoice_items for update using (auth.uid() = user_id);
create policy "invoice_items_delete" on public.invoice_items for delete using (auth.uid() = user_id);

create policy "invoice_payments_select" on public.invoice_payments for select using (auth.uid() = user_id);
create policy "invoice_payments_insert" on public.invoice_payments for insert with check (auth.uid() = user_id);
create policy "invoice_payments_update" on public.invoice_payments for update using (auth.uid() = user_id);
create policy "invoice_payments_delete" on public.invoice_payments for delete using (auth.uid() = user_id);
