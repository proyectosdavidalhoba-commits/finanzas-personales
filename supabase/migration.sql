-- Esquema de base de datos para la app de Finanzas Personales
-- Ejecutar completo en el SQL Editor de tu proyecto Supabase (Dashboard -> SQL Editor -> New query)

-- ============ TABLAS ============

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'efectivo',
  initial_balance numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  description text not null default '',
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  next_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  description text not null default '',
  date date not null default current_date,
  recurring_template_id uuid references public.recurring_templates(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  month text not null, -- formato 'YYYY-MM'
  amount_limit numeric not null check (amount_limit > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
create index if not exists transactions_category_idx on public.transactions (category_id);
create index if not exists budgets_user_month_idx on public.budgets (user_id, month);

-- ============ ROW LEVEL SECURITY ============

alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.recurring_templates enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

create policy "categories_select" on public.categories for select using (auth.uid() = user_id);
create policy "categories_insert" on public.categories for insert with check (auth.uid() = user_id);
create policy "categories_update" on public.categories for update using (auth.uid() = user_id);
create policy "categories_delete" on public.categories for delete using (auth.uid() = user_id);

create policy "accounts_select" on public.accounts for select using (auth.uid() = user_id);
create policy "accounts_insert" on public.accounts for insert with check (auth.uid() = user_id);
create policy "accounts_update" on public.accounts for update using (auth.uid() = user_id);
create policy "accounts_delete" on public.accounts for delete using (auth.uid() = user_id);

create policy "recurring_select" on public.recurring_templates for select using (auth.uid() = user_id);
create policy "recurring_insert" on public.recurring_templates for insert with check (auth.uid() = user_id);
create policy "recurring_update" on public.recurring_templates for update using (auth.uid() = user_id);
create policy "recurring_delete" on public.recurring_templates for delete using (auth.uid() = user_id);

create policy "transactions_select" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update" on public.transactions for update using (auth.uid() = user_id);
create policy "transactions_delete" on public.transactions for delete using (auth.uid() = user_id);

create policy "budgets_select" on public.budgets for select using (auth.uid() = user_id);
create policy "budgets_insert" on public.budgets for insert with check (auth.uid() = user_id);
create policy "budgets_update" on public.budgets for update using (auth.uid() = user_id);
create policy "budgets_delete" on public.budgets for delete using (auth.uid() = user_id);

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

-- ============ PROVEEDORES Y COMPRAS (cuentas por pagar) ============

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  date date not null default current_date,
  payment_type text not null check (payment_type in ('cash', 'credit')),
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null,
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_payments (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  transaction_id uuid references public.transactions(id) on delete set null,
  amount numeric not null check (amount > 0),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists purchase_items_purchase_idx on public.purchase_items (purchase_id);
create index if not exists purchase_payments_purchase_idx on public.purchase_payments (purchase_id);

alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.purchase_payments enable row level security;

create policy "suppliers_select" on public.suppliers for select using (auth.uid() = user_id);
create policy "suppliers_insert" on public.suppliers for insert with check (auth.uid() = user_id);
create policy "suppliers_update" on public.suppliers for update using (auth.uid() = user_id);
create policy "suppliers_delete" on public.suppliers for delete using (auth.uid() = user_id);

create policy "purchases_select" on public.purchases for select using (auth.uid() = user_id);
create policy "purchases_insert" on public.purchases for insert with check (auth.uid() = user_id);
create policy "purchases_update" on public.purchases for update using (auth.uid() = user_id);
create policy "purchases_delete" on public.purchases for delete using (auth.uid() = user_id);

create policy "purchase_items_select" on public.purchase_items for select using (auth.uid() = user_id);
create policy "purchase_items_insert" on public.purchase_items for insert with check (auth.uid() = user_id);
create policy "purchase_items_update" on public.purchase_items for update using (auth.uid() = user_id);
create policy "purchase_items_delete" on public.purchase_items for delete using (auth.uid() = user_id);

create policy "purchase_payments_select" on public.purchase_payments for select using (auth.uid() = user_id);
create policy "purchase_payments_insert" on public.purchase_payments for insert with check (auth.uid() = user_id);
create policy "purchase_payments_update" on public.purchase_payments for update using (auth.uid() = user_id);
create policy "purchase_payments_delete" on public.purchase_payments for delete using (auth.uid() = user_id);

-- ============ CATEGORÍAS POR DEFECTO PARA USUARIOS NUEVOS ============

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.categories (user_id, name, type, color) values
    (new.id, 'Salario', 'income', '#22c55e'),
    (new.id, 'Otros ingresos', 'income', '#16a34a'),
    (new.id, 'Alimentación', 'expense', '#f97316'),
    (new.id, 'Transporte', 'expense', '#3b82f6'),
    (new.id, 'Vivienda', 'expense', '#8b5cf6'),
    (new.id, 'Salud', 'expense', '#ef4444'),
    (new.id, 'Entretenimiento', 'expense', '#ec4899'),
    (new.id, 'Otros gastos', 'expense', '#64748b');

  insert into public.suppliers (user_id, name) values
    (new.id, 'JFT'),
    (new.id, 'SINDAMANOY');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
