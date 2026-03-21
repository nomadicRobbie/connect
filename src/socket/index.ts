import { io, Socket } from "socket.io-client";
import { queryClient } from "../api/queryClient";
import type {
    AckFailure,
    Asset,
    AssetDeletedPayload,
    ChatMessageCreatedPayload,
    ChatReadState,
    ChatRoom,
    ChatRoomJoinPayload,
    ChatRoomLeavePayload,
    ChatRoomRemovedPayload,
    ChatSendMessagePayload,
    ChatSendMessageResult,
    MaintenanceDeletedPayload,
    MaintenanceRecord,
    Presence,
    SocketAck,
    SocketErrorPayload,
    SocketReadyPayload,
} from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

type PresenceListener = () => void;

function isAckFailure<T>(ack: SocketAck<T>): ack is AckFailure {
  return ack.ok === false;
}

function toError(ack: AckFailure) {
  const error = new Error(ack.error) as Error & { status?: number };
  error.status = ack.status;
  return error;
}

function sortRoomsByActivity(rooms: ChatRoom[]) {
  return [...rooms].sort((left, right) => {
    const leftDate = left.lastMessage?.createdAt ?? left.updatedAt;
    const rightDate = right.lastMessage?.createdAt ?? right.updatedAt;
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

class SocketManager {
  private socket: Socket | null = null;
  private readyPayload: SocketReadyPayload | null = null;
  private presenceMap = new Map<string, Presence>();
  private presenceListeners = new Set<PresenceListener>();

  connect(token: string) {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(BASE_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 2000,
      transports: ["websocket"],
    });

    this.registerCoreListeners();
  }

  private registerCoreListeners() {
    if (!this.socket) return;

    this.socket.on("socket:ready", (payload: SocketReadyPayload) => {
      this.readyPayload = payload;
    });

    this.socket.on("socket:error", (payload: SocketErrorPayload) => {
      this.readyPayload = null;
      queryClient.setQueryData(["socket", "error"], payload);
    });

    this.socket.on("asset:created", (asset: Asset) => {
      this.upsertAsset(asset);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    this.socket.on("asset:updated", (asset: Asset) => {
      this.upsertAsset(asset);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    this.socket.on("asset:deleted", ({ id }: AssetDeletedPayload) => {
      queryClient.setQueryData<Asset[] | undefined>(["assets"], (currentAssets) => currentAssets?.filter((asset) => asset.id !== id));
      queryClient.removeQueries({ queryKey: ["assets", id] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    this.socket.on("maintenance:created", (record: MaintenanceRecord) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["assets", record.assetId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    this.socket.on("maintenance:updated", (record: MaintenanceRecord) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.setQueryData(["maintenance", record.id], record);
      queryClient.invalidateQueries({ queryKey: ["assets", record.assetId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    this.socket.on("maintenance:deleted", ({ id, assetId }: MaintenanceDeletedPayload) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.removeQueries({ queryKey: ["maintenance", id] });
      queryClient.invalidateQueries({ queryKey: ["assets", assetId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    this.socket.on("chat:room:created", (room: ChatRoom) => {
      this.upsertRoom(room);
    });

    this.socket.on("chat:room:updated", (room: ChatRoom) => {
      this.upsertRoom(room);
    });

    this.socket.on("chat:room:removed", ({ roomId }: ChatRoomRemovedPayload) => {
      queryClient.setQueryData<ChatRoom[] | undefined>(["chat", "rooms"], (currentRooms) => currentRooms?.filter((room) => room.id !== roomId));
      queryClient.removeQueries({ queryKey: ["chat", "rooms", roomId] });
      queryClient.removeQueries({ queryKey: ["chat", "rooms", roomId, "messages"] });
    });

    this.socket.on("chat:message:created", ({ roomId }: ChatMessageCreatedPayload) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] });
      queryClient.invalidateQueries({ queryKey: ["chat", "rooms", roomId] });
      queryClient.invalidateQueries({ queryKey: ["chat", "rooms", roomId, "messages"] });
    });

    this.socket.on("chat:room:read", (payload: ChatReadState) => {
      this.applyRoomRead(payload);
    });

    this.socket.on("presence:updated", (presence: Presence) => {
      this.presenceMap.set(presence.userId, presence);
      queryClient.setQueryData(["presence", presence.userId], presence);
      for (const listener of this.presenceListeners) {
        listener();
      }
    });
  }

  private async emitWithAck<TPayload, TResult>(event: string, payload: TPayload) {
    if (!this.socket) {
      throw new Error("Socket is not connected");
    }

    const ack = await new Promise<SocketAck<TResult>>((resolve) => {
      this.socket?.emit(event, payload, resolve);
    });

    if (isAckFailure(ack)) {
      throw toError(ack);
    }

    return ack.data;
  }

  private upsertAsset(asset: Asset) {
    queryClient.setQueryData<Asset[] | undefined>(["assets"], (currentAssets) => {
      if (!currentAssets) return currentAssets;
      const existing = currentAssets.filter((entry) => entry.id !== asset.id);
      return [asset, ...existing];
    });

    queryClient.setQueryData(["assets", asset.id], asset);
    queryClient.invalidateQueries({ queryKey: ["assets"] });
  }

  private upsertRoom(room: ChatRoom) {
    queryClient.setQueryData<ChatRoom[] | undefined>(["chat", "rooms"], (currentRooms) => {
      const rooms = currentRooms ?? [];
      const existing = rooms.filter((entry) => entry.id !== room.id);
      return sortRoomsByActivity([room, ...existing]);
    });

    queryClient.setQueryData(["chat", "rooms", room.id], room);
  }

  joinAsset(assetId: string) {
    this.socket?.emit("asset:join", assetId);
  }

  leaveAsset(assetId: string) {
    this.socket?.emit("asset:leave", assetId);
  }

  joinChatRoom(payload: ChatRoomJoinPayload) {
    return this.emitWithAck<ChatRoomJoinPayload, ChatRoom>("chat:room:join", payload);
  }

  leaveChatRoom(payload: ChatRoomLeavePayload) {
    return this.emitWithAck<ChatRoomLeavePayload, { roomId: string }>("chat:room:leave", payload);
  }

  sendChatMessage(payload: ChatSendMessagePayload) {
    return this.emitWithAck<ChatSendMessagePayload, ChatSendMessageResult>("chat:message:send", payload);
  }

  markChatRoomRead(payload: ChatRoomJoinPayload) {
    return this.emitWithAck<ChatRoomJoinPayload, ChatReadState>("chat:room:read", payload);
  }

  applyRoomRead(payload: ChatReadState) {
    queryClient.setQueryData<ChatRoom[] | undefined>(["chat", "rooms"], (currentRooms) => {
      if (!currentRooms) return currentRooms;

      return currentRooms.map((room) => {
        if (room.id !== payload.roomId) return room;

        const members = room.members.map((member) => (member.userId === payload.userId ? { ...member, lastReadAt: payload.lastReadAt } : member));
        const unreadCount = this.readyPayload?.userId === payload.userId ? 0 : room.unreadCount;

        return {
          ...room,
          members,
          unreadCount,
        };
      });
    });

    queryClient.setQueryData<ChatRoom | undefined>(["chat", "rooms", payload.roomId], (room) => {
      if (!room) return room;
      return {
        ...room,
        members: room.members.map((member) => (member.userId === payload.userId ? { ...member, lastReadAt: payload.lastReadAt } : member)),
        unreadCount: this.readyPayload?.userId === payload.userId ? 0 : room.unreadCount,
      };
    });
  }

  subscribePresence(listener: PresenceListener) {
    this.presenceListeners.add(listener);
    return () => {
      this.presenceListeners.delete(listener);
    };
  }

  getPresence(userId: string) {
    return this.presenceMap.get(userId);
  }

  get readyState() {
    return this.readyPayload;
  }

  disconnect() {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.readyPayload = null;
    this.presenceMap.clear();
    this.presenceListeners.clear();
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketManager = new SocketManager();
