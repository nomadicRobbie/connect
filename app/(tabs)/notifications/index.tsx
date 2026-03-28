import { EmptyState, colors, radius, spacing, typography } from "@/src/components/ui";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/src/hooks/useNotifications";
import type { AppNotification } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  MAINTENANCE_ASSIGNED: "person-add-outline",
  MAINTENANCE_COMMENT: "chatbubble-outline",
  MAINTENANCE_STATUS_CHANGED: "sync-outline",
};

function NotificationRow({ notification, onPress }: { notification: AppNotification; onPress: () => void }) {
  const isUnread = !notification.readAt;
  const icon = ICON_MAP[notification.type] ?? "notifications-outline";
  const timeLabel = new Date(notification.createdAt).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Pressable onPress={onPress} style={[styles.row, isUnread && styles.rowUnread]}>
      <View style={[styles.iconWrap, isUnread ? styles.iconWrapUnread : styles.iconWrapRead]}>
        <Ionicons name={icon} size={18} color={isUnread ? colors.primaryLight : colors.textMuted} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, isUnread && styles.rowTitleUnread]} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.rowBody} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.rowTime}>{timeLabel}</Text>
      </View>
      {isUnread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useNotifications();
  const { mutateAsync: markRead } = useMarkNotificationRead();
  const { mutateAsync: markAllRead, isPending: markingAll } = useMarkAllNotificationsRead();

  const notifications = useMemo(() => (data?.pages ?? []).flatMap((page) => page.data), [data]);
  const hasUnread = notifications.some((n) => !n.readAt);

  const handlePress = async (notification: AppNotification) => {
    if (!notification.readAt) {
      void markRead(notification.id).catch(() => undefined);
    }

    if (notification.resourceType === "maintenance" && notification.resourceId) {
      router.push(`/(tabs)/equipment/maintenance/${notification.resourceId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
    } catch {
      // silent
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Notifications",
          headerLargeTitle: true,
          headerRight: () =>
            hasUnread ? (
              <Pressable onPress={handleMarkAllRead} disabled={markingAll}>
                <Text style={styles.markAllText}>{markingAll ? "Marking…" : "Mark all read"}</Text>
              </Pressable>
            ) : null,
        }}
      />
      <View style={styles.screen}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxxl }} color={colors.primaryLight} />
        ) : notifications.length === 0 ? (
          <EmptyState icon="notifications-off-outline" title="No notifications" />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <NotificationRow notification={item} onPress={() => handlePress(item)} />}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.lg }]}
            contentInsetAdjustmentBehavior="automatic"
            automaticallyAdjustContentInsets
            automaticallyAdjustsScrollIndicatorInsets
            onRefresh={refetch}
            refreshing={false}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ padding: spacing.lg }} color={colors.primaryLight} /> : null}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  markAllText: {
    ...typography.bodySmall,
    color: colors.primaryLight,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowUnread: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primaryLight,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapUnread: {
    backgroundColor: "rgba(59,130,246,0.12)",
  },
  iconWrapRead: {
    backgroundColor: colors.bgMuted,
  },
  rowContent: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    ...typography.body,
    color: colors.text,
  },
  rowTitleUnread: {
    fontWeight: "600",
  },
  rowBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  rowTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryLight,
    marginTop: spacing.xs,
  },
});
