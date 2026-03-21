import { Button, Card, EmptyState, Input, colors, radius, spacing, typography } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { usePeople } from "@/src/hooks/usePeople";
import type { Message } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

function MessageCard({ item }: { item: Message }) {
  const dateLabel = new Date(item.createdAt).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card>
      <View style={styles.messageHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.authorName.charAt(0)}</Text>
        </View>
        <View style={styles.messageMeta}>
          <Text style={styles.author}>{item.authorName}</Text>
          <Text style={styles.time}>{dateLabel}</Text>
        </View>
      </View>
      <Text style={styles.content}>{item.content}</Text>
    </Card>
  );
}

export default function PeopleScreen() {
  const { user } = useAuth();
  const { messages, isLoading, isSending, loadMessages, sendMessage } = usePeople();
  const [draft, setDraft] = useState("");

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const handleSend = async () => {
    if (!draft.trim() || !user) return;
    await sendMessage(draft.trim(), user);
    setDraft("");
  };

  return (
    <>
      <Stack.Screen options={{ title: "People", headerLargeTitle: true }} />
      <View style={styles.screen}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageCard item={item} />}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustContentInsets
          automaticallyAdjustsScrollIndicatorInsets
          ListHeaderComponent={
            <View style={styles.headerWrap}>
              <View style={styles.infoBanner}>
                <Ionicons name="chatbubbles-outline" size={20} color={colors.primaryLight} />
                <Text style={styles.infoText}>Crew board for quick updates. This is wired to a mock adapter until messaging endpoints are available.</Text>
              </View>
            </View>
          }
          ListEmptyComponent={!isLoading ? <EmptyState icon="chatbox-ellipses-outline" title="No updates yet" description="Post the first message to start the board." /> : null}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          contentContainerStyle={styles.list}
        />

        <View style={styles.composer}>
          <Input label="Post Update" value={draft} onChangeText={setDraft} placeholder="Share a maintenance update or handover note" multiline />
          <Button label="Post" onPress={handleSend} loading={isSending} disabled={!draft.trim() || !user} />
        </View>
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
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
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
  messageMeta: {
    flex: 1,
  },
  author: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  content: {
    ...typography.body,
    color: colors.text,
  },
  composer: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
});
