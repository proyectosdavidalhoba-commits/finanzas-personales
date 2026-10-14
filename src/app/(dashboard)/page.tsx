import { createClient } from "@/lib/supabase/server";
import { materializeDueRecurringTransactions } from "@/lib/recurring";
import { DashboardCharts } from "@/components/DashboardCharts";
import type { Account, Category, InvoiceItem, InvoicePayment, PurchaseItem, PurchasePayment, Transaction } from "@/lib/types";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await materializeDueRecurringTransactions(supabase, user.id);
  }

  const [
    { data: accounts },
    { data: categories },
    { data: transactions },
    { data: invoiceItems },
    { data: invoicePayments },
    { data: purchaseItems },
    { data: purchasePayments },
  ] = await Promise.all([
    supabase.from("accounts").select("*"),
    supabase.from("categories").select("*"),
    supabase.from("transactions").select("*"),
    supabase.from("invoice_items").select("*"),
    supabase.from("invoice_payments").select("*"),
    supabase.from("purchase_items").select("*"),
    supabase.from("purchase_payments").select("*"),
  ]);

  const accs = (accounts as Account[]) ?? [];
  const cats = (categories as Category[]) ?? [];
  const txs = (transactions as Transaction[]) ?? [];

  const totalInvoiced = ((invoiceItems as InvoiceItem[]) ?? []).reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const totalCollected = ((invoicePayments as InvoicePayment[]) ?? []).reduce((s, p) => s + p.amount, 0);
  const totalReceivable = totalInvoiced - totalCollected;

  const totalPurchased = ((purchaseItems as PurchaseItem[]) ?? []).reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const totalPaidToSuppliers = ((purchasePayments as PurchasePayment[]) ?? []).reduce((s, p) => s + p.amount, 0);
  const totalPayable = totalPurchased - totalPaidToSuppliers;

  const initialBalance = accs.reduce((sum, a) => sum + a.initial_balance, 0);
  const totalIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = initialBalance + totalIncome - totalExpense;

  const thisMonth = currentMonth();
  const monthIncome = txs
    .filter((t) => t.type === "income" && t.date.startsWith(thisMonth))
    .reduce((s, t) => s + t.amount, 0);
  const monthExpense = txs
    .filter((t) => t.type === "expense" && t.date.startsWith(thisMonth))
    .reduce((s, t) => s + t.amount, 0);

  const categoryById = new Map(cats.map((c) => [c.id, c]));
  const expenseByCategory = new Map<string, number>();
  for (const t of txs) {
    if (t.type === "expense" && t.date.startsWith(thisMonth)) {
      expenseByCategory.set(t.category_id, (expenseByCategory.get(t.category_id) ?? 0) + t.amount);
    }
  }
  const pieData = Array.from(expenseByCategory.entries())
    .map(([categoryId, value]) => {
      const cat = categoryById.get(categoryId);
      return { name: cat?.name ?? "Otro", value, color: cat?.color ?? "#94a3b8" };
    })
    .sort((a, b) => b.value - a.value);

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return d.toISOString().slice(0, 7);
  });
  const barData = months.map((m) => ({
    month: m,
    ingresos: txs.filter((t) => t.type === "income" && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0),
    egresos: txs.filter((t) => t.type === "expense" && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-50">Resumen</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Balance total" value={balance} tone="text-indigo-400" />
        <StatCard label="Ingresos del mes" value={monthIncome} tone="text-emerald-400" />
        <StatCard label="Egresos del mes" value={monthExpense} tone="text-red-400" />
        <StatCard label="Por cobrar" value={totalReceivable} tone="text-amber-400" />
        <StatCard label="Por pagar" value={totalPayable} tone="text-orange-400" />
      </div>

      <DashboardCharts pieData={pieData} barData={barData} />
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>${value.toLocaleString("es-CO")}</p>
    </div>
  );
}
