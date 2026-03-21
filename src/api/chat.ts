import type { ChatMessage, ChatMessagesResponse, ChatReadState, ChatRoom, DirectRoomResponse } from "../types";
import { apiClient } from "./client";

interface GetRoomMessagesOptions {
  roomId: string;
  limit?: number;
  cursor?: string;
}

export const chatApi = {
  listRooms: () => apiClient.get<ChatRoom[]>("/chat/rooms").then((response) => response.data),

  createGroupRoom: (payload: { name: string; memberIds: string[] }) => apiClient.post<ChatRoom>("/chat/rooms", payload).then((response) => response.data),

  getOrCreateDirectRoom: (userId: string) => apiClient.post<DirectRoomResponse>(`/chat/direct/${userId}`).then((response) => response.data),

  getRoom: (roomId: string) => apiClient.get<ChatRoom>(`/chat/rooms/${roomId}`).then((response) => response.data),

  getRoomMessages: ({ roomId, limit = 20, cursor }: GetRoomMessagesOptions) =>
    apiClient
      .get<ChatMessagesResponse>(`/chat/rooms/${roomId}/messages`, {
        params: { limit, cursor },
      })
      .then((response) => response.data),

  markRoomRead: (roomId: string) => apiClient.post<ChatReadState>(`/chat/rooms/${roomId}/read`).then((response) => response.data),

  inviteMember: (roomId: string, userId: string) => apiClient.post<ChatRoom>(`/chat/rooms/${roomId}/members`, { userId }).then((response) => response.data),

  removeMember: (roomId: string, userId: string) => apiClient.delete<ChatRoom>(`/chat/rooms/${roomId}/members/${userId}`).then((response) => response.data),
};

export function sortRoomsByActivity(rooms: ChatRoom[]) {
  return [...rooms].sort((left, right) => {
    const leftDate = left.lastMessage?.createdAt ?? left.updatedAt;
    const rightDate = right.lastMessage?.createdAt ?? right.updatedAt;
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

export function sortMessagesChronologically(messages: ChatMessage[]) {
  return [...messages].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}
