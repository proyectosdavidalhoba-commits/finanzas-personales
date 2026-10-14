"use client";

import { useMemo, useState, useTransition } from "react";
import type { Account, Category, InvoiceWithDetails } from "@/lib/types";
import {
  deleteInvoice,
  addInvoiceItem,
  deleteInvoiceItem,
  registerPayment,
  deletePayment,
  type RegisterPaymentInput,
} from "@/app/(dashboard)/cuentas-por-cobrar/actions";

const STATUS_LABEL: Record<InvoiceWithDetails["status"], string> = {
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagada",
};

const STATUS_CLASS: Record<InvoiceWithDetails["status"], string> = {
  pending: "bg-red-50 text-red-600",
  partial: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function InvoiceCard({
  invoice,
  accounts,
  incomeCategories,
}: {
  invoice: InvoiceWithDetails;
  accounts: Account[];
  incomeCategories: Category[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({ product_name: "", quantity: 1, unit_price: 0 });
  const [payment, setPayment] = useState<RegisterPaymentInput>({
    account_id: accounts[0]?.id ?? "",
    category_id: incomeCategories[0]?.id ?? "",
    amount: invoice.remaining,
    date: todayStr(),
  });

  const canRegisterPayment = useMemo(
    () => accounts.length > 0 && incomeCategories.length > 0 && invoice.remaining > 0,
    [accounts.length, incomeCategories.length, invoice.remaining],
  );

  function handleDeleteInvoice() {
    if (!confirm("¿Eliminar esta factura? También se eliminarán sus pagos y los ingresos asociados.")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteInvoice(invoice.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!newItem.product_name.trim() || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      setError("Completa producto, unidades y precio válidos.");
      return;
    }
    startTransition(async () => {
      try {
        await addInvoiceItem(invoice.id, newItem);
        setNewItem({ product_name: "", quantity: 1, unit_price: 0 });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  function handleDeleteItem(id: string) {
    if (!confirm("¿Quitar este producto de la factura?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteInvoiceItem(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  function handleRegisterPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await registerPayment(invoice.id, payment);
        setPayment((p) => ({ ...p, amount: 0 }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  function handleDeletePayment(id: string) {
    if (!confirm("¿Eliminar este pago? También se eliminará el ingreso asociado en Transacciones.")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deletePayment(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-slate-800">{invoice.client_name}</p>
          <p className="text-xs text-slate-400">{invoice.date} · {invoice.items.length} producto(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[invoice.status]}`}>
            {STATUS_LABEL[invoice.status]}
          </span>
          <span className="text-sm font-semibold text-slate-700">${invoice.total.toLocaleString("es-CO")}</span>
          <span className="text-xs text-slate-400">{expanded ? "Ocultar" : "Ver detalle"}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">Productos</p>
            <table className="w-full text-sm">
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="py-1.5 text-slate-700">{item.product_name}</td>
                    <td className="py-1.5 text-slate-500">{item.quantity} × ${item.unit_price.toLocaleString("es-CO")}</td>
                    <td className="py-1.5 text-right text-slate-700">
                      ${(item.quantity * item.unit_price).toLocaleString("es-CO")}
                    </td>
                    <td className="py-1.5 text-right">
                      <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-500 hover:underline">
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <form onSubmit={handleAddItem} className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:items-end">
              <input
                placeholder="Producto"
                value={newItem.product_name}
                onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })}
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Unidades"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Precio unitario"
                value={newItem.unit_price}
                onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
              />
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-slate-700 px-3 py-1 text-xs font-medium text-white hover:bg-slate-600 disabled:opacity-60"
              >
                + Agregar producto
              </button>
            </form>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">
              Pagos (pagado: ${invoice.paid.toLocaleString("es-CO")} · pendiente: ${invoice.remaining.toLocaleString("es-CO")})
            </p>
            {invoice.payments.length === 0 ? (
              <p className="text-xs text-slate-400">Sin pagos registrados.</p>
            ) : (
              <ul className="space-y-1">
                {invoice.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{p.date} · ${p.amount.toLocaleString("es-CO")}</span>
                    <button onClick={() => handleDeletePayment(p.id)} className="text-xs text-red-500 hover:underline">
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {canRegisterPayment ? (
              <form onSubmit={handleRegisterPayment} className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:items-end">
                <div>
                  <label className="block text-xs text-slate-500">Cuenta</label>
                  <select
                    value={payment.account_id}
                    onChange={(e) => setPayment({ ...payment, account_id: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Categoría</label>
                  <select
                    value={payment.category_id}
                    onChange={(e) => setPayment({ ...payment, category_id: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  >
                    {incomeCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={invoice.remaining}
                    value={payment.amount}
                    onChange={(e) => setPayment({ ...payment, amount: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Fecha</label>
                  <input
                    type="date"
                    value={payment.date}
                    onChange={(e) => setPayment({ ...payment, date: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="col-span-full rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60 sm:col-span-1"
                >
                  Registrar pago
                </button>
              </form>
            ) : (
              invoice.remaining <= 0 && <p className="mt-2 text-xs text-emerald-600">Factura totalmente pagada.</p>
            )}
          </div>

          <button onClick={handleDeleteInvoice} className="text-xs text-red-500 hover:underline">
            Eliminar factura completa
          </button>
        </div>
      )}
    </div>
  );
}
