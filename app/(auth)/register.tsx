import { Button, colors, Input, Screen, spacing, typography } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Minimum 8 characters";
    if (password !== confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      Alert.alert("Registration Failed", message);
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
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join your team on Connect</Text>

        <View style={styles.fields}>
          <Input label="Full Name" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" error={errors.name} placeholder="Jane Smith" />
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
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} hint="Minimum 8 characters" placeholder="••••••••" />
          <Input label="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry error={errors.confirm} placeholder="••••••••" />
        </View>

        <Button label="Create Account" onPress={handleRegister} loading={loading} fullWidth size="lg" style={styles.submitBtn} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>Sign in</Text>
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
