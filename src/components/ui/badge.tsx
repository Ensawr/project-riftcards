import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';

type BadgeProps = { label: string; tone?: 'accent' | 'primary' };

export function Badge({ label, tone = 'accent' }: BadgeProps) {
  const theme = useTheme();
  const background = tone === 'accent' ? theme.colors.accentMuted : theme.colors.primaryMuted;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: background,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xxs,
      }}>
      <AppText variant="label" color={tone} style={{ fontSize: 10, lineHeight: 14 }}>
        {label}
      </AppText>
    </View>
  );
}
