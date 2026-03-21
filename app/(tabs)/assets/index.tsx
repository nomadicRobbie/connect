import { AssetStatusBadge, Card, EmptyState, colors, radius, spacing, typography } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { useAssets } from "@/src/hooks/useAssets";
import type { Asset, AssetStatus, AssetType } from "@/src/types";
import { can } from "@/src/utils/permissions";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

const TYPE_ICONS: Record<AssetType, keyof typeof Ionicons.glyphMap> = {
  VEHICLE: "car-outline",
  BOAT: "boat-outline",
  LODGE: "home-outline",
};

const TYPE_FILTERS: { label: string; value: AssetType | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Vehicles", value: "VEHICLE" },
  { label: "Boats", value: "BOAT" },
  { label: "Lodges", value: "LODGE" },
];

const STATUS_FILTERS: { label: string; value: AssetStatus | undefined }[] = [
  { label: "Any Status", value: undefined },
  { label: "Active", value: "ACTIVE" },
  { label: "Maintenance", value: "UNDER_MAINTENANCE" },
  { label: "Inactive", value: "INACTIVE" },
];

function AssetCard({ asset }: { asset: Asset }) {
  const router = useRouter();
  const icon = TYPE_ICONS[asset.type] ?? "cube-outline";

  return (
    <Card onPress={() => router.push({ pathname: "/assets/[id]", params: { id: asset.id } })}>
      <View style={styles.assetRow}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={24} color={colors.primaryLight} />
        </View>
        <View style={styles.assetInfo}>
          <Text style={styles.assetName} numberOfLines={1}>
            {asset.name}
          </Text>
          <Text style={styles.assetMeta}>
            {asset.type.charAt(0) + asset.type.slice(1).toLowerCase()}
            {asset.location ? ` · ${asset.location}` : ""}
          </Text>
        </View>
        <View style={styles.assetRight}>
          <AssetStatusBadge status={asset.status} />
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginTop: spacing.xs }} />
        </View>
      </View>
    </Card>
  );
}

export default function AssetsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState<AssetType | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<AssetStatus | undefined>(undefined);

  const { data: assets, isLoading, refetch } = useAssets(typeFilter || statusFilter ? { type: typeFilter, status: statusFilter } : undefined);

  const canCreate = can(user?.role, "asset:create");

  return (
    <>
      <Stack.Screen
        options={{
          title: "Assets",
          headerRight: canCreate
            ? () => (
                <Pressable onPress={() => router.push("/assets/form/new")} style={styles.headerBtn}>
                  <Ionicons name="add" size={26} color={colors.primaryLight} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <View style={styles.screen}>
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AssetCard asset={item} />}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustContentInsets
          automaticallyAdjustsScrollIndicatorInsets
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.filterRow}>
                {TYPE_FILTERS.map((f) => (
                  <Pressable key={f.label} onPress={() => setTypeFilter(f.value)} style={[styles.filterChip, typeFilter === f.value && styles.filterChipActive]}>
                    <Text style={[styles.filterText, typeFilter === f.value && styles.filterTextActive]}>{f.label}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={[styles.filterRow, styles.filterRowSecond]}>
                {STATUS_FILTERS.map((f) => (
                  <Pressable key={f.label} onPress={() => setStatusFilter(f.value)} style={[styles.filterChip, statusFilter === f.value && styles.filterChipActive]}>
                    <Text style={[styles.filterText, statusFilter === f.value && styles.filterTextActive]}>{f.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primaryLight} />}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                icon="cube-outline"
                title="No assets found"
                description="Try adjusting your filters or add a new asset."
                action={
                  canCreate ? (
                    <Pressable onPress={() => router.push("/assets/form/new")} style={styles.emptyAction}>
                      <Text style={styles.emptyActionText}>+ Add Asset</Text>
                    </Pressable>
                  ) : undefined
                }
              />
            ) : null
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerBtn: {
    paddingHorizontal: spacing.sm,
  },
  listHeader: {
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    flexWrap: "nowrap",
  },
  filterRowSecond: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterChipActive: {
    borderColor: colors.primaryLight,
    backgroundColor: colors.primarySurface,
  },
  filterText: {
    ...typography.bodySmall,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primaryLight,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  assetMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  assetRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  emptyAction: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  emptyActionText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: "600",
  },
});
