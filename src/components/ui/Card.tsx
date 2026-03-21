import React from "react";
import { Platform, Pressable, PressableProps, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, radius, spacing, typography } from "./tokens";

interface CardProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Render as a plain View (no touch feedback) when undefined */
  onPress?: () => void;
}

export function Card({ children, style, onPress, ...rest }: CardProps) {
  if (!onPress) {
    return <View style={[styles.card, style]}>{children}</View>;
  }

  return (
    <Pressable {...rest} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
      {children}
    </Pressable>
  );
}

interface CardRowProps {
  label: string;
  value: string;
}

export function CardRow({ label, value }: CardRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === "web"
      ? { boxShadow: `0px 2px 8px ${colors.shadow}` }
      : {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 2,
        }),
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  rowLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: spacing.lg,
  },
});
