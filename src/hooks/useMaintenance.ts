import { useMutation, useQuery } from "@tanstack/react-query";
import { maintenanceApi } from "../api/maintenance";
import { queryClient } from "../api/queryClient";
import type { MaintenanceFormData, MaintenancePriority, MaintenanceStatus } from "../types";

interface MaintenanceFilters {
  assetId?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
}

export function useMaintenance(filters?: MaintenanceFilters) {
  return useQuery({
    queryKey: ["maintenance", filters],
    queryFn: () => maintenanceApi.list(filters),
  });
}

export function useMaintenanceRecord(id: string) {
  return useQuery({
    queryKey: ["maintenance", id],
    queryFn: () => maintenanceApi.get(id),
    enabled: !!id,
  });
}

export function useCreateMaintenance() {
  return useMutation({
    mutationFn: (data: MaintenanceFormData) => maintenanceApi.create(data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["assets", record.assetId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateMaintenance(id: string) {
  return useMutation({
    mutationFn: (data: Partial<MaintenanceFormData>) => maintenanceApi.update(id, data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", id] });
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["assets", record.assetId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteMaintenance() {
  return useMutation({
    mutationFn: (id: string) => maintenanceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
