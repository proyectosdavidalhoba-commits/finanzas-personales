import { createClient } from "@/lib/supabase/server";
import { PurchaseManager } from "@/components/PurchaseManager";
import { SupplierManager } from "@/components/SupplierManager";
import type {
  Account,
  Category,
  InvoiceStatus,
  Purchase,
  PurchaseItem,
  PurchasePayment,
  PurchaseWithDetails,
  Supplier,
} from "@/lib/types";

function statusFor(total: number, paid: number): InvoiceStatus {
  if (paid <= 0) return "pending";
  if (paid >= total) return "paid";
  return "partial";
}

export default async function ProveedoresPage() {
  const supabase = await createClient();

  const [
    { data: suppliers },
    { data: purchases },
    { data: items },
    { data: payments },
    { data: accounts },
    { data: categories },
  ] = await Promise.all([
    supabase.from("suppliers").select("*").order("name"),
    supabase.from("purchases").select("*").order("date", { ascending: false }),
    supabase.from("purchase_items").select("*"),
    supabase.from("purchase_payments").select("*"),
    supabase.from("accounts").select("*").order("name"),
    supabase.from("categories").select("*").eq("type", "expense").order("name"),
  ]);

  const itemsByPurchase = new Map<string, PurchaseItem[]>();
  for (const item of (items as PurchaseItem[]) ?? []) {
    const list = itemsByPurchase.get(item.purchase_id) ?? [];
    list.push(item);
    itemsByPurchase.set(item.purchase_id, list);
  }

  const paymentsByPurchase = new Map<string, PurchasePayment[]>();
  for (const payment of (payments as PurchasePayment[]) ?? []) {
    const list = paymentsByPurchase.get(payment.purchase_id) ?? [];
    list.push(payment);
    paymentsByPurchase.set(payment.purchase_id, list);
  }

  const purchasesWithDetails: PurchaseWithDetails[] = ((purchases as Purchase[]) ?? []).map((purchase) => {
    const purchaseItems = itemsByPurchase.get(purchase.id) ?? [];
    const purchasePayments = paymentsByPurchase.get(purchase.id) ?? [];
    const total = purchaseItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const paid = purchasePayments.reduce((sum, p) => sum + p.amount, 0);
    return {
      ...purchase,
      items: purchaseItems,
      payments: purchasePayments,
      total,
      paid,
      remaining: total - paid,
      status: statusFor(total, paid),
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-50">Proveedores</h1>
      <SupplierManager suppliers={(suppliers as Supplier[]) ?? []} />
      <PurchaseManager
        purchases={purchasesWithDetails}
        suppliers={(suppliers as Supplier[]) ?? []}
        accounts={(accounts as Account[]) ?? []}
        expenseCategories={(categories as Category[]) ?? []}
      />
    </div>
  );
}
