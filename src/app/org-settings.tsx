import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';

import { EmptyState } from '@/components/empty-state';
import { updateOrgSettings, uploadImage } from '@/db/mutations';
import { can } from '@/lib/types';
import { orgSettingsSchema, zodErrors } from '@/lib/validation';
import { useActiveOrg, useActiveRole, useAuthStore } from '@/store/auth';

export default function OrgSettingsScreen() {
  const theme = useTheme();
  const org = useActiveOrg();
  const role = useActiveRole();
  const loadOrgs = useAuthStore((s) => s.loadOrgs);

  const [name, setName] = useState(org?.name ?? '');
  const [currency, setCurrency] = useState(org?.currency ?? 'USD');
  const [taxRate, setTaxRate] = useState(String(org?.tax_rate ?? 0));
  const [logoUri, setLogoUri] = useState<string | null>(org?.logo_url ?? null);
  const [logoIsLocal, setLogoIsLocal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState('');

  if (!org || !can.manageOrg(role)) {
    return <EmptyState icon="lock-outline" title="Owners only" message="Only the organization owner can change these settings." />;
  }

  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setSnack('Photo library permission is needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
      setLogoIsLocal(true);
    }
  };

  const save = async () => {
    const parsed = orgSettingsSchema.safeParse({ name, currency, taxRate });
    const errs = zodErrors(parsed);
    setErrors(errs);
    if (!parsed.success) return;

    setSaving(true);
    try {
      let logoUrl = org.logo_url;
      if (logoIsLocal && logoUri) {
        logoUrl = await uploadImage(org.id, logoUri);
      }
      await updateOrgSettings(org, {
        name: parsed.data.name,
        currency: parsed.data.currency,
        tax_rate: parsed.data.taxRate,
        logo_url: logoUrl,
      });
      await loadOrgs().catch(() => {});
      setSnack('Settings saved.');
    } catch (err) {
      setSnack(err instanceof Error ? err.message : 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable onPress={pickLogo} style={styles.logoWrap}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logo} contentFit="cover" />
          ) : (
            <View style={[styles.logo, styles.logoEmpty, { backgroundColor: theme.colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="image-plus" size={28} color={theme.colors.onSurfaceVariant} />
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Add logo
              </Text>
            </View>
          )}
        </Pressable>
        <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          The logo appears on PO and invoice PDFs.
        </Text>

        <TextInput label="Organization name" value={name} onChangeText={setName} error={!!errors.name} />
        {errors.name ? <HelperText type="error">{errors.name}</HelperText> : null}

        <TextInput
          label="Currency (3-letter code)"
          value={currency}
          onChangeText={(t) => setCurrency(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={3}
          error={!!errors.currency}
        />
        {errors.currency ? <HelperText type="error">{errors.currency}</HelperText> : null}

        <TextInput
          label="Default tax rate (%)"
          value={taxRate}
          onChangeText={setTaxRate}
          keyboardType="decimal-pad"
          error={!!errors.taxRate}
        />
        {errors.taxRate ? <HelperText type="error">{errors.taxRate}</HelperText> : null}

        <Button mode="contained" onPress={save} loading={saving} disabled={saving} style={{ marginTop: 12 }}>
          Save settings
        </Button>
      </ScrollView>
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')}>
        {snack}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  logoWrap: { alignSelf: 'center' },
  logo: { width: 96, height: 96, borderRadius: 20 },
  logoEmpty: { alignItems: 'center', justifyContent: 'center', gap: 4 },
});
