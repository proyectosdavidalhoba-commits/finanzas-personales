import { createClient } from "@/lib/supabase/server";
import { TransaccionesTabs } from "@/components/TransaccionesTabs";
import type { Account, Category, Transaction, Transfer } from "@/lib/types";

export default async function TransaccionesPage() {
  const supabase = await createClient();

  const [{ data: transactions }, { data: transfers }, { data: accounts }, { data: categories }] = await Promise.all([
    supabase.from("transactions").select("*").order("date", { ascending: false }),
    supabase.from("transfers").select("*").order("date", { ascending: false }),
    supabase.from("accounts").select("*").order("name"),
    supabase.from("categories").select("*").order("name"),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-50">Transacciones</h1>
      <TransaccionesTabs
        transactions={(transactions as Transaction[]) ?? []}
        transfers={(transfers as Transfer[]) ?? []}
        accounts={(accounts as Account[]) ?? []}
        categories={(categories as Category[]) ?? []}
      />
    </div>
  );
}
