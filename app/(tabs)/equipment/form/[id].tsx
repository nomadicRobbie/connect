import { Button, EmptyState, Input, Screen, SelectField, colors, spacing, typography } from "@/src/components/ui";
import { useAssetDetail, useUpdateAsset } from "@/src/hooks/useAssets";
import type { AssetFormData, AssetStatus, AssetType } from "@/src/types";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

const TYPE_OPTIONS: { label: string; value: AssetType }[] = [
  { label: "Vehicle", value: "VEHICLE" },
  { label: "Boat", value: "BOAT" },
  { label: "Lodge", value: "LODGE" },
];

const STATUS_OPTIONS: { label: string; value: AssetStatus }[] = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Maintenance", value: "UNDER_MAINTENANCE" },
];

export default function EditAssetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: asset, isLoading } = useAssetDetail(id!);
  const { mutateAsync: updateAsset, isPending } = useUpdateAsset(id!);

  const [form, setForm] = useState<AssetFormData>({
    name: "",
    type: "VEHICLE",
    status: "ACTIVE",
    location: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (asset) {
      setForm({
        name: asset.name,
        type: asset.type,
        status: asset.status,
        location: asset.location ?? "",
        description: asset.description ?? "",
      });
    }
  }, [asset]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.type) e.type = "Type is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await updateAsset({
        name: form.name.trim(),
        type: form.type,
        status: form.status,
        location: form.location?.trim() || undefined,
        description: form.description?.trim() || undefined,
      });
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update asset";
      Alert.alert("Error", message);
    }
  };

  if (!asset && !isLoading) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Edit Asset" }} />
        <EmptyState icon="alert-circle-outline" title="Asset not found" />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Asset" }} />
      <Screen scroll keyboardAvoiding>
        <View style={styles.header}>
          <Text style={styles.title}>Update asset</Text>
          <Text style={styles.subtitle}>Keep location, status, and notes current so the team sees accurate information.</Text>
        </View>

        <View style={styles.form}>
          <Input label="Asset Name" value={form.name} onChangeText={(name) => setForm((prev) => ({ ...prev, name }))} error={errors.name} placeholder="Land Cruiser 79" />
          <SelectField label="Type" value={form.type} onChange={(type) => setForm((prev) => ({ ...prev, type }))} options={TYPE_OPTIONS} error={errors.type} />
          <SelectField label="Status" value={form.status} onChange={(status) => setForm((prev) => ({ ...prev, status }))} options={STATUS_OPTIONS} />
          <Input label="Location" value={form.location} onChangeText={(location) => setForm((prev) => ({ ...prev, location }))} placeholder="North garage" />
          <Input
            label="Description"
            value={form.description}
            onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
            multiline
            placeholder="Key notes, usage details, or setup information"
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
