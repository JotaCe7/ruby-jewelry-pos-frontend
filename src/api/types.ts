export interface NamedCatalogEntry {
  id: number;
  name: string;
  is_active: boolean;
}

export interface ProductSubcategoryEntry extends NamedCatalogEntry {
  category: number;
  category_name: string;
}

export interface ContactEntry {
  id: number;
  name: string;
  tax_id: string;
  phone: string;
  email: string;
  is_active: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
