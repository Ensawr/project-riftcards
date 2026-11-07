import { Stack } from 'expo-router/stack';

import { useTheme } from '@/theme';

export const unstable_settings = { initialRouteName: 'sign-in' };

export default function AuthLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
