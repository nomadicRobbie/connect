import { Button, DateField, EmptyState, Input, Screen, SelectField, colors, spacing, typography } from "@/src/components/ui";
import { useMaintenanceRecord, useUpdateMaintenance } from "@/src/hooks/useMaintenance";
import type { MaintenanceFormData, MaintenancePriority, MaintenanceStatus } from "@/src/types";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

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

export default function EditMaintenanceScreen() {
  const router = useRouter();
  const { id, assetId } = useLocalSearchParams<{ id: string; assetId?: string }>();
  const { data: record, isLoading } = useMaintenanceRecord(id!);
  const { mutateAsync: updateRecord, isPending } = useUpdateMaintenance(id!);

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
    try {
      await updateRecord({
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        assetId: form.assetId,
        assignedToId: form.assignedToId?.trim() || undefined,
      });
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update maintenance record";
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
            onChange={(dueDate?: string) => setForm((prev) => ({ ...prev, dueDate: dueDate ?? "" }))}
            hint="Optional. Selected dates are sent to the server as ISO strings."
          />
          <Input
            label="Assigned To User ID"
            value={form.assignedToId}
            onChangeText={(assignedToId) => setForm((prev) => ({ ...prev, assignedToId }))}
            placeholder="Optional assignee ID"
          />
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
  actions: {
    marginTop: spacing.xl,
  },
});
