"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AccountInput = { name: string; type: string; initial_balance: number };

export async function createAccount(input: AccountInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("accounts").insert({ user_id: user.id, ...input });
  if (error) throw new Error(error.message);
  revalidatePath("/cuentas");
}

export async function updateAccount(id: string, input: AccountInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/cuentas");
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error("No se puede eliminar: hay transacciones o recurrentes usando esta cuenta.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/cuentas");
}
