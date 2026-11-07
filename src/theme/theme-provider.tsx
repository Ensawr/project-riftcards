import * as SystemUI from 'expo-system-ui';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { preferencesStorage } from '@/lib/storage';
import { StorageKeys } from '@/lib/storage-keys';

import { parseThemePreference, resolveColorScheme, type ThemePreference } from './preference';
import { createTheme, type Theme } from './tokens';

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    parseThemePreference(preferencesStorage.getString(StorageKeys.themePreference)),
  );

  const scheme = resolveColorScheme(preference, systemScheme);
  const theme = useMemo(() => createTheme(scheme), [scheme]);

  useEffect(() => {
    // Root view background: avoids white flashes behind modals and during transitions.
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
  }, [theme.colors.background]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    preferencesStorage.setString(StorageKeys.themePreference, next);
  }, []);

  const value = useMemo(() => ({ theme, preference, setPreference }), [theme, preference, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <AppThemeProvider>.');
  }
  return context;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}

export function useThemePreference() {
  const { preference, setPreference } = useThemeContext();
  return { preference, setPreference };
}
