"use client";

import { useMemo, useState, useTransition } from "react";
import type { Account, Category, Transaction, TransactionType } from "@/lib/types";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type TransactionInput,
} from "@/app/(dashboard)/transacciones/actions";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(accounts: Account[], categories: Category[]): TransactionInput {
  const firstExpenseCategory = categories.find((c) => c.type === "expense");
  return {
    account_id: accounts[0]?.id ?? "",
    category_id: firstExpenseCategory?.id ?? categories[0]?.id ?? "",
    type: "expense",
    amount: 0,
    description: "",
    date: todayStr(),
  };
}

export function TransactionManager({
  transactions,
  accounts,
  categories,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TransactionInput>(() => emptyForm(accounts, categories));
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const categoriesForType = categories.filter((c) => c.type === form.type);

  const filtered = transactions.filter((t) => {
    if (filterAccount !== "all" && t.account_id !== filterAccount) return false;
    if (filterCategory !== "all" && t.category_id !== filterCategory) return false;
    return true;
  });

  function resetForm() {
    setForm(emptyForm(accounts, categories));
    setEditingId(null);
  }

  function handleTypeChange(type: TransactionType) {
    const firstCategory = categories.find((c) => c.type === type);
    setForm({ ...form, type, category_id: firstCategory?.id ?? "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.account_id || !form.category_id) {
      setError("Primero debes crear al menos una cuenta y una categoría.");
      return;
    }
    startTransition(async () => {
      try {
        if (editingId) await updateTransaction(editingId, form);
        else await createTransaction(form);
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  function handleEdit(t: Transaction) {
    setEditingId(t.id);
    setForm({
      account_id: t.account_id,
      category_id: t.category_id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      date: t.date,
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta transacción?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteTransaction(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  const hasData = accounts.length > 0 && categories.length > 0;

  return (
    <div className="space-y-6">
      {!hasData && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Crea primero al menos una cuenta y una categoría para poder registrar transacciones.
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <label className="block text-xs font-medium text-slate-600">Tipo</label>
          <select
            value={form.type}
            onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="income">Ingreso</option>
            <option value="expense">Egreso</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Cuenta</label>
          <select
            required
            value={form.account_id}
            onChange={(e) => setForm({ ...form, account_id: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Categoría</label>
          <select
            required
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            {categoriesForType.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Monto</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Fecha</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Descripción</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>

        <div className="col-span-full flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || !hasData}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {editingId ? "Guardar cambios" : "Agregar transacción"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm text-slate-500 hover:underline">
              Cancelar
            </button>
          )}
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="all">Todas las cuentas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="all">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Cuenta</th>
              <th className="px-4 py-2">Descripción</th>
              <th className="px-4 py-2 text-right">Monto</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Sin transacciones.
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const category = categoryById.get(t.category_id);
                const account = accountById.get(t.account_id);
                return (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-500">{t.date}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category?.color }} />
                        {category?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-500">{account?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-500">{t.description}</td>
                    <td className={`px-4 py-2 text-right font-medium ${t.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "-"}${t.amount.toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-2 text-right text-xs">
                      <button onClick={() => handleEdit(t)} className="mr-2 text-indigo-600 hover:underline">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:underline">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
