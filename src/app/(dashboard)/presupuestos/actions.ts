"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BudgetInput = { category_id: string; month: string; amount_limit: number };

export async function createBudget(input: BudgetInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("budgets").insert({ user_id: user.id, ...input });
  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe un presupuesto para esa categoría en ese mes. Edítalo en vez de crear otro.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/presupuestos");
}

export async function updateBudget(id: string, input: BudgetInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/presupuestos");
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/presupuestos");
}
