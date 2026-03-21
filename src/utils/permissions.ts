import type { Role } from "../types";

type Permission = "asset:create" | "asset:update" | "asset:delete" | "maintenance:create" | "maintenance:update" | "maintenance:delete";

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: ["asset:create", "asset:update", "asset:delete", "maintenance:create", "maintenance:update", "maintenance:delete"],
  TECHNICIAN: ["asset:create", "asset:update", "maintenance:create", "maintenance:update"],
  VIEWER: [],
};

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
}
