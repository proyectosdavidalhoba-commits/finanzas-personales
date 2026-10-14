-- Incremento al esquema: Proveedores (cuentas por pagar).
-- Ejecutar completo en el SQL Editor de tu proyecto Supabase (Dashboard -> SQL Editor -> New query).

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

-- Un pago (contado = inmediato al crear la compra, o crédito = posterior) genera un egreso real.
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

-- Proveedores fijos para todos los usuarios existentes.
insert into public.suppliers (user_id, name)
select id, 'JFT' from auth.users
union all
select id, 'SINDAMANOY' from auth.users;

-- Actualizar el trigger de usuarios nuevos para que también les cree estos dos proveedores por defecto.
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
