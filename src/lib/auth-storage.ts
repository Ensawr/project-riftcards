// Polyfills `localStorage` on iOS/Android with an expo-sqlite backed store,
// as recommended by Supabase for Expo apps. The auth session lives here.
import 'expo-sqlite/localStorage/install';

export const authStorage = globalThis.localStorage;
