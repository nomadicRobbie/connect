import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatIsoAsDisplayDate, isoStringFromLocalDate, localDateFromIso } from "./dateFieldUtils";
import { colors, radius, spacing, typography } from "./tokens";

interface DateFieldProps {
  label?: string;
  value?: string;
  onChange: (value?: string) => void;
  error?: string;
  hint?: string;
}

export function DateField({ label, value, onChange, error, hint }: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = useMemo(() => localDateFromIso(value), [value]);

  const handleChange = (_event: DateTimePickerEvent, nextDate?: Date) => {
    setShowPicker(false);
    if (!nextDate) return;
    onChange(isoStringFromLocalDate(nextDate));
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable style={[styles.field, error ? styles.fieldError : null]} onPress={() => setShowPicker(true)}>
        <Text style={[styles.value, !value ? styles.placeholder : null]}>{formatIsoAsDisplayDate(value)}</Text>
      </Pressable>

      {value ? (
        <Pressable onPress={() => onChange(undefined)} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear date</Text>
        </Pressable>
      ) : null}

      {showPicker ? <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleChange} /> : null}

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
