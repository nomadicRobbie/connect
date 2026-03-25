import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "./tokens";

interface TimeFieldProps {
  label?: string;
  value?: string;
  onChange: (value?: string) => void;
  error?: string;
  hint?: string;
}

function parseTime(value?: string) {
  if (!value) return { hours: 9, minutes: 0 };

  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return { hours: 9, minutes: 0 };
  }

  return { hours, minutes };
}

function formatTime(value?: string) {
  if (!value) return "Select a time";

  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return "Select a time";
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TimeField({ label, value, onChange, error, hint }: TimeFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedTime = useMemo(() => {
    const { hours, minutes } = parseTime(value);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }, [value]);

  const handleChange = (_event: DateTimePickerEvent, nextDate?: Date) => {
    setShowPicker(false);
    if (!nextDate) return;

    const nextHours = String(nextDate.getHours()).padStart(2, "0");
    const nextMinutes = String(nextDate.getMinutes()).padStart(2, "0");
    onChange(`${nextHours}:${nextMinutes}`);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable style={[styles.field, error ? styles.fieldError : null]} onPress={() => setShowPicker(true)}>
        <Text style={[styles.value, !value ? styles.placeholder : null]}>{formatTime(value)}</Text>
      </Pressable>

      {value ? (
        <Pressable onPress={() => onChange(undefined)} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear time</Text>
        </Pressable>
      ) : null}

      {showPicker ? <DateTimePicker value={selectedTime} mode="time" display="default" onChange={handleChange} /> : null}

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
  field: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  fieldError: {
    borderColor: colors.error,
  },
  value: {
    ...typography.body,
    color: colors.text,
  },
  placeholder: {
    color: colors.textMuted,
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
