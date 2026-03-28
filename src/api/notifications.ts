import type { AppNotification, NotificationsResponse } from "../types";
import { apiClient } from "./client";

interface GetNotificationsOptions {
  limit?: number;
  cursor?: string;
}

export const notificationsApi = {
  list: ({ limit = 30, cursor }: GetNotificationsOptions = {}) =>
    apiClient
      .get<NotificationsResponse>("/notifications", {
        params: { limit, cursor },
      })
      .then((r) => r.data),

  markRead: (id: string) => apiClient.patch<AppNotification>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () => apiClient.post<void>("/notifications/read-all").then((r) => r.data),

  unreadCount: () => apiClient.get<{ count: number }>("/notifications/unread-count").then((r) => r.data),
};
