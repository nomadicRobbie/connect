import type { MaintenanceFormData, MaintenancePriority, MaintenanceRecord, MaintenanceStatus } from "../types";
import { apiClient } from "./client";

interface MaintenanceFilters {
  assetId?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
}

export const maintenanceApi = {
  list: (filters?: MaintenanceFilters) => apiClient.get<MaintenanceRecord[]>("/maintenance", { params: filters }).then((r) => r.data),

  get: (id: string) => apiClient.get<MaintenanceRecord>(`/maintenance/${id}`).then((r) => r.data),

  create: (data: MaintenanceFormData) => apiClient.post<MaintenanceRecord>("/maintenance", data).then((r) => r.data),

  update: (id: string, data: Partial<MaintenanceFormData>) => apiClient.patch<MaintenanceRecord>(`/maintenance/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/maintenance/${id}`).then((r) => r.data),
};
