"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TransactionType } from "@/lib/types";

export async function createCategory(input: { name: string; type: TransactionType; color: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: input.name,
    type: input.type,
    color: input.color,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/categorias");
}

export async function updateCategory(
  id: string,
  input: { name: string; type: TransactionType; color: string },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/categorias");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar: hay transacciones, presupuestos o recurrentes usando esta categoría.",
      );
    }
    throw new Error(error.message);
  }
  revalidatePath("/categorias");
}
