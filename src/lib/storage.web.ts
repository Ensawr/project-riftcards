/**
 * Web implementation of the preferences store.
 * expo-sqlite on web needs extra WASM/header setup, so the browser preview uses localStorage.
 */
export const preferencesStorage = {
  getString(key: string): string | null {
    try {
      return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setString(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable (private mode, blocked site data); preferences just won't persist.
    }
  },
};
