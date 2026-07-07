import { apiClient } from "./client";
import { createCrudApi } from "./crudFactory";
import type { Currency, ExpenseEntry, ExpenseWritePayload } from "./types";

export const expensesApi = createCrudApi<ExpenseEntry, ExpenseWritePayload>("/finance/expenses/");

export async function fetchExchangeRatePreview(date: string, currency: Currency) {
  const { data } = await apiClient.get<{ value: string; date: string; currency: Currency }>(
    "/finance/exchange-rate/",
    { params: { date, currency } },
  );
  return data.value;
}
