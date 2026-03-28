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
import { useAssetComments, useCreateAssetComment } from "@/src/hooks/useComments";
import type { AssetComment, MaintenanceRecord } from "@/src/types";
import { can } from "@/src/utils/permissions";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  VEHICLE: "car-outline",
  BOAT: "boat-outline",
  LODGE: "home-outline",
};

function CommentBubble({ comment, currentUserId }: { comment: AssetComment; currentUserId?: string }) {
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
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: asset, isLoading } = useAssetDetail(id!);
  const { mutate: deleteAsset, isPending: deleting } = useDeleteAsset();

  // Comments
  const { data: commentsData, isLoading: commentsLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAssetComments(id!, !!asset);
  const { mutateAsync: createComment, isPending: sendingComment } = useCreateAssetComment(id!);
  const [commentDraft, setCommentDraft] = useState("");

  const comments = useMemo(
    () => [...(commentsData?.pages ?? []).flatMap((page) => page.data)].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [commentsData],
  );

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

            {/* Comments */}
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
