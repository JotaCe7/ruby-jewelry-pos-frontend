import { apiClient } from "./client";
import { createCrudApi } from "./crudFactory";
import type { DraftSaleEntry, DraftSaleWritePayload, SaleEntry, SaleWritePayload } from "./types";

export const salesApi = createCrudApi<SaleEntry, SaleWritePayload>("/pos/sales/");

// The draft ticket is a singleton per logged-in user (server-persisted so
// a dead phone or switching devices mid-sale doesn't lose it) rather than
// a normal CRUD collection, hence the plain function calls instead of
// createCrudApi.
export async function fetchDraft() {
  const { data } = await apiClient.get<DraftSaleEntry>("/pos/draft/");
  return data;
}

export async function saveDraft(payload: DraftSaleWritePayload) {
  const { data } = await apiClient.patch<DraftSaleEntry>("/pos/draft/", payload);
  return data;
}

export async function discardDraft() {
  await apiClient.delete("/pos/draft/");
}

export async function finalizeDraft() {
  const { data } = await apiClient.post<SaleEntry>("/pos/draft/finalize/");
  return data;
}
