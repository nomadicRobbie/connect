import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { assetCommentsApi, commentsApi } from "../api/comments";
import { queryClient } from "../api/queryClient";

export function useMaintenanceComments(maintenanceRecordId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["maintenance", maintenanceRecordId, "comments"],
    queryFn: ({ pageParam }) =>
      commentsApi.list({
        maintenanceRecordId,
        limit: 30,
        cursor: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.pageInfo.hasMore ? (lastPage.pageInfo.nextCursor ?? null) : null),
    enabled: !!maintenanceRecordId && enabled,
  });
}

export function useCreateComment(maintenanceRecordId: string) {
  return useMutation({
    mutationFn: (content: string) => commentsApi.create(maintenanceRecordId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", maintenanceRecordId, "comments"] });
    },
  });
}

export function useDeleteComment(maintenanceRecordId: string) {
  return useMutation({
    mutationFn: (commentId: string) => commentsApi.delete(maintenanceRecordId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", maintenanceRecordId, "comments"] });
    },
  });
}

export function useAssetComments(assetId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["assets", assetId, "comments"],
    queryFn: ({ pageParam }) =>
      assetCommentsApi.list({
        assetId,
        limit: 30,
        cursor: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.pageInfo.hasMore ? (lastPage.pageInfo.nextCursor ?? null) : null),
    enabled: !!assetId && enabled,
  });
}

export function useCreateAssetComment(assetId: string) {
  return useMutation({
    mutationFn: (content: string) => assetCommentsApi.create(assetId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", assetId, "comments"] });
    },
  });
}

export function useDeleteAssetComment(assetId: string) {
  return useMutation({
    mutationFn: (commentId: string) => assetCommentsApi.delete(assetId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", assetId, "comments"] });
    },
  });
}
