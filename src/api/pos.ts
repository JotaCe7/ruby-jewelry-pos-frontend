import { createCrudApi } from "./crudFactory";
import type { SaleEntry, SaleWritePayload } from "./types";

export const salesApi = createCrudApi<SaleEntry, SaleWritePayload>("/pos/sales/");
