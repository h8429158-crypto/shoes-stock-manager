import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resetSchema, zodErrors } from '@/lib/validation';
import { useAuthStore } from '@/store/auth';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const parsed = resetSchema.safeParse({ email });
    const errs = zodErrors(parsed);
    setErrors(errs);
    if (!parsed.success) return;

    setSubmitting(true);
    try {
      await resetPassword(parsed.data.email);
      setSent(true);
    } catch (err) {
      setErrors({ _: err instanceof Error ? err.message : 'Could not send reset email' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.title}>
        Reset password
      </Text>
      {sent ? (
        <>
          <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
            If an account exists for {email}, a reset link is on its way. Follow it, set a new
            password, then log in here.
          </Text>
          <Button mode="contained" style={styles.button} onPress={() => router.replace('/(auth)/login')}>
            Back to login
          </Button>
        </>
      ) : (
        <>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
            Enter the email you signed up with and we&apos;ll send you a reset link.
          </Text>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            error={!!errors.email}
          />
          {errors.email ? <HelperText type="error">{errors.email}</HelperText> : null}
          {errors._ ? <HelperText type="error">{errors._}</HelperText> : null}
          <Button mode="contained" onPress={submit} loading={submitting} disabled={submitting} style={styles.button}>
            Send reset link
          </Button>
          <Button mode="text" onPress={() => router.back()}>
            Back
          </Button>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  button: { marginTop: 16 },
});
