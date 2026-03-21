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

// People / messaging — local mock; swap implementation when backend is ready
export interface Message {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
