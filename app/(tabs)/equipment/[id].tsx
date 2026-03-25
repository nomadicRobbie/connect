import {
    AssetStatusBadge,
    Button,
    Card,
    CardRow,
    colors,
    EmptyState,
    MaintenanceStatusBadge,
    PriorityBadge,
    radius,
    Screen,
    SectionHeader,
    spacing,
    typography,
} from "@/src/components/ui";
import { hasExplicitTimeInIso } from "@/src/components/ui/dateFieldUtils";
import { useAuth } from "@/src/context/AuthContext";
import { useAssetDetail, useDeleteAsset } from "@/src/hooks/useAssets";
import type { MaintenanceRecord } from "@/src/types";
import { can } from "@/src/utils/permissions";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  VEHICLE: "car-outline",
  BOAT: "boat-outline",
  LODGE: "home-outline",
};

function MaintenanceItem({ record, assetId }: { record: MaintenanceRecord; assetId: string }) {
  const router = useRouter();
  const dueLabel = record.dueDate
    ? hasExplicitTimeInIso(record.dueDate)
      ? new Date(record.dueDate).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
      : new Date(record.dueDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <Card onPress={() => router.push({ pathname: "/equipment/maintenance/[id]", params: { id: record.id, assetId } })} style={styles.maintenanceItem}>
      <View style={styles.maintenanceHeader}>
        <Text style={styles.maintenanceTitle} numberOfLines={2}>
          {record.title}
        </Text>
        <PriorityBadge priority={record.priority} />
      </View>
      <View style={styles.maintenanceMeta}>
        <MaintenanceStatusBadge status={record.status} />
        <Text style={styles.dueDate}>Due: {dueLabel}</Text>
      </View>
      {record.assignedTo && <Text style={styles.assignedText}>Assigned to {record.assignedTo.name}</Text>}
    </Card>
  );
}

export default function AssetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: asset, isLoading } = useAssetDetail(id!);
  const { mutate: deleteAsset, isPending: deleting } = useDeleteAsset();

  const canEdit = can(user?.role, "asset:update");
  const canDelete = can(user?.role, "asset:delete");
  const canAddMaintenance = can(user?.role, "maintenance:create");

  const handleDelete = () => {
    Alert.alert("Delete Asset", `Are you sure you want to delete "${asset?.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteAsset(id!, {
            onSuccess: () => router.back(),
            onError: (err) => Alert.alert("Error", err.message),
          }),
      },
    ]);
  };

  const icon = asset ? (TYPE_ICONS[asset.type] ?? "cube-outline") : "cube-outline";

  if (!asset && !isLoading) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Asset" }} />
        <EmptyState icon="alert-circle-outline" title="Asset not found" />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: asset?.name ?? "Asset",
          headerRight: canEdit
            ? () => (
                <Pressable onPress={() => router.push({ pathname: "/equipment/form/[id]", params: { id: id! } })} style={{ paddingHorizontal: spacing.sm }}>
                  <Ionicons name="create-outline" size={22} color={colors.primaryLight} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <Screen scroll>
        {asset && (
          <>
            {/* Asset header */}
            <View style={styles.assetHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name={icon} size={36} color={colors.primaryLight} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetType}>{asset.type.charAt(0) + asset.type.slice(1).toLowerCase()}</Text>
                <View style={{ marginTop: spacing.xs }}>
                  <AssetStatusBadge status={asset.status} />
                </View>
              </View>
            </View>

            {/* Details card */}
            <Card style={styles.detailsCard}>
              {asset.location && <CardRow label="Location" value={asset.location} />}
              {asset.description && <CardRow label="Description" value={asset.description} />}
              <CardRow
                label="Created"
                value={new Date(asset.createdAt).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
              <CardRow
                label="Last Updated"
                value={new Date(asset.updatedAt).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
            </Card>

            {/* Maintenance records */}
            <View style={styles.maintenanceSection}>
              <SectionHeader
                title="Maintenance Records"
                action={
                  canAddMaintenance ? (
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/equipment/maintenance/new",
                          params: { assetId: id!, assetName: asset.name },
                        })
                      }
                      style={styles.addBtn}>
                      <Ionicons name="add" size={16} color={colors.primaryLight} />
                      <Text style={styles.addBtnText}>Add</Text>
                    </Pressable>
                  ) : null
                }
              />
              {(asset.maintenanceRecords ?? []).length === 0 ? (
                <EmptyState icon="build-outline" title="No maintenance records" description="Records added to this asset will appear here." />
              ) : (
                <View style={{ gap: spacing.sm }}>
                  {(asset.maintenanceRecords ?? []).map((record) => (
                    <MaintenanceItem key={record.id} record={record} assetId={id!} />
                  ))}
                </View>
              )}
            </View>

            {/* Danger zone */}
            {canDelete && (
              <View style={styles.dangerZone}>
                <Button label={deleting ? "Deleting…" : "Delete Asset"} variant="destructive" fullWidth loading={deleting} onPress={handleDelete} />
              </View>
            )}
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  assetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  assetName: {
    ...typography.h2,
    color: colors.text,
  },
  assetType: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  detailsCard: {
    marginBottom: spacing.xl,
  },
  maintenanceSection: {
    marginBottom: spacing.xl,
  },
  maintenanceItem: {
    gap: spacing.sm,
  },
  maintenanceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  maintenanceTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  maintenanceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dueDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  assignedText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
  },
  addBtnText: {
    ...typography.bodySmall,
    color: colors.primaryLight,
    fontWeight: "600",
  },
  dangerZone: {
    marginTop: spacing.lg,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
