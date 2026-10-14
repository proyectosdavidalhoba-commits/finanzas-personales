import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/CategoryManager";
import type { Category } from "@/lib/types";

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-50">Categorías</h1>
      <CategoryManager categories={(categories as Category[]) ?? []} />
    </div>
  );
}
