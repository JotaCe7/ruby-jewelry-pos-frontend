export interface NamedCatalogEntry {
  id: number;
  name: string;
  is_active: boolean;
}

export interface ProductSubcategoryEntry extends NamedCatalogEntry {
  category: number;
  category_name: string;
}

export interface PaymentMethodEntry extends NamedCatalogEntry {
  is_cash: boolean;
}

export interface ContactEntry {
  id: number;
  name: string;
  tax_id: string;
  phone: string;
  email: string;
  is_active: boolean;
}

export type ReceiptType = "BOLETA" | "FACTURA" | "RECIBO" | "NONE";
export type PaymentStatus = "PREPAID" | "CASH_ON_ORDER" | "INSTALLMENTS" | "CASH_ON_DELIVERY";
export type Currency = "PEN" | "USD";

export interface ExpenseEntry {
  id: number;
  date: string;
  category: number;
  category_name: string;
  description: string;
  supplier: number | null;
  supplier_name: string | null;
  receipt_type: ReceiptType;
  payment_status: PaymentStatus;
  payment_method: number;
  payment_method_name: string;
  payment_reference: string;
  original_amount: string;
  currency: Currency;
  exchange_rate: string;
  pen_equivalent_amount: string;
}

export interface ExpenseWritePayload {
  date: string;
  category: number;
  description: string;
  supplier?: number | null;
  receipt_type: ReceiptType;
  payment_status: PaymentStatus;
  payment_method: number;
  payment_reference?: string;
  original_amount: string;
  currency: Currency;
  manual_exchange_rate?: string;
}

export interface PriceTierEntry {
  id: number;
  product: number;
  min_quantity: number;
  unit_price: string;
}

export interface ProductEntry {
  id: number;
  sku: string;
  base_model: string;
  subcategory: number;
  subcategory_name: string;
  category_name: string;
  color: number | null;
  color_name: string | null;
  presentation: number | null;
  presentation_name: string | null;
  supplier: number | null;
  supplier_name: string | null;
  unit_cost: string;
  suggested_price: string;
  min_stock: number;
  is_active: boolean;
  current_stock: number;
  inventory_value: string;
  needs_restock: boolean;
  price_tiers: PriceTierEntry[];
}

export interface ProductWritePayload {
  sku?: string;
  base_model: string;
  subcategory: number;
  color?: number | null;
  presentation?: number | null;
  supplier?: number | null;
  suggested_price: string;
  min_stock?: number;
  is_active?: boolean;
}

export interface InventoryEntryEntry {
  id: number;
  date: string;
  product: number;
  product_sku: string;
  quantity: number;
  unit_cost: string | null;
  notes: string;
}

export interface InventoryEntryWritePayload {
  date: string;
  product: number;
  quantity: number;
  unit_cost?: string | null;
  notes?: string;
}

export interface InventoryAuditEntry {
  id: number;
  date: string;
  product: number;
  product_sku: string;
  physical_count: number;
  theoretical_stock_snapshot: number;
  loss_adjustment: number;
  loss_value: string;
}

export interface InventoryAuditWritePayload {
  date: string;
  product: number;
  physical_count: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
