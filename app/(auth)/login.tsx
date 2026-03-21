import { Button, colors, Input, Screen, spacing, typography } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email address";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboardAvoiding scroll>
      <View style={styles.header}>
        <Text style={styles.logo}>Connect</Text>
        <Text style={styles.tagline}>Asset Management</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <View style={styles.fields}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            error={errors.email}
            placeholder="you@example.com"
          />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" error={errors.password} placeholder="••••••••" />
        </View>

        <Button label="Sign In" onPress={handleLogin} loading={loading} fullWidth size="lg" style={styles.submitBtn} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Do not have an account? </Text>
          <Pressable onPress={() => router.push("/register")}>
            <Text style={styles.link}>Register</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  logo: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: "800",
  },
  tagline: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: spacing.xs,
  },
  form: {
    flex: 1,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  fields: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  submitBtn: {
    marginBottom: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  link: {
    ...typography.body,
    color: colors.primaryLight,
    fontWeight: "600",
  },
});
