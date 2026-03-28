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
    MaintenanceCommentCreatedPayload,
    MaintenanceDeletedPayload,
    MaintenanceRecord,
    NotificationCreatedPayload,
    Presence,
    SocketAck,
    SocketErrorPayload,
    SocketReadyPayload,
    UnreadNotificationCountPayload
} from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const READY_TIMEOUT_MS = 10000;

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
  private currentUserId: string | null = null;
  private hasReceivedReady = false;
  private presenceMap = new Map<string, Presence>();
  private presenceListeners = new Set<PresenceListener>();
  private activeAssetIds = new Set<string>();
  private activeChatRoomIds = new Set<string>();

  connect(token: string, userId?: string) {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentUserId = userId ?? this.currentUserId;
    this.readyPayload = null;
    this.hasReceivedReady = false;

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

    this.socket.on("connect", () => {
      queryClient.setQueryData(["socket", "connected"], true);
    });

    this.socket.on("disconnect", () => {
      this.readyPayload = null;
      queryClient.setQueryData(["socket", "connected"], false);
      queryClient.setQueryData(["socket", "ready"], null);
    });

    this.socket.on("socket:ready", (payload: SocketReadyPayload) => {
      const shouldRestoreChatRooms = this.hasReceivedReady;
      this.readyPayload = payload;
      this.hasReceivedReady = true;
      this.currentUserId = payload.userId;
      queryClient.setQueryData(["socket", "error"], null);
      queryClient.setQueryData(["socket", "ready"], payload);
      this.restoreActiveSubscriptions({ includeChatRooms: shouldRestoreChatRooms });
    });

    this.socket.on("socket:error", (payload: SocketErrorPayload) => {
      this.readyPayload = null;
      queryClient.setQueryData(["socket", "ready"], null);
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

    // ── Maintenance comments ────────────────────────────────────────
    this.socket.on("maintenance:comment:created", ({ maintenanceRecordId }: MaintenanceCommentCreatedPayload) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", maintenanceRecordId, "comments"] });
    });

    // ── Notifications ───────────────────────────────────────────────
    this.socket.on("notification:created", ({ notification }: NotificationCreatedPayload) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    });

    this.socket.on("notification:unread-count", ({ count }: UnreadNotificationCountPayload) => {
      queryClient.setQueryData(["notifications", "unread-count"], { count });
    });
  }

  private async waitForReady() {
    if (this.readyPayload) {
      return this.readyPayload;
    }

    const socket = this.socket;

    if (!socket) {
      throw new Error("Socket is not connected");
    }

    return new Promise<SocketReadyPayload>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const cleanup = () => {
        socket.off("socket:ready", handleReady);
        socket.off("socket:error", handleError);
        socket.off("disconnect", handleDisconnect);
        if (timeoutId) clearTimeout(timeoutId);
      };

      const handleReady = (payload: SocketReadyPayload) => {
        cleanup();
        resolve(payload);
      };

      const handleError = (payload: SocketErrorPayload) => {
        cleanup();
        reject(toError(payload));
      };

      const handleDisconnect = () => {
        cleanup();
        reject(new Error("Socket disconnected before it became ready"));
      };

      socket.on("socket:ready", handleReady);
      socket.on("socket:error", handleError);
      socket.on("disconnect", handleDisconnect);
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("Socket did not become ready in time"));
      }, READY_TIMEOUT_MS);
    });
  }

  private restoreActiveSubscriptions(options: { includeChatRooms: boolean }) {
    for (const assetId of this.activeAssetIds) {
      this.socket?.emit("asset:join", assetId);
    }

    if (!options.includeChatRooms) {
      return;
    }

    for (const roomId of this.activeChatRoomIds) {
      void this.joinChatRoom({ roomId }, { persist: false });
    }
  }

  private async emitWithAck<TPayload, TResult>(event: string, payload: TPayload) {
    await this.waitForReady();

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
    this.activeAssetIds.add(assetId);
    if (this.readyPayload) {
      this.socket?.emit("asset:join", assetId);
    }
  }

  leaveAsset(assetId: string) {
    this.activeAssetIds.delete(assetId);
    if (this.readyPayload) {
      this.socket?.emit("asset:leave", assetId);
    }
  }

  async joinChatRoom(payload: ChatRoomJoinPayload, options?: { persist?: boolean }) {
    if (options?.persist !== false) {
      this.activeChatRoomIds.add(payload.roomId);
    }

    const room = await this.emitWithAck<ChatRoomJoinPayload, ChatRoom>("chat:room:join", payload);
    this.upsertRoom(room);
    return room;
  }

  async leaveChatRoom(payload: ChatRoomLeavePayload) {
    this.activeChatRoomIds.delete(payload.roomId);

    if (!this.socket || !this.readyPayload) {
      return { roomId: payload.roomId };
    }

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
        const unreadCount = this.currentUserId === payload.userId ? 0 : room.unreadCount;

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
        unreadCount: this.currentUserId === payload.userId ? 0 : room.unreadCount,
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
    this.currentUserId = null;
    this.presenceMap.clear();
    this.presenceListeners.clear();
    this.activeAssetIds.clear();
    this.activeChatRoomIds.clear();
    queryClient.setQueryData(["socket", "connected"], false);
    queryClient.setQueryData(["socket", "ready"], null);
    queryClient.setQueryData(["socket", "error"], null);
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketManager = new SocketManager();
