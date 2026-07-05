import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createOrgSchema, inviteCodeSchema, zodErrors } from '@/lib/validation';
import { useAuthStore } from '@/store/auth';

/** First login: create a new organization or join one with an invite code. */
export default function OnboardingScreen() {
  const theme = useTheme();
  const { createOrg, joinOrg, signOut } = useAuthStore();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [orgName, setOrgName] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setErrors({});
    setSubmitting(true);
    try {
      if (mode === 'create') {
        const parsed = createOrgSchema.safeParse({ name: orgName });
        const errs = zodErrors(parsed);
        setErrors(errs);
        if (!parsed.success) return;
        await createOrg(parsed.data.name);
      } else {
        const parsed = inviteCodeSchema.safeParse({ code });
        const errs = zodErrors(parsed);
        setErrors(errs);
        if (!parsed.success) return;
        await joinOrg(parsed.data.code);
      }
      router.replace('/(tabs)');
    } catch (err) {
      setErrors({ _: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <MaterialCommunityIcons name="account-group" size={48} color={theme.colors.primary} />
            <Text variant="headlineMedium" style={styles.title}>
              Set up your team
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Create an organization for your business, or join an existing one with an invite code
              from your teammate.
            </Text>
          </View>

          <SegmentedButtons
            value={mode}
            onValueChange={(v) => setMode(v as 'create' | 'join')}
            buttons={[
              { value: 'create', label: 'Create new', icon: 'plus' },
              { value: 'join', label: 'Join with code', icon: 'ticket-confirmation' },
            ]}
            style={{ marginBottom: 24 }}
          />

          {mode === 'create' ? (
            <>
              <TextInput
                label="Organization name"
                placeholder="e.g. Demo Shoes Co."
                value={orgName}
                onChangeText={setOrgName}
                error={!!errors.name}
              />
              {errors.name ? <HelperText type="error">{errors.name}</HelperText> : null}
            </>
          ) : (
            <>
              <TextInput
                label="Invite code"
                placeholder="8 characters, e.g. AB12CD34"
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                autoCapitalize="characters"
                error={!!errors.code}
              />
              {errors.code ? <HelperText type="error">{errors.code}</HelperText> : null}
            </>
          )}
          {errors._ ? <HelperText type="error">{errors._}</HelperText> : null}

          <Button mode="contained" onPress={submit} loading={submitting} disabled={submitting} style={styles.button}>
            {mode === 'create' ? 'Create organization' : 'Join organization'}
          </Button>

          <Button
            mode="text"
            style={{ marginTop: 24 }}
            onPress={async () => {
              await signOut();
              router.replace('/(auth)/login');
            }}
          >
            Log out
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', gap: 8, marginBottom: 28 },
  title: { fontWeight: '700' },
  button: { marginTop: 16 },
});
