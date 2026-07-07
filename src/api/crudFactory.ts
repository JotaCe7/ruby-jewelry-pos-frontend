import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";

export function createCrudApi<TEntry, TWritePayload = Partial<TEntry>>(resourcePath: string) {
  return {
    list: async (params?: Record<string, string | number>) => {
      const { data } = await apiClient.get<PaginatedResponse<TEntry>>(resourcePath, { params });
      return data.results;
    },
    create: async (payload: TWritePayload) => {
      const { data } = await apiClient.post<TEntry>(resourcePath, payload);
      return data;
    },
    update: async (id: number, payload: TWritePayload) => {
      const { data } = await apiClient.patch<TEntry>(`${resourcePath}${id}/`, payload);
      return data;
    },
    remove: async (id: number) => {
      await apiClient.delete(`${resourcePath}${id}/`);
    },
  };
}
