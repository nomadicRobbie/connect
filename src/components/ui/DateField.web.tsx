import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { calendarDateFromIso, formatIsoAsDisplayDate, isoStringFromCalendarDate } from "./dateFieldUtils";
import { colors, radius, spacing, typography } from "./tokens";

interface DateFieldProps {
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

export function DateField({ label, value, onChange, error, hint }: DateFieldProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <input
        type="date"
        value={calendarDateFromIso(value)}
        onChange={(event) => onChange(isoStringFromCalendarDate(event.currentTarget.value))}
        aria-label={label ?? "Date"}
        style={{
          ...inputStyle,
          borderColor: error ? colors.error : colors.border,
        }}
      />

      {value ? (
        <Pressable onPress={() => onChange(undefined)} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear date</Text>
        </Pressable>
      ) : (
        <Text style={styles.preview}>{formatIsoAsDisplayDate(value)}</Text>
      )}

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
  preview: {
    ...typography.bodySmall,
    color: colors.textMuted,
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
