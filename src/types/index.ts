export type Role = "ADMIN" | "TECHNICIAN" | "VIEWER";

export type AssetType = "VEHICLE" | "BOAT" | "LODGE";
export type AssetStatus = "ACTIVE" | "INACTIVE" | "UNDER_MAINTENANCE";

export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type MaintenanceStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  description?: string;
  status: AssetStatus;
  location?: string;
  createdAt: string;
  updatedAt: string;
  maintenanceRecords?: MaintenanceRecord[];
}

export interface MaintenanceRecord {
  id: string;
  title: string;
  description?: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assetId: string;
  asset?: Asset;
  assignedToId?: string;
  assignedTo?: User;
  createdById: string;
  createdBy?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AssetFormData {
  name: string;
  type: AssetType;
  description?: string;
  status?: AssetStatus;
  location?: string;
}

export interface MaintenanceFormData {
  title: string;
  description?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  dueDate?: string;
  assetId: string;
  assignedToId?: string;
}

export type ChatRoomType = "GROUP" | "DIRECT";
export type ChatRoomMemberRole = "OWNER" | "MEMBER";
export type ChatMessageType = "TEXT";
export type PresenceStatus = "ONLINE" | "OFFLINE";

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  type: ChatMessageType;
  content: string;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender: User;
}

export interface ChatRoomMember {
  userId: string;
  role: ChatRoomMemberRole;
  joinedAt: string;
  lastReadAt: string;
  user: User;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: ChatRoomType;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  displayName: string;
  memberCount: number;
  members: ChatRoomMember[];
  lastMessage?: ChatMessage | null;
  unreadCount: number;
}

export interface Presence {
  userId: string;
  status: PresenceStatus;
  lastSeen: string;
  updatedAt: string;
}

export interface ChatMessagesResponse {
  data: ChatMessage[];
  pageInfo: {
    hasMore: boolean;
    nextCursor?: string | null;
    limit: number;
  };
}

export interface ChatReadState {
  roomId: string;
  userId: string;
  lastReadAt: string;
}

export interface DirectRoomResponse {
  room: Pick<ChatRoom, "id">;
  created: boolean;
}

export interface AckSuccess<T> {
  ok: true;
  data: T;
}

export interface AckFailure {
  ok: false;
  error: string;
  status?: number;
}

export type SocketAck<T> = AckSuccess<T> | AckFailure;

export interface SocketReadyPayload {
  userId: string;
  roomIds: string[];
}

export interface SocketErrorPayload {
  ok: false;
  error: string;
  status?: number;
}

export interface AssetDeletedPayload {
  id: string;
}

export interface MaintenanceDeletedPayload {
  id: string;
  assetId: string;
}

export interface ChatRoomRemovedPayload {
  roomId: string;
  userId: string;
}

export interface ChatMessageCreatedPayload {
  roomId: string;
  message: {
    id: string;
  };
}

export interface ChatRoomJoinPayload {
  roomId: string;
}

export interface ChatRoomLeavePayload {
  roomId: string;
}

export interface ChatSendMessagePayload {
  roomId?: string;
  recipientId?: string;
  content: string;
  type?: ChatMessageType;
}

export interface ChatSendMessageResult {
  roomId: string;
  roomCreated: boolean;
  message: {
    id: string;
  };
}

export interface ApiError {
  message: string;
  status?: number;
}

// ── Maintenance Comments ──────────────────────────────────────────────

export interface MaintenanceComment {
  id: string;
  content: string;
  maintenanceRecordId: string;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceCommentsResponse {
  data: MaintenanceComment[];
  pageInfo: {
    hasMore: boolean;
    nextCursor?: string | null;
    limit: number;
  };
}

export interface MaintenanceCommentCreatedPayload {
  maintenanceRecordId: string;
  comment: { id: string };
}

// ── Asset Comments ────────────────────────────────────────────────────

export interface AssetComment {
  id: string;
  content: string;
  assetId: string;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface AssetCommentsResponse {
  data: AssetComment[];
  pageInfo: {
    hasMore: boolean;
    nextCursor?: string | null;
    limit: number;
  };
}

export interface AssetCommentCreatedPayload {
  assetId: string;
  comment: { id: string };
}

// ── Notifications ─────────────────────────────────────────────────────

export type NotificationType = "MAINTENANCE_ASSIGNED" | "MAINTENANCE_COMMENT" | "MAINTENANCE_STATUS_CHANGED";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
  recipientId: string;
  /** Polymorphic reference to the resource that triggered the notification */
  resourceType?: string;
  resourceId?: string;
}

export interface NotificationsResponse {
  data: AppNotification[];
  pageInfo: {
    hasMore: boolean;
    nextCursor?: string | null;
    limit: number;
  };
}

export interface NotificationCreatedPayload {
  notification: AppNotification;
}

export interface UnreadNotificationCountPayload {
  count: number;
}
