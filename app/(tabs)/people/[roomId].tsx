import { sortMessagesChronologically } from "@/src/api/chat";
import { Card, EmptyState, colors, radius, spacing, typography } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { getOtherRoomMember, getPresenceForUser, useChatRoom, useMarkRoomRead, usePresence, useRoomMessages, useSendChatMessage } from "@/src/hooks/usePeople";
import type { ChatMessage } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function MessageBubble({ message, currentUserId }: { message: ChatMessage; currentUserId?: string }) {
  const mine = message.senderId === currentUserId;
  const timeLabel = new Date(message.createdAt).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowOther]}>
      <View style={[styles.messageBubble, mine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
        {!mine ? <Text style={styles.senderName}>{message.sender.name}</Text> : null}
        <Text style={[styles.messageText, mine ? styles.messageTextMine : styles.messageTextOther]}>{message.content}</Text>
        <Text style={[styles.messageTime, mine ? styles.messageTimeMine : styles.messageTimeOther]}>{timeLabel}</Text>
      </View>
    </View>
  );
}

export default function RoomScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { data: room, isLoading: roomLoading } = useChatRoom(roomId!);
  const canLoadMessages = !!room && !roomLoading;
  const { data, isLoading: messagesLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useRoomMessages(roomId!, canLoadMessages);
  const { mutateAsync: sendMessage, isPending: sending } = useSendChatMessage();
  const { mutateAsync: markRead } = useMarkRoomRead();
  const [draft, setDraft] = useState("");
  const markedRoomRef = useRef<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const messages = useMemo(() => sortMessagesChronologically((data?.pages ?? []).flatMap((page) => page.data)), [data]);

  const otherMember = useMemo(() => (room ? getOtherRoomMember(room, user?.id) : undefined), [room, user?.id]);
  const { data: presence } = usePresence(otherMember ? [otherMember.id] : []);
  const otherPresence = getPresenceForUser(presence, otherMember);

  useEffect(() => {
    if (!roomId || !room) return;
    if (markedRoomRef.current === roomId) return;
    markedRoomRef.current = roomId;
    void markRead(roomId).catch(() => undefined);
  }, [markRead, roomId, room?.id]);

  const handleSend = async () => {
    if (!draft.trim()) return;
    await sendMessage({ roomId: roomId!, content: draft.trim(), type: "TEXT" });
    setDraft("");
  };

  if (!room && !roomLoading) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: "Conversation" }} />
        <EmptyState icon="chatbox-ellipses-outline" title="Conversation not found" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: room?.displayName ?? "Conversation",
          headerBackTitle: "People",
          headerLeft: () => (
            <Pressable onPress={() => router.replace("/(tabs)/people")}>
              <Ionicons name="chevron-back" size={24} color={colors.primaryLight} />
            </Pressable>
          ),
          headerRight: () =>
            otherMember && otherPresence?.status === "ONLINE" ? (
              <View style={styles.headerPresence}>
                <Ionicons name="ellipse" size={10} color={colors.success} />
                <Text style={styles.headerPresenceText}>Online</Text>
              </View>
            ) : null,
        }}
      />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} currentUserId={user?.id} />}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustContentInsets
          automaticallyAdjustsScrollIndicatorInsets
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListHeaderComponent={
            <>
              {hasNextPage ? (
                <Pressable style={styles.loadEarlier} onPress={() => void fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? <ActivityIndicator size="small" color={colors.primaryLight} /> : <Text style={styles.loadEarlierText}>Load earlier messages</Text>}
                </Pressable>
              ) : null}
              {room ? (
                <Card style={styles.threadHeader}>
                  <Text style={styles.threadTitle}>{room.displayName}</Text>
                  <Text style={styles.threadMeta}>
                    {room.memberCount} member{room.memberCount !== 1 ? "s" : ""}
                    {otherMember && otherPresence ? ` · ${otherPresence.status.toLowerCase()}` : ""}
                  </Text>
                </Card>
              ) : null}
            </>
          }
          ListEmptyComponent={!messagesLoading ? <EmptyState icon="chatbubble-outline" title="No messages yet" description="Start the conversation below." /> : null}
          contentContainerStyle={styles.threadList}
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <TextInput
            style={styles.composerInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor={colors.textMuted}
            multiline
            returnKeyType="default"
          />
          <Pressable style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]} onPress={() => void handleSend()} disabled={!draft.trim() || sending}>
            {sending ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Ionicons name="arrow-up" size={20} color={colors.textInverse} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerPresence: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerPresenceText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: "600",
  },
  threadHeader: {
    marginBottom: spacing.lg,
  },
  threadTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  threadMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  threadList: {
    padding: spacing.lg,
    paddingBottom: 140,
  },
  loadEarlier: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  loadEarlierText: {
    ...typography.bodySmall,
    color: colors.primaryLight,
    fontWeight: "600",
  },
  messageRow: {
    flexDirection: "row",
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "82%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageBubbleMine: {
    backgroundColor: colors.primary,
  },
  messageBubbleOther: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  senderName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  messageText: {
    ...typography.body,
  },
  messageTextMine: {
    color: colors.textInverse,
  },
  messageTextOther: {
    color: colors.text,
  },
  messageTime: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  messageTimeMine: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "right",
  },
  messageTimeOther: {
    color: colors.textMuted,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  composerInput: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm + 2,
    ...typography.body,
    color: colors.text,
    maxHeight: 120,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: colors.bgMuted,
  },
});
