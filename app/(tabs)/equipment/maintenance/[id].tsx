import { Button, DateField, EmptyState, Input, Screen, SectionHeader, SelectField, TimeField, colors, radius, spacing, typography } from "@/src/components/ui";
import { calendarDateFromIso, hasExplicitTimeInIso, isoStringFromCalendarDateAndTime, timeStringFromIso } from "@/src/components/ui/dateFieldUtils";
import { useAuth } from "@/src/context/AuthContext";
import { useCreateComment, useMaintenanceComments } from "@/src/hooks/useComments";
import { useMaintenanceRecord, useUpdateMaintenance } from "@/src/hooks/useMaintenance";
import { useAssignableUsers } from "@/src/hooks/usePeople";
import type { MaintenanceComment, MaintenanceFormData, MaintenancePriority, MaintenanceStatus } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_OPTIONS: { label: string; value: MaintenanceStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const PRIORITY_OPTIONS: { label: string; value: MaintenancePriority }[] = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
];

function CommentBubble({ comment, currentUserId }: { comment: MaintenanceComment; currentUserId?: string }) {
  const mine = comment.authorId === currentUserId;
  const timeLabel = new Date(comment.createdAt).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View style={[commentStyles.row, mine ? commentStyles.rowMine : commentStyles.rowOther]}>
      <View style={[commentStyles.bubble, mine ? commentStyles.bubbleMine : commentStyles.bubbleOther]}>
        {!mine ? <Text style={commentStyles.author}>{comment.author.name}</Text> : null}
        <Text style={[commentStyles.content, mine ? commentStyles.contentMine : commentStyles.contentOther]}>{comment.content}</Text>
        <Text style={[commentStyles.time, mine ? commentStyles.timeMine : commentStyles.timeOther]}>{timeLabel}</Text>
      </View>
    </View>
  );
}

