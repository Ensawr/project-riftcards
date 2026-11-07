import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { authStorage } from './auth-storage';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabase-config';

const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh tokens only while the app is in the foreground (Supabase recommendation for React Native).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
