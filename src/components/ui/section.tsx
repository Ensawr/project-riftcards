import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Surface } from './surface';

type SectionProps = { title: string; children: ReactNode };

/** Titled group of list rows, used on the settings screen and profile. */
export function Section({ title, children }: SectionProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <AppText variant="label" color="textMuted" style={{ paddingHorizontal: theme.spacing.xs }}>
        {title}
      </AppText>
      <Surface>{children}</Surface>
    </View>
  );
}
