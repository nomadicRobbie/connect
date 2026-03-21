import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from "react-native";
import { colors, radius, spacing, typography } from "./tokens";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, hint, containerStyle, style, ...rest }: InputProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...rest}
        style={[styles.input, focused && styles.inputFocused, !!error && styles.inputError, rest.multiline && styles.inputMultiline, style]}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {!error && hint && <Text style={styles.hint}>{hint}</Text>}
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
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.borderFocus,
    backgroundColor: colors.bgCard,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: spacing.sm + 2,
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
