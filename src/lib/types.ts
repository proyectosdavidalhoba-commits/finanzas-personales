export type TransactionType = "income" | "expense";
export type Frequency = "weekly" | "monthly" | "yearly";

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  color: string;
  created_at: string;
};

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  initial_balance: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  recurring_template_id: string | null;
  created_at: string;
};

export type RecurringTemplate = {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  frequency: Frequency;
  next_date: string;
  active: boolean;
  created_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  amount_limit: number;
  created_at: string;
};

export type Transfer = {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
};

export type Invoice = {
  id: string;
  user_id: string;
  client_name: string;
  date: string;
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  user_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
};

export type InvoicePayment = {
  id: string;
  invoice_id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  transaction_id: string | null;
  amount: number;
  date: string;
  created_at: string;
};

export type InvoiceStatus = "pending" | "partial" | "paid";

export type InvoiceItemInput = { product_name: string; quantity: number; unit_price: number };

export type InvoiceWithDetails = Invoice & {
  items: InvoiceItem[];
  payments: InvoicePayment[];
  total: number;
  paid: number;
  remaining: number;
  status: InvoiceStatus;
};

export type PaymentType = "cash" | "credit";

export type Supplier = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Purchase = {
  id: string;
  user_id: string;
  supplier_id: string;
  date: string;
  payment_type: PaymentType;
  created_at: string;
};

export type PurchaseItem = {
  id: string;
  purchase_id: string;
  user_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
};

export type PurchasePayment = {
  id: string;
  purchase_id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  transaction_id: string | null;
  amount: number;
  date: string;
  created_at: string;
};

export type PurchaseWithDetails = Purchase & {
  items: PurchaseItem[];
  payments: PurchasePayment[];
  total: number;
  paid: number;
  remaining: number;
  status: InvoiceStatus;
};
