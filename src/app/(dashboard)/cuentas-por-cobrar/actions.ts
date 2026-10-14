"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceItemInput } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/cuentas-por-cobrar");
  revalidatePath("/transacciones");
  revalidatePath("/cuentas");
  revalidatePath("/presupuestos");
  revalidatePath("/");
}

export async function createInvoice(input: { client_name: string; date: string; items: InvoiceItemInput[] }) {
  if (input.items.length === 0) throw new Error("La factura debe tener al menos un producto.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({ user_id: user.id, client_name: input.client_name, date: input.date })
    .select()
    .single();
  if (invoiceError) throw new Error(invoiceError.message);

  const { error: itemsError } = await supabase.from("invoice_items").insert(
    input.items.map((item) => ({ user_id: user.id, invoice_id: invoice.id, ...item })),
  );
  if (itemsError) throw new Error(itemsError.message);

  revalidateAll();
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("invoice_payments")
    .select("transaction_id")
    .eq("invoice_id", id);

  const transactionIds = (payments ?? []).map((p) => p.transaction_id).filter((v): v is string => Boolean(v));
  if (transactionIds.length > 0) {
    const { error: txError } = await supabase.from("transactions").delete().in("id", transactionIds);
    if (txError) throw new Error(txError.message);
  }

  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateAll();
}

export async function addInvoiceItem(invoiceId: string, item: InvoiceItemInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("invoice_items")
    .insert({ user_id: user.id, invoice_id: invoiceId, ...item });
  if (error) throw new Error(error.message);
  revalidateAll();
}

export async function deleteInvoiceItem(id: string) {
  const supabase = await createClient();

  const { data: item } = await supabase.from("invoice_items").select("invoice_id, quantity, unit_price").eq("id", id).single();
  if (!item) throw new Error("Producto no encontrado");

  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase.from("invoice_items").select("quantity, unit_price").eq("invoice_id", item.invoice_id),
    supabase.from("invoice_payments").select("amount").eq("invoice_id", item.invoice_id),
  ]);

  const total = (items ?? []).reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const paid = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);
  const totalAfterDelete = total - item.quantity * item.unit_price;

  if (totalAfterDelete < paid - 0.01) {
    throw new Error(
      `No se puede quitar: ya se registraron pagos por $${paid.toLocaleString("es-CO")} sobre esta factura, y el nuevo total ($${totalAfterDelete.toLocaleString("es-CO")}) quedaría por debajo de eso. Elimina primero el pago correspondiente.`,
    );
  }

  const { error } = await supabase.from("invoice_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAll();
}

export type RegisterPaymentInput = {
  account_id: string;
  category_id: string;
  amount: number;
  date: string;
};

export async function registerPayment(invoiceId: string, input: RegisterPaymentInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const [{ data: invoice }, { data: items }, { data: payments }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", invoiceId).single(),
    supabase.from("invoice_items").select("quantity, unit_price").eq("invoice_id", invoiceId),
    supabase.from("invoice_payments").select("amount").eq("invoice_id", invoiceId),
  ]);
  if (!invoice) throw new Error("Factura no encontrada");

  const total = (items ?? []).reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const paid = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - paid;

  if (input.amount <= 0) throw new Error("El monto debe ser mayor a cero.");
  if (input.amount > remaining + 0.01) {
    throw new Error(`El pago (${input.amount}) supera el saldo pendiente (${remaining.toLocaleString("es-CO")}).`);
  }

  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      account_id: input.account_id,
      category_id: input.category_id,
      type: "income",
      amount: input.amount,
      description: `Pago factura - ${invoice.client_name}`,
      date: input.date,
    })
    .select()
    .single();
  if (txError) throw new Error(txError.message);

  const { error: paymentError } = await supabase.from("invoice_payments").insert({
    user_id: user.id,
    invoice_id: invoiceId,
    account_id: input.account_id,
    category_id: input.category_id,
    transaction_id: transaction.id,
    amount: input.amount,
    date: input.date,
  });
  if (paymentError) throw new Error(paymentError.message);

  revalidateAll();
}

export async function deletePayment(id: string) {
  const supabase = await createClient();

  const { data: payment } = await supabase.from("invoice_payments").select("transaction_id").eq("id", id).single();

  if (payment?.transaction_id) {
    const { error: txError } = await supabase.from("transactions").delete().eq("id", payment.transaction_id);
    if (txError) throw new Error(txError.message);
  }

  const { error } = await supabase.from("invoice_payments").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateAll();
}
