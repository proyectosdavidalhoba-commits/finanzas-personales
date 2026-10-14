"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceItemInput, PaymentType } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/proveedores");
  revalidatePath("/transacciones");
  revalidatePath("/cuentas");
  revalidatePath("/presupuestos");
  revalidatePath("/");
}

// ============ PROVEEDORES ============

export async function createSupplier(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("suppliers").insert({ user_id: user.id, name });
  if (error) throw new Error(error.message);
  revalidatePath("/proveedores");
}

export async function updateSupplier(id: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/proveedores");
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error("No se puede eliminar: hay compras registradas a este proveedor.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/proveedores");
}

// ============ COMPRAS ============

export type CreatePurchaseInput = {
  supplier_id: string;
  date: string;
  items: InvoiceItemInput[];
  payment_type: PaymentType;
  account_id?: string;
  category_id?: string;
};

export async function createPurchase(input: CreatePurchaseInput) {
  if (input.items.length === 0) throw new Error("La compra debe tener al menos un producto.");
  if (input.payment_type === "cash" && (!input.account_id || !input.category_id)) {
    throw new Error("Para una compra de contado debes elegir cuenta y categoría.");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      user_id: user.id,
      supplier_id: input.supplier_id,
      date: input.date,
      payment_type: input.payment_type,
    })
    .select()
    .single();
  if (purchaseError) throw new Error(purchaseError.message);

  const { error: itemsError } = await supabase.from("purchase_items").insert(
    input.items.map((item) => ({ user_id: user.id, purchase_id: purchase.id, ...item })),
  );
  if (itemsError) throw new Error(itemsError.message);

  if (input.payment_type === "cash") {
    const total = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const { data: supplier } = await supabase.from("suppliers").select("name").eq("id", input.supplier_id).single();

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        account_id: input.account_id,
        category_id: input.category_id,
        type: "expense",
        amount: total,
        description: `Compra de contado - ${supplier?.name ?? "proveedor"}`,
        date: input.date,
      })
      .select()
      .single();
    if (txError) throw new Error(txError.message);

    const { error: paymentError } = await supabase.from("purchase_payments").insert({
      user_id: user.id,
      purchase_id: purchase.id,
      account_id: input.account_id,
      category_id: input.category_id,
      transaction_id: transaction.id,
      amount: total,
      date: input.date,
    });
    if (paymentError) throw new Error(paymentError.message);
  }

  revalidateAll();
}

export async function deletePurchase(id: string) {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("purchase_payments")
    .select("transaction_id")
    .eq("purchase_id", id);

  const transactionIds = (payments ?? []).map((p) => p.transaction_id).filter((v): v is string => Boolean(v));
  if (transactionIds.length > 0) {
    const { error: txError } = await supabase.from("transactions").delete().in("id", transactionIds);
    if (txError) throw new Error(txError.message);
  }

  const { error } = await supabase.from("purchases").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateAll();
}

export async function addPurchaseItem(purchaseId: string, item: InvoiceItemInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("purchase_items")
    .insert({ user_id: user.id, purchase_id: purchaseId, ...item });
  if (error) throw new Error(error.message);
  revalidateAll();
}

export async function deletePurchaseItem(id: string) {
  const supabase = await createClient();

  const { data: item } = await supabase.from("purchase_items").select("purchase_id, quantity, unit_price").eq("id", id).single();
  if (!item) throw new Error("Producto no encontrado");

  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase.from("purchase_items").select("quantity, unit_price").eq("purchase_id", item.purchase_id),
    supabase.from("purchase_payments").select("amount").eq("purchase_id", item.purchase_id),
  ]);

  const total = (items ?? []).reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const paid = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);
  const totalAfterDelete = total - item.quantity * item.unit_price;

  if (totalAfterDelete < paid - 0.01) {
    throw new Error(
      `No se puede quitar: ya se registraron pagos por $${paid.toLocaleString("es-CO")} sobre esta compra, y el nuevo total ($${totalAfterDelete.toLocaleString("es-CO")}) quedaría por debajo de eso. Elimina primero el pago correspondiente.`,
    );
  }

  const { error } = await supabase.from("purchase_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAll();
}

export type RegisterPaymentInput = {
  account_id: string;
  category_id: string;
  amount: number;
  date: string;
};

export async function registerPayment(purchaseId: string, input: RegisterPaymentInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const [{ data: purchase }, { data: items }, { data: payments }] = await Promise.all([
    supabase.from("purchases").select("*").eq("id", purchaseId).single(),
    supabase.from("purchase_items").select("quantity, unit_price").eq("purchase_id", purchaseId),
    supabase.from("purchase_payments").select("amount").eq("purchase_id", purchaseId),
  ]);
  if (!purchase) throw new Error("Compra no encontrada");

  const { data: supplier } = await supabase.from("suppliers").select("name").eq("id", purchase.supplier_id).single();

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
      type: "expense",
      amount: input.amount,
      description: `Pago a proveedor - ${supplier?.name ?? "proveedor"}`,
      date: input.date,
    })
    .select()
    .single();
  if (txError) throw new Error(txError.message);

  const { error: paymentError } = await supabase.from("purchase_payments").insert({
    user_id: user.id,
    purchase_id: purchaseId,
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

  const { data: payment } = await supabase.from("purchase_payments").select("transaction_id").eq("id", id).single();

  if (payment?.transaction_id) {
    const { error: txError } = await supabase.from("transactions").delete().eq("id", payment.transaction_id);
    if (txError) throw new Error(txError.message);
  }

  const { error } = await supabase.from("purchase_payments").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateAll();
}
