"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TransferInput = {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description: string;
  date: string;
};

function assertDifferentAccounts(input: TransferInput) {
  if (input.from_account_id === input.to_account_id) {
    throw new Error("La cuenta de origen y destino deben ser diferentes.");
  }
}

export async function createTransfer(input: TransferInput) {
  assertDifferentAccounts(input);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("transfers").insert({ user_id: user.id, ...input });
  if (error) throw new Error(error.message);
  revalidatePath("/transacciones");
  revalidatePath("/cuentas");
}

export async function updateTransfer(id: string, input: TransferInput) {
  assertDifferentAccounts(input);
  const supabase = await createClient();
  const { error } = await supabase.from("transfers").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/transacciones");
  revalidatePath("/cuentas");
}

export async function deleteTransfer(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("transfers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/transacciones");
  revalidatePath("/cuentas");
}
