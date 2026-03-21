import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { AssetStatus, MaintenancePriority, MaintenanceStatus } from "../../types";
import { colors, radius, spacing, typography } from "./tokens";

type BadgeVariant = "success" | "warning" | "error" | "critical" | "muted" | "info";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = "muted" }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`]]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

// Convenience helpers for entity statuses

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const map: Record<AssetStatus, { label: string; variant: BadgeVariant }> = {
    ACTIVE: { label: "Active", variant: "success" },
    INACTIVE: { label: "Inactive", variant: "muted" },
    UNDER_MAINTENANCE: { label: "Maintenance", variant: "warning" },
  };
  const { label, variant } = map[status];
  return <Badge label={label} variant={variant} />;
}

export function PriorityBadge({ priority }: { priority: MaintenancePriority }) {
  const map: Record<MaintenancePriority, { label: string; variant: BadgeVariant }> = {
    LOW: { label: "Low", variant: "muted" },
    MEDIUM: { label: "Medium", variant: "info" },
    HIGH: { label: "High", variant: "error" },
    CRITICAL: { label: "Critical", variant: "critical" },
  };
  const { label, variant } = map[priority];
  return <Badge label={label} variant={variant} />;
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const map: Record<MaintenanceStatus, { label: string; variant: BadgeVariant }> = {
    PENDING: { label: "Pending", variant: "warning" },
    IN_PROGRESS: { label: "In Progress", variant: "info" },
    COMPLETED: { label: "Completed", variant: "success" },
    CANCELLED: { label: "Cancelled", variant: "muted" },
  };
  const { label, variant } = map[status];
  return <Badge label={label} variant={variant} />;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 1,
    borderRadius: radius.full,
  },
  text: {
    ...typography.label,
    textTransform: "uppercase",
  },

  badge_success: { backgroundColor: colors.successSurface },
  badge_warning: { backgroundColor: colors.warningSurface },
  badge_error: { backgroundColor: colors.errorSurface },
  badge_critical: { backgroundColor: colors.criticalSurface },
  badge_muted: { backgroundColor: colors.bgMuted },
  badge_info: { backgroundColor: colors.primarySurface },

  text_success: { color: colors.success },
  text_warning: { color: colors.warning },
  text_error: { color: colors.error },
  text_critical: { color: colors.critical },
  text_muted: { color: colors.textSecondary },
  text_info: { color: colors.primaryLight },
});
