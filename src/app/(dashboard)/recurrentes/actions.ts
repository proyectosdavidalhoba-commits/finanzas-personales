"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Frequency, TransactionType } from "@/lib/types";

export type RecurringInput = {
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  frequency: Frequency;
  next_date: string;
  active: boolean;
};

export async function createRecurring(input: RecurringInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("recurring_templates").insert({ user_id: user.id, ...input });
  if (error) throw new Error(error.message);
  revalidatePath("/recurrentes");
}

export async function updateRecurring(id: string, input: RecurringInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_templates").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/recurrentes");
}

export async function deleteRecurring(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_templates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/recurrentes");
}
