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

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
