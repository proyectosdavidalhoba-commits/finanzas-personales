import { createClient } from "@/lib/supabase/server";
import { RecurringManager } from "@/components/RecurringManager";
import type { Account, Category, RecurringTemplate } from "@/lib/types";

export default async function RecurrentesPage() {
  const supabase = await createClient();

  const [{ data: templates }, { data: accounts }, { data: categories }] = await Promise.all([
    supabase.from("recurring_templates").select("*").order("next_date"),
    supabase.from("accounts").select("*").order("name"),
    supabase.from("categories").select("*").order("name"),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Transacciones recurrentes</h1>
      <RecurringManager
        templates={(templates as RecurringTemplate[]) ?? []}
        accounts={(accounts as Account[]) ?? []}
        categories={(categories as Category[]) ?? []}
      />
    </div>
  );
}
