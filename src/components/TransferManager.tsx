"use client";

import { useMemo, useState, useTransition } from "react";
import type { Account, Transfer } from "@/lib/types";
import {
  createTransfer,
  updateTransfer,
  deleteTransfer,
  type TransferInput,
} from "@/app/(dashboard)/transacciones/transfer-actions";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(accounts: Account[]): TransferInput {
  return {
    from_account_id: accounts[0]?.id ?? "",
    to_account_id: accounts[1]?.id ?? accounts[0]?.id ?? "",
    amount: 0,
    description: "",
    date: todayStr(),
  };
}

export function TransferManager({ transfers, accounts }: { transfers: Transfer[]; accounts: Account[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TransferInput>(() => emptyForm(accounts));

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const hasEnoughAccounts = accounts.length >= 2;

  function resetForm() {
    setForm(emptyForm(accounts));
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.from_account_id === form.to_account_id) {
      setError("La cuenta de origen y destino deben ser diferentes.");
      return;
    }
    startTransition(async () => {
      try {
        if (editingId) await updateTransfer(editingId, form);
        else await createTransfer(form);
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  function handleEdit(t: Transfer) {
    setEditingId(t.id);
    setForm({
      from_account_id: t.from_account_id,
      to_account_id: t.to_account_id,
      amount: t.amount,
      description: t.description,
      date: t.date,
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta transferencia?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteTransfer(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <div className="space-y-6">
      {!hasEnoughAccounts && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Necesitas al menos dos cuentas para poder transferir dinero entre ellas.
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <label className="block text-xs font-medium text-slate-300">De la cuenta</label>
          <select
            required
            value={form.from_account_id}
            onChange={(e) => setForm({ ...form, from_account_id: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-2 py-1.5 text-sm"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300">A la cuenta</label>
          <select
            required
            value={form.to_account_id}
            onChange={(e) => setForm({ ...form, to_account_id: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-2 py-1.5 text-sm"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300">Monto</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300">Fecha</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300">Descripción</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-2 py-1.5 text-sm"
          />
        </div>

        <div className="col-span-full flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || !hasEnoughAccounts}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {editingId ? "Guardar cambios" : "Agregar transferencia"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm text-slate-400 hover:underline">
              Cancelar
            </button>
          )}
        </div>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left text-xs text-slate-400">
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">De</th>
              <th className="px-4 py-2">A</th>
              <th className="px-4 py-2">Descripción</th>
              <th className="px-4 py-2 text-right">Monto</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {transfers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Sin transferencias.
                </td>
              </tr>
            ) : (
              transfers.map((t) => (
                <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800/60">
                  <td className="px-4 py-2 text-slate-400">{t.date}</td>
                  <td className="px-4 py-2 text-slate-200">{accountById.get(t.from_account_id)?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-200">{accountById.get(t.to_account_id)?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-400">{t.description}</td>
                  <td className="px-4 py-2 text-right font-medium text-indigo-400">
                    ${t.amount.toLocaleString("es-CO")}
                  </td>
                  <td className="px-4 py-2 text-right text-xs">
                    <button onClick={() => handleEdit(t)} className="mr-2 text-indigo-400 hover:underline">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:underline">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
