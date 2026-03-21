import { Button, EmptyState, Input, SectionHeader, colors, radius, spacing, typography } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { useCreateDirectRoom, useCreateGroupRoom, useKnownContacts } from "@/src/hooks/usePeople";
import type { User } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function ContactRow({ contact, onPress, selected, showCheck }: { contact: User; onPress: () => void; selected?: boolean; showCheck?: boolean }) {
  return (
    <Pressable style={({ pressed }) => [styles.contactCard, pressed && styles.contactCardPressed]} onPress={onPress}>
      <View style={styles.contactAvatar}>
        <Text style={styles.contactAvatarText}>{contact.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactEmail}>{contact.email}</Text>
      </View>
      {showCheck ? (
        <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={22} color={selected ? colors.primary : colors.border} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

export default function NewConversationScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"dm" | "group">("dm");
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const contacts = useKnownContacts(user?.id);
  const { mutateAsync: createDM, isPending: creatingDM } = useCreateDirectRoom();
  const { mutateAsync: createGroup, isPending: creatingGroup } = useCreateGroupRoom();

  const handleSelectDM = async (userId: string) => {
    const { room } = await createDM(userId);
    router.replace({ pathname: "/people/[roomId]", params: { roomId: room.id } });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedIds.size === 0) return;
    const room = await createGroup({ name: groupName.trim(), memberIds: Array.from(selectedIds) });
    router.replace({ pathname: "/people/[roomId]", params: { roomId: room.id } });
  };

  const toggleContact = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: "New Conversation", presentation: "modal" }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled">
        {/* Mode toggle */}
        <View style={styles.modeTabs}>
          <Pressable style={[styles.modeTab, mode === "dm" && styles.modeTabActive]} onPress={() => setMode("dm")}>
            <Ionicons name="person-circle-outline" size={18} color={mode === "dm" ? colors.primary : colors.textMuted} />
            <Text style={[styles.modeTabLabel, mode === "dm" && styles.modeTabLabelActive]}>Direct Message</Text>
          </Pressable>
          <Pressable style={[styles.modeTab, mode === "group" && styles.modeTabActive]} onPress={() => setMode("group")}>
            <Ionicons name="people-circle-outline" size={18} color={mode === "group" ? colors.primary : colors.textMuted} />
            <Text style={[styles.modeTabLabel, mode === "group" && styles.modeTabLabelActive]}>Group Room</Text>
          </Pressable>
        </View>

        {mode === "dm" ? (
          contacts.length === 0 ? (
            <EmptyState icon="person-outline" title="No contacts yet" description="Contacts appear here once you share a room with other users." />
          ) : (
            <View style={styles.section}>
              <SectionHeader title="Select a contact" />
              {contacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  onPress={() => {
                    if (!creatingDM) void handleSelectDM(contact.id);
                  }}
                />
              ))}
            </View>
          )
        ) : (
          <View style={styles.groupForm}>
            <Input label="Room name" value={groupName} onChangeText={setGroupName} placeholder="e.g. Field Team Alpha" />
            {contacts.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Add members" action={selectedIds.size > 0 ? <Text style={styles.selectedCount}>{selectedIds.size} selected</Text> : undefined} />
                {contacts.map((contact) => (
                  <ContactRow key={contact.id} contact={contact} onPress={() => toggleContact(contact.id)} selected={selectedIds.has(contact.id)} showCheck />
                ))}
              </View>
            ) : (
              <EmptyState icon="people-outline" title="No contacts yet" description="Contacts appear here once you share a room with other users." />
            )}
            <Button label="Create Group Room" onPress={() => void handleCreateGroup()} loading={creatingGroup} disabled={!groupName.trim() || selectedIds.size === 0} />
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
  },
  modeTabs: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  modeTabActive: {
    backgroundColor: colors.primarySurface,
  },
  modeTabLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontWeight: "600",
  },
  modeTabLabelActive: {
    color: colors.primary,
  },
  section: {
    gap: spacing.sm,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactCardPressed: {
    opacity: 0.7,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "700",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  contactEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  groupForm: {
    gap: spacing.lg,
  },
  selectedCount: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
});
