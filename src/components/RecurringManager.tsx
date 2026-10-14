"use client";

import { useMemo, useState, useTransition } from "react";
import type { Account, Category, Frequency, RecurringTemplate, TransactionType } from "@/lib/types";
import {
  createRecurring,
  updateRecurring,
  deleteRecurring,
  type RecurringInput,
} from "@/app/(dashboard)/recurrentes/actions";

const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(accounts: Account[], categories: Category[]): RecurringInput {
  const firstExpenseCategory = categories.find((c) => c.type === "expense");
  return {
    account_id: accounts[0]?.id ?? "",
    category_id: firstExpenseCategory?.id ?? categories[0]?.id ?? "",
    type: "expense",
    amount: 0,
    description: "",
    frequency: "monthly",
    next_date: todayStr(),
    active: true,
  };
}

export function RecurringManager({
  templates,
  accounts,
  categories,
}: {
  templates: RecurringTemplate[];
  accounts: Account[];
  categories: Category[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RecurringInput>(() => emptyForm(accounts, categories));

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const categoriesForType = categories.filter((c) => c.type === form.type);
  const hasData = accounts.length > 0 && categories.length > 0;

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
        if (editingId) await updateRecurring(editingId, form);
        else await createRecurring(form);
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  function handleEdit(r: RecurringTemplate) {
    setEditingId(r.id);
    setForm({
      account_id: r.account_id,
      category_id: r.category_id,
      type: r.type,
      amount: r.amount,
      description: r.description,
      frequency: r.frequency,
      next_date: r.next_date,
      active: r.active,
    });
  }

  function handleToggleActive(r: RecurringTemplate) {
    startTransition(async () => {
      try {
        await updateRecurring(r.id, {
          account_id: r.account_id,
          category_id: r.category_id,
          type: r.type,
          amount: r.amount,
          description: r.description,
          frequency: r.frequency,
          next_date: r.next_date,
          active: !r.active,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta transacción recurrente?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteRecurring(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <div className="space-y-6">
      <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">
        Las transacciones recurrentes se generan automáticamente en “Transacciones” la próxima vez que abras la app, si ya llegó su fecha.
      </p>

      {!hasData && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Crea primero al menos una cuenta y una categoría.
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-7">
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
          <label className="block text-xs font-medium text-slate-600">Frecuencia</label>
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Próxima fecha</label>
          <input
            type="date"
            required
            value={form.next_date}
            onChange={(e) => setForm({ ...form, next_date: e.target.value })}
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
            {editingId ? "Guardar cambios" : "Agregar recurrente"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm text-slate-500 hover:underline">
              Cancelar
            </button>
          )}
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-4 py-2">Activa</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Cuenta</th>
              <th className="px-4 py-2">Frecuencia</th>
              <th className="px-4 py-2">Próxima fecha</th>
              <th className="px-4 py-2 text-right">Monto</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Sin transacciones recurrentes.
                </td>
              </tr>
            ) : (
              templates.map((r) => {
                const category = categoryById.get(r.category_id);
                const account = accountById.get(r.account_id);
                return (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <input type="checkbox" checked={r.active} onChange={() => handleToggleActive(r)} />
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category?.color }} />
                        {category?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-500">{account?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-500">{FREQUENCY_LABELS[r.frequency]}</td>
                    <td className="px-4 py-2 text-slate-500">{r.next_date}</td>
                    <td className={`px-4 py-2 text-right font-medium ${r.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                      {r.type === "income" ? "+" : "-"}${r.amount.toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-2 text-right text-xs">
                      <button onClick={() => handleEdit(r)} className="mr-2 text-indigo-600 hover:underline">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:underline">
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
