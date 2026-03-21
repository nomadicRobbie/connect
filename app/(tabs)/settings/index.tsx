import { Button, Card, CardRow, colors, SectionHeader, spacing, typography } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { Stack } from "expo-router";
import React from "react";
import { Alert, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Logout failed";
      Alert.alert("Error", message);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Settings", headerLargeTitle: true }} />
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustContentInsets
          automaticallyAdjustsScrollIndicatorInsets
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Workspace Settings</Text>
            <Text style={styles.subtitle}>Start simple now. This structure is ready for profile, permissions, and app preferences.</Text>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Account" />
            <Card>
              <CardRow label="Name" value={user?.name ?? "—"} />
              <CardRow label="Email" value={user?.email ?? "—"} />
              <CardRow label="Role" value={user?.role ?? "—"} />
            </Card>
          </View>

          <View style={styles.section}>
            <SectionHeader title="App" />
            <Card>
              <Text style={styles.noteTitle}>Planned growth</Text>
              <Text style={styles.noteBody}>Profile preferences, notification controls, and role visibility can be added here without changing your tab structure.</Text>
            </Card>
          </View>

          <Button label="Log Out" variant="destructive" onPress={handleLogout} fullWidth size="lg" />
        </ScrollView>
      </View>
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
  section: {
    marginBottom: spacing.xl,
  },
  noteTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  noteBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
