import { apiClient } from "./client";

export async function uploadImage<T>(resourcePath: string, id: number, file: File): Promise<T> {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await apiClient.patch<T>(`${resourcePath}${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
