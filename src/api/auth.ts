import { apiClient } from "./client";
import type { UserEntry } from "./types";

// Admin-only: powers seller-selection dropdowns (force-open a register,
// retroactive sale attribution, closing another seller's register).
export async function fetchUsers() {
  const { data } = await apiClient.get<UserEntry[]>("/auth/users/");
  return data;
}
