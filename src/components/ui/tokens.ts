export const colors = {
  // Surfaces
  bg: "#F8F9FB",
  bgCard: "#FFFFFF",
  bgInput: "#F1F5F9",
  bgMuted: "#E2E8F0",

  // Text
  text: "#1A2332",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",

  // Brand
  primary: "#1E3A5F",
  primaryLight: "#3B82F6",
  primarySurface: "#EFF6FF",

  // Semantic
  success: "#22C55E",
  successSurface: "#F0FDF4",
  warning: "#F59E0B",
  warningSurface: "#FFFBEB",
  error: "#EF4444",
  errorSurface: "#FEF2F2",
  critical: "#DC2626",
  criticalSurface: "#FEE2E2",

  // Structure
  border: "#E2E8F0",
  borderFocus: "#3B82F6",
  shadow: "rgba(30, 58, 95, 0.08)",
  overlay: "rgba(0, 0, 0, 0.4)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.5 },
  caption: { fontSize: 11, fontWeight: "400" as const },
} as const;
