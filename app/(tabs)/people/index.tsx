import { Badge, Card, EmptyState, colors, radius, spacing, typography } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { getOtherRoomMember, getPresenceForUser, usePeople, usePresence } from "@/src/hooks/usePeople";
import type { ChatRoom } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

function RoomCard({ room, currentUserId }: { room: ChatRoom; currentUserId?: string }) {
  const router = useRouter();
  const otherMember = getOtherRoomMember(room, currentUserId);
  const userIdsToCheck = useMemo(() => (otherMember ? [otherMember.id] : []), [otherMember?.id]);
  const { data: presence } = usePresence(userIdsToCheck);
  const otherPresence = getPresenceForUser(presence, otherMember);
  const dateLabel = new Date(room.lastMessage?.createdAt ?? room.updatedAt).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card onPress={() => router.push({ pathname: "/people/[roomId]", params: { roomId: room.id } })}>
      <View style={styles.roomHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{room.displayName.charAt(0)}</Text>
        </View>
        <View style={styles.roomMeta}>
          <View style={styles.roomMetaTop}>
            <Text style={styles.author} numberOfLines={1}>
              {room.displayName}
            </Text>
            {room.type === "DIRECT" && otherPresence?.status === "ONLINE" ? <Badge label="Online" variant="success" /> : null}
          </View>
          <Text style={styles.preview} numberOfLines={1}>
            {room.lastMessage?.content ?? (room.type === "GROUP" ? "Group room" : "Direct conversation")}
          </Text>
        </View>
        <View style={styles.roomRight}>
          <Text style={styles.time}>{dateLabel}</Text>
          {room.unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{room.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

export default function PeopleScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: rooms, isLoading, refetch } = usePeople(user?.id);
  const directMemberIds = useMemo(
    () =>
      (rooms ?? [])
        .filter((room) => room.type === "DIRECT")
        .map((room) => getOtherRoomMember(room, user?.id)?.id)
        .filter(Boolean) as string[],
    [rooms, user?.id],
  );
  usePresence(directMemberIds);

  return (
    <>
      <Stack.Screen
        options={{
          title: "People",
          headerLargeTitle: true,
          headerRight: () => (
            <Pressable onPress={() => router.push("/people/new")} hitSlop={8}>
              <Ionicons name="add" size={26} color={colors.primaryLight} />
            </Pressable>
          ),
        }}
      />
      <View style={styles.screen}>
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RoomCard room={item} currentUserId={user?.id} />}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustContentInsets
          automaticallyAdjustsScrollIndicatorInsets
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primaryLight} />}
          ListHeaderComponent={
            <View style={styles.headerWrap}>
              <View style={styles.infoBanner}>
                <Ionicons name="chatbubbles-outline" size={20} color={colors.primaryLight} />
                <Text style={styles.infoText}>Room list is loaded from chat APIs and updated live through the socket connection.</Text>
              </View>
            </View>
          }
          ListEmptyComponent={!isLoading ? <EmptyState icon="chatbox-ellipses-outline" title="No conversations yet" description="Rooms you are part of will appear here." /> : null}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
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
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 160,
  },
  headerWrap: {
    marginBottom: spacing.lg,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.primarySurface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.primary,
    flex: 1,
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  avatarText: {
    ...typography.bodySmall,
    color: colors.primaryLight,
    fontWeight: "700",
  },
  roomMeta: {
    flex: 1,
    marginRight: spacing.sm,
  },
  roomMetaTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
  },
  author: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  preview: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  roomRight: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: "700",
  },
});
