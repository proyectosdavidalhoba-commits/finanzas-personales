"use client";

import { useState, useTransition } from "react";
import type { Supplier } from "@/lib/types";
import { createSupplier, updateSupplier, deleteSupplier } from "@/app/(dashboard)/proveedores/actions";

export function SupplierManager({ suppliers }: { suppliers: Supplier[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");

  function resetForm() {
    setName("");
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (editingId) await updateSupplier(editingId, name);
        else await createSupplier(name);
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  function handleEdit(supplier: Supplier) {
    setEditingId(supplier.id);
    setName(supplier.name);
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este proveedor?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteSupplier(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-200">Proveedores</p>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300">Nombre</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {editingId ? "Guardar cambios" : "Agregar proveedor"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} className="text-sm text-slate-400 hover:underline">
            Cancelar
          </button>
        )}
      </form>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {suppliers.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Sin proveedores todavía.</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {suppliers.map((supplier) => (
            <li
              key={supplier.id}
              className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200"
            >
              {supplier.name}
              <button onClick={() => handleEdit(supplier)} className="text-xs text-indigo-400 hover:underline">
                Editar
              </button>
              <button onClick={() => handleDelete(supplier.id)} className="text-xs text-red-400 hover:underline">
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
