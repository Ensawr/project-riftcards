import type { ColorScheme } from './tokens';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/** Falls back to `system` when nothing (or something invalid) was stored. */
export function parseThemePreference(stored: string | null | undefined): ThemePreference {
  return isThemePreference(stored) ? stored : 'system';
}

/**
 * Resolves the scheme actually rendered.
 * When the OS reports no preference (`null`/`unspecified`), the app defaults to dark,
 * which suits the TCG artwork best.
 */
export function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): ColorScheme {
  if (preference !== 'system') return preference;
  return systemScheme === 'light' ? 'light' : 'dark';
}
