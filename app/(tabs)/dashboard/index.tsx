import { Card, EmptyState, MaintenanceStatusBadge, PriorityBadge, SectionHeader, colors, spacing, typography } from "@/src/components/ui";
import { hasExplicitTimeInIso } from "@/src/components/ui/dateFieldUtils";
import { useAuth } from "@/src/context/AuthContext";
import { useDashboard } from "@/src/hooks/useDashboard";
import type { MaintenanceRecord } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

interface StatCardProps {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  surface: string;
}

function StatCard({ label, value, icon, color, surface }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: surface }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MaintenanceRow({ record }: { record: MaintenanceRecord }) {
  const router = useRouter();
  const dueLabel = record.dueDate
    ? hasExplicitTimeInIso(record.dueDate)
      ? new Date(record.dueDate).toLocaleString("en-AU", {
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
        })
      : new Date(record.dueDate).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "short",
        })
    : "No due date";

  return (
    <Card
      onPress={() =>
        router.push({
          pathname: "/equipment/[id]",
          params: { id: record.assetId },
        })
      }
      style={styles.maintenanceRow}>
      <View style={styles.maintenanceRowContent}>
        <View style={styles.maintenanceInfo}>
          <Text style={styles.maintenanceTitle} numberOfLines={1}>
            {record.title}
          </Text>
          <Text style={styles.maintenanceAsset} numberOfLines={1}>
            {record.asset?.name ?? record.assetId}
          </Text>
        </View>
        <View style={styles.maintenanceMeta}>
          <PriorityBadge priority={record.priority} />
          <Text style={styles.dueDate}>{dueLabel}</Text>
        </View>
      </View>
    </Card>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { isLoading, stats, upcoming, critical, refetch } = useDashboard();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const alertItems = [...critical.filter((r) => !upcoming.find((u) => u.id === r.id)), ...upcoming].slice(0, 15);

  return (
    <>
      <Stack.Screen options={{ title: "Dashboard", headerShown: true, headerLargeTitle: true }} />
      <View style={styles.screen}>
        <FlatList
          data={alertItems}
          keyExtractor={(item) => item.id}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustContentInsets
          automaticallyAdjustsScrollIndicatorInsets
          refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={handleRefresh} tintColor={colors.primaryLight} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {/* Greeting */}
              <View style={styles.greeting}>
                <Text style={styles.greetText}>Hello, {user?.name?.split(" ")[0] ?? "there"}</Text>
                <Text style={styles.greetSub}>Here is what needs your attention today.</Text>
              </View>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <StatCard label="Total" value={stats.total} icon="cube-outline" color={colors.primaryLight} surface={colors.primarySurface} />
                <StatCard label="Active" value={stats.active} icon="checkmark-circle-outline" color={colors.success} surface={colors.successSurface} />
                <StatCard label="Maintenance" value={stats.underMaintenance} icon="construct-outline" color={colors.warning} surface={colors.warningSurface} />
              </View>

              {critical.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader title="Critical Alerts" />
                  {critical.slice(0, 3).map((r) => (
                    <View key={r.id} style={styles.alertRow}>
                      <Ionicons name="warning-outline" size={16} color={colors.critical} />
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Text style={styles.alertTitle} numberOfLines={1}>
                          {r.title}
                        </Text>
                        <Text style={styles.alertAsset} numberOfLines={1}>
                          {r.asset?.name ?? r.assetId}
                        </Text>
                      </View>
                      <MaintenanceStatusBadge status={r.status} />
                    </View>
                  ))}
                </View>
              )}

              <SectionHeader
                title="Upcoming & In Progress"
                action={
                  <Text style={styles.countLabel}>
                    {alertItems.length} item{alertItems.length !== 1 ? "s" : ""}
                  </Text>
                }
              />
            </View>
          }
          renderItem={({ item }) => <MaintenanceRow record={item} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={!isLoading ? <EmptyState icon="checkmark-done-outline" title="All caught up" description="No pending or upcoming maintenance." /> : null}
          contentContainerStyle={styles.list}
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
  listHeader: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  greeting: {
    marginBottom: spacing.xl,
  },
  greetText: {
    ...typography.h2,
    color: colors.text,
  },
  greetSub: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  statValue: {
    ...typography.h2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.criticalSurface,
    borderRadius: 10,
    padding: spacing.md,
  },
  alertTitle: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.text,
  },
  alertAsset: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  maintenanceRow: {
    padding: spacing.md,
  },
  maintenanceRowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  maintenanceInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  maintenanceTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  maintenanceAsset: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  maintenanceMeta: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  dueDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  countLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
