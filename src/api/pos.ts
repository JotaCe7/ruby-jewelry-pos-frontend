import { apiClient } from "./client";
import { createCrudApi } from "./crudFactory";
import type {
  ClosingMode,
  ClosingTotals,
  ClosingType,
  DraftSaleEntry,
  DraftSaleWritePayload,
  RegisterClosingEntry,
  RegisterStatus,
  SaleEntry,
  SaleWritePayload,
  SetProcessDateResult,
} from "./types";

export const salesApi = createCrudApi<SaleEntry, SaleWritePayload>("/pos/sales/");
export const registerClosingsApi = createCrudApi<RegisterClosingEntry, never>("/pos/register/closings/");

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

export async function fetchRegisterStatus() {
  const { data } = await apiClient.get<RegisterStatus>("/pos/register/status/");
  return data;
}

export async function openRegister() {
  const { data } = await apiClient.post<{ is_open: boolean; opened_at: string }>("/pos/register/open/");
  return data;
}

// Admin-only: opens another seller's register regardless of the
// "must equal today" rule — first step of the retroactive-correction flow.
export async function forceOpenRegister(sellerId: number) {
  const { data } = await apiClient.post<{ is_open: boolean; opened_at: string }>(
    "/pos/register/force-open/",
    { seller: sellerId },
  );
  return data;
}

// Admin-only: sets the global process date directly.
export async function setProcessDate(date: string) {
  const { data } = await apiClient.post<SetProcessDateResult>("/pos/register/set-process-date/", { date });
  return data;
}

interface CloseRegisterParams {
  closingType: ClosingType;
  mode: ClosingMode;
  pin: string;
  sellerId?: number;
}

// mode=PANTALLA returns a preview (ClosingTotals) without persisting
// anything; mode=IMPRESORA persists a RegisterClosing row.
export async function closeRegister({ closingType, mode, pin, sellerId }: CloseRegisterParams) {
  const { data } = await apiClient.post<ClosingTotals | RegisterClosingEntry>("/pos/register/close/", {
    closing_type: closingType,
    mode,
    pin,
    seller: sellerId,
  });
  return data;
}

// Admin-only: whether the shared closing PIN has been set yet (the hash
// itself is never returned).
export async function fetchPinStatus() {
  const { data } = await apiClient.get<{ has_pin: boolean }>("/pos/register/pin/");
  return data;
}

export async function setClosingPin(pin: string) {
  const { data } = await apiClient.post<{ has_pin: boolean }>("/pos/register/pin/", { pin });
  return data;
}
