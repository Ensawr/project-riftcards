import '@/i18n';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider, type ErrorBoundaryProps, type Theme as NavigationTheme } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState, Screen } from '@/components/ui';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { queryClient } from '@/lib/query-client';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AppThemeProvider, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <AppThemeProvider>
      <Screen edges={['top', 'bottom']} scroll={false}>
        <ErrorState onRetry={retry} />
      </Screen>
    </AppThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontError && __DEV__) console.warn('[fonts] Inter failed to load, using system font', fontError);
  }, [fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </AppThemeProvider>
  );
}

function RootNavigator() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { session, profile, isLoading } = useAuth();
  const { colors } = theme;

  useEffect(() => {
    if (!isLoading) void SplashScreen.hideAsync();
  }, [isLoading]);

  const navigationTheme = useMemo<NavigationTheme>(() => {
    const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
      },
    };
  }, [theme.scheme, colors]);

  if (!isSupabaseConfigured) {
    return (
      <Screen edges={['top', 'bottom']} scroll={false}>
        <ErrorState title={t('errors.configTitle')} message={t('errors.configBody')} />
      </Screen>
    );
  }

  if (isLoading) return null;

  const signedIn = Boolean(session);
  const ready = signedIn && Boolean(profile);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: theme.typography.heading.fontFamily, color: colors.text },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={signedIn && !profile}>
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack.Protected>

        <Stack.Protected guard={ready}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="compose" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="create/listing" options={{ title: t('listing.newTitle') }} />
          <Stack.Screen name="create/collection-post" options={{ title: t('create.collectionPostTitle') }} />
          <Stack.Screen name="catalog" options={{ title: t('catalog.title') }} />
          <Stack.Screen name="card/[id]" options={{ title: '' }} />
          <Stack.Screen name="binder/[id]" options={{ title: '' }} />
          <Stack.Screen name="binder-form" options={{ presentation: 'modal', title: '' }} />
          <Stack.Screen name="listing/[id]" options={{ title: '' }} />
          <Stack.Screen name="user/[id]" options={{ title: '' }} />
          <Stack.Screen name="messages/index" options={{ title: t('messages.title') }} />
          <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
          <Stack.Screen name="edit-profile" options={{ title: t('profile.editTitle') }} />
        </Stack.Protected>

        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
