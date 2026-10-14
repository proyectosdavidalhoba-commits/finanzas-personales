"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TransactionType } from "@/lib/types";

export type TransactionInput = {
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
};

export async function createTransaction(input: TransactionInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("transactions").insert({ user_id: user.id, ...input });
  if (error) throw new Error(error.message);
  revalidatePath("/transacciones");
  revalidatePath("/");
  revalidatePath("/presupuestos");
}

export async function updateTransaction(id: string, input: TransactionInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/transacciones");
  revalidatePath("/");
  revalidatePath("/presupuestos");
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/transacciones");
  revalidatePath("/");
  revalidatePath("/presupuestos");
}
