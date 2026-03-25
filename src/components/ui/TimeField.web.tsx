import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "./tokens";

interface TimeFieldProps {
  label?: string;
  value?: string;
  onChange: (value?: string) => void;
  error?: string;
  hint?: string;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: `1.5px solid ${colors.border}`,
  borderRadius: radius.md,
  background: colors.bgInput,
  color: colors.text,
  fontSize: typography.body.fontSize,
  lineHeight: `${typography.body.lineHeight}px`,
  padding: `${spacing.sm + 2}px ${spacing.md}px`,
  boxSizing: "border-box",
  outline: "none",
};

export function TimeField({ label, value, onChange, error, hint }: TimeFieldProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <input
        type="time"
        value={value ?? ""}
        onChange={(event) => onChange(event.currentTarget.value || undefined)}
        aria-label={label ?? "Time"}
        style={{
          ...inputStyle,
          borderColor: error ? colors.error : colors.border,
        }}
      />

      {value ? (
        <Pressable onPress={() => onChange(undefined)} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear time</Text>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  clearButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
  },
  clearText: {
    ...typography.bodySmall,
    color: colors.primaryLight,
    fontWeight: "600",
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
  },
  hint: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
