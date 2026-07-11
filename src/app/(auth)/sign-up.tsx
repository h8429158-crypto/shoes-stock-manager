import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signUpSchema, zodErrors } from '@/lib/validation';
import { useAuthStore } from '@/store/auth';

export default function SignUpScreen() {
  const theme = useTheme();
  const signUp = useAuthStore((s) => s.signUp);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const submit = async () => {
    const parsed = signUpSchema.safeParse({ fullName, email, password });
    const errs = zodErrors(parsed);
    setErrors(errs);
    if (!parsed.success) return;

    setSubmitting(true);
    try {
      const { needsConfirmation } = await signUp(parsed.data.fullName, parsed.data.email, parsed.data.password);
      if (needsConfirmation) {
        setConfirmationSent(true);
      } else {
        router.replace('/');
      }
    } catch (err) {
      setErrors({ _: err instanceof Error ? err.message : 'Sign up failed' });
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationSent) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall" style={{ textAlign: 'center' }}>
          Check your inbox
        </Text>
        <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          We sent a confirmation link to {email}. Confirm your email, then log in.
        </Text>
        <Button mode="contained" style={{ marginTop: 24 }} onPress={() => router.replace('/(auth)/login')}>
          Back to login
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text variant="headlineMedium" style={styles.title}>
            Create your account
          </Text>

          <TextInput label="Full name" value={fullName} onChangeText={setFullName} error={!!errors.fullName} style={styles.input} />
          {errors.fullName ? <HelperText type="error">{errors.fullName}</HelperText> : null}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
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
            right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword((v) => !v)} />}
            error={!!errors.password}
            style={styles.input}
          />
          {errors.password ? <HelperText type="error">{errors.password}</HelperText> : null}
          {errors._ ? <HelperText type="error">{errors._}</HelperText> : null}

          <Button mode="contained" onPress={submit} loading={submitting} disabled={submitting} style={styles.button}>
            Sign up
          </Button>
          <Button mode="text" onPress={() => router.back()}>
            I already have an account
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  centered: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  input: { marginTop: 8 },
  button: { marginTop: 16 },
});
