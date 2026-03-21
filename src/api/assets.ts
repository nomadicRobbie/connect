import type { Asset, AssetFormData, AssetStatus, AssetType } from "../types";
import { apiClient } from "./client";

interface AssetFilters {
  type?: AssetType;
  status?: AssetStatus;
}

export const assetsApi = {
  list: (filters?: AssetFilters) => apiClient.get<Asset[]>("/assets", { params: filters }).then((r) => r.data),

  get: (id: string) => apiClient.get<Asset>(`/assets/${id}`).then((r) => r.data),

  create: (data: AssetFormData) => apiClient.post<Asset>("/assets", data).then((r) => r.data),

  update: (id: string, data: Partial<AssetFormData>) => apiClient.patch<Asset>(`/assets/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/assets/${id}`).then((r) => r.data),
};
