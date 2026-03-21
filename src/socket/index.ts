import { io, Socket } from "socket.io-client";
import { queryClient } from "../api/queryClient";
import type { MaintenanceRecord } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

class SocketManager {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(BASE_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 2000,
      transports: ["websocket"],
    });

    this.socket.on("maintenance:created", (record: MaintenanceRecord) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["assets", record.assetId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    this.socket.on("maintenance:updated", (record: MaintenanceRecord) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance", record.id] });
      queryClient.invalidateQueries({ queryKey: ["assets", record.assetId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    this.socket.on("maintenance:deleted", ({ id }: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.removeQueries({ queryKey: ["maintenance", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });
  }

  joinAsset(assetId: string) {
    this.socket?.emit("asset:join", assetId);
  }

  leaveAsset(assetId: string) {
    this.socket?.emit("asset:leave", assetId);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketManager = new SocketManager();
