"use client";

import { useState, useTransition } from "react";
import type { Account, Category, InvoiceItemInput, InvoiceWithDetails } from "@/lib/types";
import { createInvoice } from "@/app/(dashboard)/cuentas-por-cobrar/actions";
import { InvoiceCard } from "@/components/InvoiceCard";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function emptyItem(): InvoiceItemInput {
  return { product_name: "", quantity: 1, unit_price: 0 };
}

export function InvoiceManager({
  invoices,
  accounts,
  incomeCategories,
}: {
  invoices: InvoiceWithDetails[];
  accounts: Account[];
  incomeCategories: Category[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [date, setDate] = useState(todayStr());
  const [items, setItems] = useState<InvoiceItemInput[]>([emptyItem()]);

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  function updateItem(index: number, patch: Partial<InvoiceItemInput>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addRow() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeRow(index: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function resetForm() {
    setClientName("");
    setDate(todayStr());
    setItems([emptyItem()]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validItems = items.filter((i) => i.product_name.trim() && i.quantity > 0 && i.unit_price > 0);
    if (validItems.length === 0) {
      setError("Agrega al menos un producto con cantidad y precio válidos.");
      return;
    }
    startTransition(async () => {
      try {
        await createInvoice({ client_name: clientName, date, items: validItems });
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300">Cliente</label>
            <input
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300">Fecha</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-300">Productos</p>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400">Producto</label>
                <input
                  value={item.product_name}
                  onChange={(e) => updateItem(index, { product_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400">Unidades</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400">Precio unitario</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, { unit_price: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-300">
                  ${(item.quantity * item.unit_price).toLocaleString("es-CO")}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  disabled={items.length === 1}
                  className="text-xs text-red-400 hover:underline disabled:opacity-30"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addRow} className="text-xs font-medium text-indigo-400 hover:underline">
            + Agregar producto
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-slate-700 pt-3">
          <span className="text-sm font-semibold text-slate-200">
            Total factura: ${total.toLocaleString("es-CO")}
          </span>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            Crear factura
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-3">
        {invoices.length === 0 ? (
          <p className="text-sm text-slate-500">Sin cuentas por cobrar todavía.</p>
        ) : (
          invoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} accounts={accounts} incomeCategories={incomeCategories} />
          ))
        )}
      </div>
    </div>
  );
}
