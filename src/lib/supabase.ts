import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

if (!supabaseConfigured) {
  console.warn(
    'Supabase is not configured. Copy .env.example to .env and set ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/** Turn a Supabase/Postgres error into something a human can read. */
export function friendlyError(err: unknown): string {
  const msg =
    typeof err === 'string'
      ? err
      : err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Something went wrong';

  const map: [RegExp, string][] = [
    [/invalid login credentials/i, 'Wrong email or password.'],
    [/user already registered/i, 'An account with this email already exists.'],
    [/email not confirmed/i, 'Please confirm your email before logging in.'],
    [/invalid invite code/i, 'That invite code was not found. Double-check it and try again.'],
    [/duplicate key.*products_org_id_sku_key/i, 'A product with this SKU already exists.'],
    [/duplicate key.*categories_org_id_name_key/i, 'A category with this name already exists.'],
    [/network request failed/i, 'No connection. Your change was saved locally and will sync later.'],
    [/JWT expired/i, 'Your session expired. Please log in again.'],
  ];
  for (const [re, friendly] of map) {
    if (re.test(msg)) return friendly;
  }
  return msg;
}
