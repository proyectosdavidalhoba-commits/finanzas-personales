import { createClient } from "@/lib/supabase/server";
import { AccountManager } from "@/components/AccountManager";
import { computeAccountBalances } from "@/lib/balances";
import type { Account, Transaction, Transfer } from "@/lib/types";

export default async function CuentasPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: transactions }, { data: transfers }] = await Promise.all([
    supabase.from("accounts").select("*").order("name"),
    supabase.from("transactions").select("*"),
    supabase.from("transfers").select("*"),
  ]);

  const accs = (accounts as Account[]) ?? [];
  const balances = computeAccountBalances(accs, (transactions as Transaction[]) ?? [], (transfers as Transfer[]) ?? []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-50">Cuentas</h1>
      <AccountManager accounts={accs} balances={Object.fromEntries(balances)} />
    </div>
  );
}
