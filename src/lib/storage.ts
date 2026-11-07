import KVStore from 'expo-sqlite/kv-store';

/**
 * Small synchronous key-value store for local UI preferences (theme, language).
 * Backed by expo-sqlite's kv-store on iOS/Android. Synchronous reads let us apply
 * the saved theme and language on the very first render, without a flash.
 *
 * Do NOT use this for auth sessions or secrets.
 */
export const preferencesStorage = {
  getString(key: string): string | null {
    try {
      return KVStore.getItemSync(key);
    } catch (error) {
      if (__DEV__) console.warn(`[storage] read failed for "${key}"`, error);
      return null;
    }
  },
  setString(key: string, value: string): void {
    try {
      KVStore.setItemSync(key, value);
    } catch (error) {
      if (__DEV__) console.warn(`[storage] write failed for "${key}"`, error);
    }
  },
};
