import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { chatApi, sortRoomsByActivity } from "../api/chat";
import { queryClient } from "../api/queryClient";
import { socketManager } from "../socket";
import type { ChatReadState, ChatRoom, ChatSendMessagePayload, Presence, User } from "../types";

export function usePeople() {
  return useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: async () => sortRoomsByActivity(await chatApi.listRooms()),
  });
}

export function useChatRoom(roomId: string) {
  return useQuery({
    queryKey: ["chat", "rooms", roomId],
    queryFn: () => chatApi.getRoom(roomId),
    enabled: !!roomId,
  });
}

export function useRoomMessages(roomId: string) {
  useEffect(() => {
    if (!roomId) return;

    void socketManager.joinChatRoom({ roomId });
    return () => {
      void socketManager.leaveChatRoom({ roomId });
    };
  }, [roomId]);

  return useInfiniteQuery({
    queryKey: ["chat", "rooms", roomId, "messages"],
    queryFn: ({ pageParam }) => chatApi.getRoomMessages({ roomId, limit: 50, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.pageInfo.hasMore ? (lastPage.pageInfo.nextCursor ?? null) : null),
    enabled: !!roomId,
  });
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: (payload: ChatSendMessagePayload) => socketManager.sendChatMessage(payload),
    onSuccess: async ({ roomId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] }),
        queryClient.invalidateQueries({ queryKey: ["chat", "rooms", roomId] }),
        queryClient.invalidateQueries({ queryKey: ["chat", "rooms", roomId, "messages"] }),
      ]);
    },
  });
}

export function useMarkRoomRead() {
  return useMutation({
    mutationFn: async (roomId: string) => {
      const readState = await socketManager.markChatRoomRead({ roomId });
      return readState ?? chatApi.markRoomRead(roomId);
    },
    onSuccess: async (readState: ChatReadState) => {
      socketManager.applyRoomRead(readState);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] }), queryClient.invalidateQueries({ queryKey: ["chat", "rooms", readState.roomId] })]);
    },
  });
}

export function useCreateDirectRoom() {
  return useMutation({
    mutationFn: (userId: string) => chatApi.getOrCreateDirectRoom(userId),
    onSuccess: async ({ room }) => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] }), queryClient.invalidateQueries({ queryKey: ["chat", "rooms", room.id] })]);
    },
  });
}

export function useCreateGroupRoom() {
  return useMutation({
    mutationFn: (payload: { name: string; memberIds: string[] }) => chatApi.createGroupRoom(payload),
    onSuccess: async (room) => {
      queryClient.setQueryData(["chat", "rooms", room.id], room);
      await queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] });
    },
  });
}

export function useKnownContacts(currentUserId?: string | null) {
  const { data: rooms } = usePeople();
  return useMemo(() => {
    if (!rooms || !currentUserId) return [];
    const userMap = new Map<string, User>();
    for (const room of rooms) {
      for (const member of room.members) {
        if (member.userId !== currentUserId && !userMap.has(member.userId)) {
          userMap.set(member.userId, member.user);
        }
      }
    }
    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rooms, currentUserId]);
}

export function usePresence(userIds: string[]) {
  const key = useMemo(() => userIds.join(","), [userIds]);
  const [presence, setPresence] = useState<Presence[]>(() => userIds.map((userId) => socketManager.getPresence(userId)).filter(Boolean) as Presence[]);

  useEffect(() => {
    setPresence(userIds.map((userId) => socketManager.getPresence(userId)).filter(Boolean) as Presence[]);

    return socketManager.subscribePresence(() => {
      setPresence(userIds.map((userId) => socketManager.getPresence(userId)).filter(Boolean) as Presence[]);
    });
  }, [key, userIds]);

  return { data: presence };
}

export function upsertRoomInCache(room: ChatRoom) {
  queryClient.setQueryData<ChatRoom[]>(["chat", "rooms"], (currentRooms = []) => {
    const existing = currentRooms.filter((entry) => entry.id !== room.id);
    return sortRoomsByActivity([room, ...existing]);
  });

  queryClient.setQueryData(["chat", "rooms", room.id], room);
}

export function getOtherRoomMember(room: ChatRoom, userId?: string | null) {
  return room.members.find((member) => member.userId !== userId)?.user;
}

export function getPresenceForUser(presence: Presence[], user?: User) {
  if (!user) return undefined;
  return presence.find((entry) => entry.userId === user.id);
}
