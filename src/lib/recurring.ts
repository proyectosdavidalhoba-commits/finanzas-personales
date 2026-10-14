import type { SupabaseClient } from "@supabase/supabase-js";
import type { Frequency } from "@/lib/types";

function addInterval(date: Date, frequency: Frequency): Date {
  const next = new Date(date);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Materializa en `transactions` cualquier plantilla recurrente activa cuya
 * next_date ya llegó, y avanza next_date. Se limita a 365 iteraciones por
 * plantilla para no generar un historial infinito si next_date quedó muy
 * atrasada.
 */
export async function materializeDueRecurringTransactions(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const today = toDateOnly(new Date());

  const { data: templates } = await supabase
    .from("recurring_templates")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .lte("next_date", today);

  if (!templates || templates.length === 0) return;

  for (const template of templates) {
    let cursor = new Date(template.next_date);
    const newTransactions: Array<Record<string, unknown>> = [];
    let iterations = 0;

    while (toDateOnly(cursor) <= today && iterations < 365) {
      newTransactions.push({
        user_id: userId,
        account_id: template.account_id,
        category_id: template.category_id,
        type: template.type,
        amount: template.amount,
        description: template.description,
        date: toDateOnly(cursor),
        recurring_template_id: template.id,
      });
      cursor = addInterval(cursor, template.frequency as Frequency);
      iterations++;
    }

    if (newTransactions.length > 0) {
      await supabase.from("transactions").insert(newTransactions);
      await supabase
        .from("recurring_templates")
        .update({ next_date: toDateOnly(cursor) })
        .eq("id", template.id);
    }
  }
}
