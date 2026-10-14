"use client";

import { useMemo, useState, useTransition } from "react";
import type { Budget, Category, Transaction } from "@/lib/types";
import { createBudget, updateBudget, deleteBudget, type BudgetInput } from "@/app/(dashboard)/presupuestos/actions";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function BudgetManager({
  budgets,
  categories,
  transactions,
}: {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
}) {
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonth());
  const [form, setForm] = useState<BudgetInput>({
    category_id: expenseCategories[0]?.id ?? "",
    month: currentMonth(),
    amount_limit: 0,
  });

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const spentByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense" || !t.date.startsWith(month)) continue;
      totals.set(t.category_id, (totals.get(t.category_id) ?? 0) + t.amount);
    }
    return totals;
  }, [transactions, month]);

  const budgetsForMonth = budgets.filter((b) => b.month === month);

  function resetForm() {
    setForm({ category_id: expenseCategories[0]?.id ?? "", month, amount_limit: 0 });
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (editingId) await updateBudget(editingId, form);
        else await createBudget(form);
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  function handleEdit(b: Budget) {
    setEditingId(b.id);
    setForm({ category_id: b.category_id, month: b.month, amount_limit: b.amount_limit });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este presupuesto?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteBudget(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-medium text-slate-600">Mes</label>
        <input
          type="month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setForm((f) => ({ ...f, month: e.target.value }));
            setEditingId(null);
          }}
          className="mt-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      {expenseCategories.length === 0 ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Crea primero alguna categoría de egreso para poder definir presupuestos.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div>
            <label className="block text-xs font-medium text-slate-600">Categoría</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Límite mensual</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.amount_limit}
              onChange={(e) => setForm({ ...form, amount_limit: Number(e.target.value) })}
              className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {editingId ? "Guardar cambios" : "Agregar presupuesto"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm text-slate-500 hover:underline">
              Cancelar
            </button>
          )}
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {budgetsForMonth.length === 0 ? (
          <p className="text-sm text-slate-400">Sin presupuestos para este mes.</p>
        ) : (
          budgetsForMonth.map((b) => {
            const category = categoryById.get(b.category_id);
            const spent = spentByCategory.get(b.category_id) ?? 0;
            const pct = Math.min(100, Math.round((spent / b.amount_limit) * 100));
            const over = spent > b.amount_limit;
            return (
              <div key={b.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category?.color }} />
                    {category?.name ?? "—"}
                  </span>
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => handleEdit(b)} className="text-indigo-600 hover:underline">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:underline">
                      Eliminar
                    </button>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${over ? "bg-red-500" : "bg-indigo-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className={`mt-1 text-xs ${over ? "text-red-600" : "text-slate-500"}`}>
                  ${spent.toLocaleString("es-CO")} de ${b.amount_limit.toLocaleString("es-CO")} ({pct}%)
                  {over && " — presupuesto excedido"}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
