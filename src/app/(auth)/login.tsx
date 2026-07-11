import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loginSchema, zodErrors } from '@/lib/validation';
import { useAuthStore } from '@/store/auth';

export default function LoginScreen() {
  const theme = useTheme();
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const parsed = loginSchema.safeParse({ email, password });
    const errs = zodErrors(parsed);
    setErrors(errs);
    if (!parsed.success) return;

    setSubmitting(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
      router.replace('/');
    } catch (err) {
      setErrors({ _: err instanceof Error ? err.message : 'Login failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
              <MaterialCommunityIcons name="package-variant-closed" size={40} color="#fff" />
            </View>
            <Text variant="headlineMedium" style={styles.title}>
              StockRoom
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Inventory for teams
            </Text>
          </View>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            error={!!errors.email}
            style={styles.input}
          />
          {errors.email ? <HelperText type="error">{errors.email}</HelperText> : null}

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword((v) => !v)}
              />
            }
            error={!!errors.password}
            style={styles.input}
          />
          {errors.password ? <HelperText type="error">{errors.password}</HelperText> : null}
          {errors._ ? <HelperText type="error">{errors._}</HelperText> : null}

          <Button mode="contained" onPress={submit} loading={submitting} disabled={submitting} style={styles.button}>
            Log in
          </Button>

          <Link href="/(auth)/forgot-password" asChild>
            <Button mode="text">Forgot password?</Button>
          </Link>

          <View style={styles.footer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              New here?
            </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Button mode="text" compact>
                Create an account
              </Button>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontWeight: '700' },
  input: { marginTop: 8 },
  button: { marginTop: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
});
