import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { assetsApi } from "../api/assets";
import { queryClient } from "../api/queryClient";
import { socketManager } from "../socket";
import type { AssetFormData, AssetStatus, AssetType } from "../types";

interface AssetFilters {
  type?: AssetType;
  status?: AssetStatus;
}

export function useAssets(filters?: AssetFilters) {
  return useQuery({
    queryKey: ["assets", filters],
    queryFn: () => assetsApi.list(filters),
  });
}

export function useAssetDetail(id: string) {
  useEffect(() => {
    socketManager.joinAsset(id);
    return () => socketManager.leaveAsset(id);
  }, [id]);

  return useQuery({
    queryKey: ["assets", id],
    queryFn: () => assetsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  return useMutation({
    mutationFn: (data: AssetFormData) => assetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useUpdateAsset(id: string) {
  return useMutation({
    mutationFn: (data: Partial<AssetFormData>) => assetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", id] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useDeleteAsset() {
  return useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
