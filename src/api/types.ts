export interface NamedCatalogEntry {
  id: number;
  name: string;
  is_active: boolean;
}

export interface ProductCategoryEntry extends NamedCatalogEntry {
  image: string | null;
}

export interface ProductSubcategoryEntry extends NamedCatalogEntry {
  category: number;
  category_name: string;
  image: string | null;
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
  image: string | null;
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

export type MovementType = "SALE" | "GIFT" | "DAMAGED";

export interface SaleLineInput {
  product: number;
  movement_type: MovementType;
  quantity: number;
  unit_price: string;
  discount?: string;
  payment_method?: number | null;
  combo_key?: string | null;
  combo_discount_total?: string | null;
}

export interface SaleWritePayload {
  customer?: number | null;
  lines: SaleLineInput[];
  // Admin-only retroactive-attribution path: attribute this sale to another
  // seller, confirmed with that seller's own login password.
  seller_override?: number;
  seller_password?: string;
}

export interface DraftSaleLineEntry {
  id: number;
  product: number;
  product_detail: ProductEntry;
  movement_type: MovementType;
  quantity: number;
  unit_price: string;
  discount: string;
  payment_method: number | null;
  combo_key: string;
  combo_discount_total: string | null;
}

export interface DraftSaleEntry {
  id: number;
  date: string;
  customer: number | null;
  customer_name: string | null;
  lines: DraftSaleLineEntry[];
}

export interface DraftSaleLineWritePayload {
  product: number;
  movement_type: MovementType;
  quantity: number;
  unit_price: string;
  discount: string;
  payment_method: number | null;
  combo_key: string;
  combo_discount_total: string | null;
}

export interface DraftSaleWritePayload {
  date: string;
  customer: number | null;
  lines: DraftSaleLineWritePayload[];
}

export interface SaleLineItem {
  id: number;
  product: number;
  product_sku: string;
  product_name: string;
  movement_type: MovementType;
  quantity: number;
  unit_price_snapshot: string;
  discount_applied: string;
  final_price: string;
  payment_method: number | null;
  payment_method_name: string | null;
  combo_group: string | null;
}

export interface SaleEntry {
  id: number;
  date: string;
  customer: number | null;
  customer_name: string | null;
  line_items: SaleLineItem[];
  total: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UserEntry {
  id: number;
  username: string;
  is_admin: boolean;
}

export interface RegisterStatus {
  is_open: boolean;
  opened_at: string | null;
  process_date: string;
}

export type ClosingType = "X" | "Z";
export type ClosingMode = "PANTALLA" | "IMPRESORA";

export interface ClosingTotals {
  period_start: string;
  period_end: string;
  total_sales: string;
  total_by_payment_method: Record<string, string>;
  total_losses: string;
  sale_count: number;
}

export interface RegisterClosingEntry extends ClosingTotals {
  id: number;
  seller: number;
  seller_name: string;
  closing_type: ClosingType;
  closing_type_display: string;
  process_date: string;
  performed_by: number;
  performed_by_name: string;
  created_at: string;
}

export interface SetProcessDateResult {
  process_date: string;
  is_future: boolean;
  has_prior_z: boolean;
}

export interface TodaySellerStatus {
  seller_id: number;
  username: string;
  is_open: boolean;
  opened_at: string | null;
  period_start?: string;
  period_end?: string;
  total_sales?: string;
  total_by_payment_method?: Record<string, string>;
  total_losses?: string;
  sale_count?: number;
}

export interface LowStockProductEntry {
  id: number;
  sku: string;
  base_model: string;
  current_stock: number;
  min_stock: number;
}

export interface TodaySnapshot {
  process_date: string;
  sellers: TodaySellerStatus[];
  low_stock_products: LowStockProductEntry[];
}

export interface SellerSummaryRow {
  seller_id: number | null;
  username: string;
  total_sales: string;
  sale_count: number;
  gift_count: number;
  damaged_count: number;
}

export interface SupplierSummaryRow {
  supplier_id: number | null;
  supplier_name: string;
  revenue: string;
  cost: string;
  profit: string;
  margin_pct: string;
}

export interface TopProductRow {
  product_id: number;
  sku: string;
  base_model: string;
  revenue: string;
  quantity: number;
}

export interface DashboardSummary {
  date_from: string;
  date_to: string;
  total_income: string;
  total_by_payment_method: Record<string, string>;
  by_seller: SellerSummaryRow[];
  by_supplier: SupplierSummaryRow[];
  top_products: TopProductRow[];
  total_losses: string;
  losses_breakdown: { gifts_damaged: string; audit_shrinkage: string };
  inventory_value: string;
  low_stock_count: number;
}
