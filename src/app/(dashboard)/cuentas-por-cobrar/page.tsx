import { createClient } from "@/lib/supabase/server";
import { InvoiceManager } from "@/components/InvoiceManager";
import type {
  Account,
  Category,
  Invoice,
  InvoiceItem,
  InvoicePayment,
  InvoiceStatus,
  InvoiceWithDetails,
} from "@/lib/types";

function statusFor(total: number, paid: number): InvoiceStatus {
  if (paid <= 0) return "pending";
  if (paid >= total) return "paid";
  return "partial";
}

export default async function CuentasPorCobrarPage() {
  const supabase = await createClient();

  const [{ data: invoices }, { data: items }, { data: payments }, { data: accounts }, { data: categories }] =
    await Promise.all([
      supabase.from("invoices").select("*").order("date", { ascending: false }),
      supabase.from("invoice_items").select("*"),
      supabase.from("invoice_payments").select("*"),
      supabase.from("accounts").select("*").order("name"),
      supabase.from("categories").select("*").eq("type", "income").order("name"),
    ]);

  const itemsByInvoice = new Map<string, InvoiceItem[]>();
  for (const item of (items as InvoiceItem[]) ?? []) {
    const list = itemsByInvoice.get(item.invoice_id) ?? [];
    list.push(item);
    itemsByInvoice.set(item.invoice_id, list);
  }

  const paymentsByInvoice = new Map<string, InvoicePayment[]>();
  for (const payment of (payments as InvoicePayment[]) ?? []) {
    const list = paymentsByInvoice.get(payment.invoice_id) ?? [];
    list.push(payment);
    paymentsByInvoice.set(payment.invoice_id, list);
  }

  const invoicesWithDetails: InvoiceWithDetails[] = ((invoices as Invoice[]) ?? []).map((invoice) => {
    const invoiceItems = itemsByInvoice.get(invoice.id) ?? [];
    const invoicePayments = paymentsByInvoice.get(invoice.id) ?? [];
    const total = invoiceItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const paid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
    return {
      ...invoice,
      items: invoiceItems,
      payments: invoicePayments,
      total,
      paid,
      remaining: total - paid,
      status: statusFor(total, paid),
    };
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-50">Cuentas por cobrar</h1>
      <InvoiceManager
        invoices={invoicesWithDetails}
        accounts={(accounts as Account[]) ?? []}
        incomeCategories={(categories as Category[]) ?? []}
      />
    </div>
  );
}