export default function EditMaintenanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, assetId } = useLocalSearchParams<{ id: string; assetId?: string }>();
  const { data: record, isLoading } = useMaintenanceRecord(id!);
  const { mutateAsync: updateRecord, isPending } = useUpdateMaintenance(id!);
  const { user } = useAuth();
  const { data: assignableUsers = [] } = useAssignableUsers(user?.id);

  // Comments
  const { data: commentsData, isLoading: commentsLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMaintenanceComments(id!, !!record);
  const { mutateAsync: createComment, isPending: sendingComment } = useCreateComment(id!);
  const [commentDraft, setCommentDraft] = useState("");

  const comments = useMemo(
    () => [...(commentsData?.pages ?? []).flatMap((page) => page.data)].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [commentsData],
  );

  const [form, setForm] = useState<MaintenanceFormData>({
    title: "",
    description: "",
    status: "PENDING",
    priority: "MEDIUM",
    dueDate: "",
    assetId: assetId ?? "",
    assignedToId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [includeDueTime, setIncludeDueTime] = useState(false);
  const [dueTime, setDueTime] = useState("09:00");

  const assigneeOptions = useMemo(() => {
    const options = [{ label: "Unassigned", value: "" }, ...assignableUsers.map((entry) => ({ label: entry.name, value: entry.id }))];

    if (form.assignedToId && !options.some((option) => option.value === form.assignedToId)) {
      options.push({
        label: record?.assignedTo?.name ? `${record.assignedTo.name} (current)` : "Current assignee",
        value: form.assignedToId,
      });
    }

    return options;
  }, [assignableUsers, form.assignedToId, record?.assignedTo?.name]);

  useEffect(() => {
    if (record) {
      setForm({
        title: record.title,
        description: record.description ?? "",
        status: record.status,
        priority: record.priority,
        dueDate: record.dueDate ?? "",
        assetId: record.assetId,
        assignedToId: record.assignedToId ?? "",
      });

      const includeTime = hasExplicitTimeInIso(record.dueDate);
      setIncludeDueTime(includeTime);
      setDueTime(includeTime ? timeStringFromIso(record.dueDate) || "09:00" : "09:00");
    }
  }, [record]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.assetId) e.assetId = "Missing asset";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const dueCalendarDate = calendarDateFromIso(form.dueDate);
    const dueWithTime = dueCalendarDate ? isoStringFromCalendarDateAndTime(dueCalendarDate, dueTime) : undefined;
    const normalizedDueDate = includeDueTime ? dueWithTime || form.dueDate || undefined : form.dueDate || undefined;

    try {
      await updateRecord({
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        status: form.status,
        priority: form.priority,
        dueDate: normalizedDueDate,
        assetId: form.assetId,
        assignedToId: form.assignedToId?.trim() || undefined,
      });
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update maintenance record";
      Alert.alert("Error", message);
    }
  };

  const handleSendComment = async () => {
    const text = commentDraft.trim();
    if (!text) return;
    try {
      await createComment(text);
      setCommentDraft("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send comment";
      Alert.alert("Error", message);
    }
  };

  if (!record && !isLoading) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Edit Maintenance Record" }} />
        <EmptyState icon="alert-circle-outline" title="Record not found" />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Maintenance Record" }} />
      <Screen scroll keyboardAvoiding>
        <View style={styles.header}>
          <Text style={styles.title}>Update maintenance</Text>
          <Text style={styles.subtitle}>Keep priority, status, and due date current so the dashboard stays accurate.</Text>
        </View>

        <View style={styles.form}>
          <Input label="Title" value={form.title} onChangeText={(title) => setForm((prev) => ({ ...prev, title }))} error={errors.title} placeholder="Replace front brake pads" />
          <SelectField label="Priority" value={form.priority} onChange={(priority) => setForm((prev) => ({ ...prev, priority }))} options={PRIORITY_OPTIONS} />
          <SelectField label="Status" value={form.status} onChange={(status) => setForm((prev) => ({ ...prev, status }))} options={STATUS_OPTIONS} />
          <DateField
            label="Due Date"
            value={form.dueDate}
            onChange={(dueDate?: string) => {
              setForm((prev) => ({ ...prev, dueDate: dueDate ?? "" }));
              if (!dueDate) {
                setIncludeDueTime(false);
                setDueTime("09:00");
                return;
              }

              if (hasExplicitTimeInIso(dueDate)) {
                setIncludeDueTime(true);
                setDueTime(timeStringFromIso(dueDate) || "09:00");
              }
            }}
            hint="Optional. Selected dates are sent to the server as ISO strings."
          />
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleLabel}>Schedule exact time</Text>
              <Text style={styles.toggleHint}>{form.dueDate ? "Optional. Add appointment time." : "Select a due date to enable time."}</Text>
            </View>
            <Switch
              value={includeDueTime}
              onValueChange={setIncludeDueTime}
              disabled={!form.dueDate}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.textInverse}
            />
          </View>
          {includeDueTime && form.dueDate ? (
            <TimeField label="Due Time" value={dueTime} onChange={(value?: string) => setDueTime(value ?? "")} hint="Optional. Uses local time and is saved as ISO." />
          ) : null}
          <SelectField label="Assigned To" value={form.assignedToId} onChange={(assignedToId) => setForm((prev) => ({ ...prev, assignedToId }))} options={assigneeOptions} />
          <Input
            label="Description"
            value={form.description}
            onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
            multiline
            placeholder="Work steps, parts required, notes"
          />
        </View>

        <View style={styles.actions}>
          <Button label="Save Changes" onPress={handleSubmit} loading={isPending} fullWidth size="lg" />
        </View>

        {/* ── Comments ───────────────────────────────────────────── */}
        <View style={commentStyles.section}>
          <SectionHeader title="Comments" />

          {commentsLoading ? (
            <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.primaryLight} />
          ) : comments.length === 0 ? (
            <Text style={commentStyles.empty}>No comments yet. Be the first to add one.</Text>
          ) : (
            <View style={commentStyles.list}>
              {hasNextPage ? (
                <Pressable onPress={() => fetchNextPage()} disabled={isFetchingNextPage} style={commentStyles.loadMore}>
                  {isFetchingNextPage ? <ActivityIndicator size="small" color={colors.primaryLight} /> : <Text style={commentStyles.loadMoreText}>Load earlier comments</Text>}
                </Pressable>
              ) : null}
              {comments.map((comment) => (
                <CommentBubble key={comment.id} comment={comment} currentUserId={user?.id} />
              ))}
            </View>
          )}

          <View style={[commentStyles.composer, { paddingBottom: insets.bottom || spacing.sm }]}>
            <TextInput
              style={commentStyles.input}
              value={commentDraft}
              onChangeText={setCommentDraft}
              placeholder="Write a comment…"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={handleSendComment}
              disabled={!commentDraft.trim() || sendingComment}
              style={[commentStyles.sendBtn, (!commentDraft.trim() || sendingComment) && commentStyles.sendBtnDisabled]}>
              {sendingComment ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Ionicons name="send" size={18} color={colors.textInverse} />}
            </Pressable>
          </View>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.lg,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  toggleTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  toggleHint: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  actions: {
    marginTop: spacing.xl,
  },
});

const commentStyles = StyleSheet.create({
  section: {
    marginTop: spacing.xxl,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginVertical: spacing.lg,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  loadMore: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
  },
  loadMoreText: {
    ...typography.bodySmall,
    color: colors.primaryLight,
    fontWeight: "600",
  },
  row: {
    marginBottom: spacing.xs,
  },
  rowMine: {
    alignItems: "flex-end",
  },
  rowOther: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMine: {
    backgroundColor: colors.primaryLight,
    borderBottomRightRadius: radius.sm,
  },
  bubbleOther: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  author: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.primaryLight,
    marginBottom: spacing.xs,
  },
  content: {
    ...typography.body,
  },
  contentMine: {
    color: colors.textInverse,
  },
  contentOther: {
    color: colors.text,
  },
  time: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  timeMine: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  timeOther: {
    color: colors.textMuted,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
