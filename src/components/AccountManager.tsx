"use client";

import { useState, useTransition } from "react";
import type { Account } from "@/lib/types";
import { createAccount, updateAccount, deleteAccount, type AccountInput } from "@/app/(dashboard)/cuentas/actions";

const ACCOUNT_TYPES = ["efectivo", "banco", "tarjeta"];

export function AccountManager({
  accounts,
  balances,
}: {
  accounts: Account[];
  balances: Record<string, number>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AccountInput>({ name: "", type: "efectivo", initial_balance: 0 });

  const totalBalance = accounts.reduce((sum, a) => sum + (balances[a.id] ?? a.initial_balance), 0);

  function resetForm() {
    setForm({ name: "", type: "efectivo", initial_balance: 0 });
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (editingId) await updateAccount(editingId, form);
        else await createAccount(form);
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  function handleEdit(account: Account) {
    setEditingId(account.id);
    setForm({ name: account.name, type: account.type, initial_balance: account.initial_balance });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta cuenta?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteAccount(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-slate-600">Nombre</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Tipo</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Saldo inicial</label>
          <input
            type="number"
            step="0.01"
            value={form.initial_balance}
            onChange={(e) => setForm({ ...form, initial_balance: Number(e.target.value) })}
            className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {editingId ? "Guardar cambios" : "Agregar cuenta"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} className="text-sm text-slate-500 hover:underline">
            Cancelar
          </button>
        )}
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        {accounts.length === 0 ? (
          <p className="text-sm text-slate-400">Sin cuentas todavía.</p>
        ) : (
          <>
            <ul className="space-y-2">
              {accounts.map((account) => {
                const currentBalance = balances[account.id] ?? account.initial_balance;
                return (
                  <li key={account.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50">
                    <div className="text-sm text-slate-700">
                      <span className="font-medium">{account.name}</span>{" "}
                      <span className="text-slate-400">
                        · {account.type} · saldo inicial ${account.initial_balance.toLocaleString("es-CO")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-semibold ${currentBalance < 0 ? "text-red-500" : "text-emerald-600"}`}>
                        Saldo actual: ${currentBalance.toLocaleString("es-CO")}
                      </span>
                      <div className="flex gap-2 text-xs">
                        <button onClick={() => handleEdit(account)} className="text-indigo-600 hover:underline">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(account.id)} className="text-red-500 hover:underline">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 px-2 pt-3">
              <span className="text-sm font-semibold text-slate-700">Total</span>
              <span className={`text-sm font-semibold ${totalBalance < 0 ? "text-red-500" : "text-emerald-600"}`}>
                ${totalBalance.toLocaleString("es-CO")}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
