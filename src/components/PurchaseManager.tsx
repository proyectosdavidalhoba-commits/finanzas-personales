"use client";

import { useState, useTransition } from "react";
import type { Account, Category, InvoiceItemInput, PaymentType, PurchaseWithDetails, Supplier } from "@/lib/types";
import { createPurchase } from "@/app/(dashboard)/proveedores/actions";
import { PurchaseCard } from "@/components/PurchaseCard";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function emptyItem(): InvoiceItemInput {
  return { product_name: "", quantity: 1, unit_price: 0 };
}

export function PurchaseManager({
  purchases,
  suppliers,
  accounts,
  expenseCategories,
}: {
  purchases: PurchaseWithDetails[];
  suppliers: Supplier[];
  accounts: Account[];
  expenseCategories: Category[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [date, setDate] = useState(todayStr());
  const [items, setItems] = useState<InvoiceItemInput[]>([emptyItem()]);
  const [paymentType, setPaymentType] = useState<PaymentType>("credit");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id ?? "");

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const hasData = suppliers.length > 0;

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
    setSupplierId(suppliers[0]?.id ?? "");
    setDate(todayStr());
    setItems([emptyItem()]);
    setPaymentType("credit");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validItems = items.filter((i) => i.product_name.trim() && i.quantity > 0 && i.unit_price > 0);
    if (validItems.length === 0) {
      setError("Agrega al menos un producto con cantidad y precio válidos.");
      return;
    }
    if (paymentType === "cash" && (!accountId || !categoryId)) {
      setError("Para una compra de contado elige cuenta y categoría.");
      return;
    }
    startTransition(async () => {
      try {
        await createPurchase({
          supplier_id: supplierId,
          date,
          items: validItems,
          payment_type: paymentType,
          account_id: paymentType === "cash" ? accountId : undefined,
          category_id: paymentType === "cash" ? categoryId : undefined,
        });
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <div className="space-y-6">
      {!hasData && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Crea primero al menos un proveedor para poder registrar compras.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300">Proveedor</label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="mt-1 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-1.5 text-sm"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
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
          <div>
            <label className="block text-xs font-medium text-slate-300">Tipo de pago</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              className="mt-1 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-1.5 text-sm"
            >
              <option value="credit">Crédito (queda pendiente)</option>
              <option value="cash">Contado (se paga ya)</option>
            </select>
          </div>
          {paymentType === "cash" && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300">Cuenta de pago</label>
                <select
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="mt-1 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-1.5 text-sm"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300">Categoría</label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-1.5 text-sm"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
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
            Total compra: ${total.toLocaleString("es-CO")}
          </span>
          <button
            type="submit"
            disabled={isPending || !hasData}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            Crear compra
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-3">
        {purchases.length === 0 ? (
          <p className="text-sm text-slate-500">Sin compras a proveedores todavía.</p>
        ) : (
          purchases.map((purchase) => (
            <PurchaseCard
              key={purchase.id}
              purchase={purchase}
              supplierName={suppliers.find((s) => s.id === purchase.supplier_id)?.name ?? "—"}
              accounts={accounts}
              expenseCategories={expenseCategories}
            />
          ))
        )}
      </div>
    </div>
  );
}
