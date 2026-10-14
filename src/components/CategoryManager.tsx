"use client";

import { useState, useTransition } from "react";
import type { Category, TransactionType } from "@/lib/types";
import { createCategory, updateCategory, deleteCategory } from "@/app/(dashboard)/categorias/actions";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "expense" as TransactionType, color: "#6366f1" });

  function resetForm() {
    setForm({ name: "", type: "expense", color: "#6366f1" });
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (editingId) {
          await updateCategory(editingId, form);
        } else {
          await createCategory(form);
        }
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  function handleEdit(category: Category) {
    setEditingId(category.id);
    setForm({ name: category.name, type: category.type, color: category.color });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteCategory(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-slate-300">Nombre</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300">Tipo</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}
            className="mt-1 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="income">Ingreso</option>
            <option value="expense">Egreso</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300">Color</label>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="mt-1 h-9 w-14 rounded-lg border border-slate-600 bg-slate-800 text-slate-100"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {editingId ? "Guardar cambios" : "Agregar categoría"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} className="text-sm text-slate-400 hover:underline">
            Cancelar
          </button>
        )}
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-2">
        <CategoryGroup title="Ingresos" items={income} onEdit={handleEdit} onDelete={handleDelete} />
        <CategoryGroup title="Egresos" items={expense} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}

function CategoryGroup({
  title,
  items,
  onEdit,
  onDelete,
}: {
  title: string;
  items: Category[];
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Sin categorías todavía.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((category) => (
            <li key={category.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="text-sm text-slate-200">{category.name}</span>
              </div>
              <div className="flex gap-2 text-xs">
                <button onClick={() => onEdit(category)} className="text-indigo-400 hover:underline">
                  Editar
                </button>
                <button onClick={() => onDelete(category.id)} className="text-red-400 hover:underline">
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
