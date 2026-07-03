import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase';
import { COLORS } from '../theme';

const FRIENDLY_ERRORS = {
  'auth/invalid-email': 'That email address does not look right.',
  'auth/user-not-found': 'No account found with this email. Tap "Create account" below.',
  'auth/wrong-password': 'Wrong password. Please try again.',
  'auth/invalid-credential': 'Email or password is wrong. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists. Tap "Sign in" below.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/network-request-failed': 'No internet connection. Please check your network.',
  'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.',
};

export default function LoginScreen() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e) {
      setError(FRIENDLY_ERRORS[e.code] || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>👟</Text>
        <Text style={styles.title}>Shoe Stock Manager</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin'
            ? 'Sign in to see your stock'
            : 'Create a new account'}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor={COLORS.textLight}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={COLORS.textLight}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, busy && { opacity: 0.6 }]}
            onPress={submit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
            style={styles.switchButton}
          >
            <Text style={styles.switchText}>
              {mode === 'signin'
                ? 'New here? Create account'
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Everyone who signs in sees the same stock, updated live.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.primary,
  },
  logo: { fontSize: 56, textAlign: 'center' },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#cddcf2',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#fafbfd',
  },
  error: {
    color: COLORS.danger,
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  switchButton: { marginTop: 14, alignItems: 'center' },
  switchText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  hint: {
    color: '#cddcf2',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 13,
  },
});
