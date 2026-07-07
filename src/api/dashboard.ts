import { apiClient } from "./client";
import type { DashboardSummary, TodaySnapshot } from "./types";

export async function fetchTodaySnapshot() {
  const { data } = await apiClient.get<TodaySnapshot>("/dashboard/today/");
  return data;
}

export async function fetchDashboardSummary(params?: { date_from?: string; date_to?: string }) {
  const { data } = await apiClient.get<DashboardSummary>("/dashboard/summary/", { params });
  return data;
}
