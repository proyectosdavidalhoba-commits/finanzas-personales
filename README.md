# Finanzas Personales

App web para registrar ingresos y egresos por categoría, con cuentas, presupuestos y transacciones recurrentes. Construida con Next.js (App Router) + Supabase (Postgres + Auth) + Tailwind CSS + Recharts.

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta gratuita.
2. Crea un nuevo proyecto (elige una región y una contraseña para la base de datos).
3. Ve a **Settings → API** y copia:
   - **Project URL**
   - **anon public key**

## 2. Configurar las variables de entorno

Copia `.env.local.example` a `.env.local` y pega tus credenciales:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## 3. Crear las tablas en Supabase

En el dashboard de Supabase, ve a **SQL Editor → New query**, pega todo el contenido de [`supabase/migration.sql`](supabase/migration.sql) y ejecútalo. Esto crea las tablas (`categories`, `accounts`, `transactions`, `recurring_templates`, `budgets`), las políticas de seguridad (Row Level Security, para que cada usuario solo vea sus propios datos) y un trigger que crea categorías por defecto para cada usuario nuevo.

> Por defecto, Supabase pide confirmación de correo al registrarse. Para pruebas personales puedes desactivarlo en **Authentication → Providers → Email → Confirm email** (apágalo), o revisar el correo de confirmación que te llega.

## 4. Correr la app en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000), regístrate con tu correo y contraseña, y empieza a usar la app.

## Funcionalidades

- **Categorías** (`/categorias`): crear, editar y eliminar categorías de ingreso/egreso. Vienen algunas por defecto al registrarte.
- **Cuentas** (`/cuentas`): maneja varias cuentas o medios de pago (efectivo, banco, tarjeta) con saldo inicial.
- **Transacciones** (`/transacciones`): registra ingresos y egresos, con filtros por cuenta y categoría.
- **Presupuestos** (`/presupuestos`): define un límite mensual por categoría y ve una barra de progreso contra el gasto real.
- **Recurrentes** (`/recurrentes`): define ingresos/egresos que se repiten (semanal, mensual, anual). Se generan automáticamente como transacciones reales la próxima vez que abres la app, si ya llegó la fecha.
- **Resumen** (`/`): balance total, ingresos/egresos del mes, gráfico de gastos por categoría y de ingresos vs egresos de los últimos 6 meses.

## Notas

- No se puede eliminar una categoría o cuenta que ya tenga transacciones, presupuestos o recurrentes asociados — primero hay que reasignarlos o eliminarlos, para evitar perder historial por accidente.
- Las transacciones recurrentes vencidas se materializan al cargar el dashboard (`/`), no con un cron en segundo plano.
- Todo el dinero se maneja en una sola moneda (no hay conversión de divisas).

## Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. Importa el repo en [vercel.com/new](https://vercel.com/new).
3. Agrega las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en la configuración del proyecto en Vercel.
4. Deploy.
