import type { AssetComment, AssetCommentsResponse, MaintenanceComment, MaintenanceCommentsResponse } from "../types";
import { apiClient } from "./client";

interface GetCommentsOptions {
  maintenanceRecordId: string;
  limit?: number;
  cursor?: string;
}

interface GetAssetCommentsOptions {
  assetId: string;
  limit?: number;
  cursor?: string;
}

export const commentsApi = {
  list: ({ maintenanceRecordId, limit = 30, cursor }: GetCommentsOptions) =>
    apiClient
      .get<MaintenanceCommentsResponse>(`/maintenance/${maintenanceRecordId}/comments`, {
        params: { limit, cursor },
      })
      .then((r) => r.data),

  create: (maintenanceRecordId: string, content: string) => apiClient.post<MaintenanceComment>(`/maintenance/${maintenanceRecordId}/comments`, { content }).then((r) => r.data),

  delete: (maintenanceRecordId: string, commentId: string) => apiClient.delete(`/maintenance/${maintenanceRecordId}/comments/${commentId}`).then((r) => r.data),
};

export const assetCommentsApi = {
  list: ({ assetId, limit = 30, cursor }: GetAssetCommentsOptions) =>
    apiClient
      .get<AssetCommentsResponse>(`/assets/${assetId}/comments`, {
        params: { limit, cursor },
      })
      .then((r) => r.data),

  create: (assetId: string, content: string) => apiClient.post<AssetComment>(`/assets/${assetId}/comments`, { content }).then((r) => r.data),

  delete: (assetId: string, commentId: string) => apiClient.delete(`/assets/${assetId}/comments/${commentId}`).then((r) => r.data),
};
