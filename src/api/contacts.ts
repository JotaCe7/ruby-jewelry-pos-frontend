import { createCrudApi } from "./crudFactory";
import type { ContactEntry } from "./types";

export const suppliersApi = createCrudApi<ContactEntry>("/contacts/suppliers/");
export const customersApi = createCrudApi<ContactEntry>("/contacts/customers/");
