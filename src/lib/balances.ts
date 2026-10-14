import type { Account, Transaction, Transfer } from "@/lib/types";

/**
 * Saldo actual por cuenta = saldo inicial + ingresos - egresos
 * - transferencias salientes + transferencias entrantes.
 * Las transferencias son neutras a nivel global (se cancelan entre cuentas),
 * por eso no afectan el balance total del dashboard.
 */
export function computeAccountBalances(
  accounts: Account[],
  transactions: Transaction[],
  transfers: Transfer[],
): Map<string, number> {
  const balances = new Map<string, number>(accounts.map((a) => [a.id, a.initial_balance]));

  for (const t of transactions) {
    const current = balances.get(t.account_id) ?? 0;
    balances.set(t.account_id, current + (t.type === "income" ? t.amount : -t.amount));
  }

  for (const tr of transfers) {
    const fromBalance = balances.get(tr.from_account_id) ?? 0;
    balances.set(tr.from_account_id, fromBalance - tr.amount);
    const toBalance = balances.get(tr.to_account_id) ?? 0;
    balances.set(tr.to_account_id, toBalance + tr.amount);
  }

  return balances;
}
