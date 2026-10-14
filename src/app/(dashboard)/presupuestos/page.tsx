import { createClient } from "@/lib/supabase/server";
import { BudgetManager } from "@/components/BudgetManager";
import type { Budget, Category, Transaction } from "@/lib/types";

export default async function PresupuestosPage() {
  const supabase = await createClient();

  const [{ data: budgets }, { data: categories }, { data: transactions }] = await Promise.all([
    supabase.from("budgets").select("*"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("transactions").select("*"),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-50">Presupuestos</h1>
      <BudgetManager
        budgets={(budgets as Budget[]) ?? []}
        categories={(categories as Category[]) ?? []}
        transactions={(transactions as Transaction[]) ?? []}
      />
    </div>
  );
}
