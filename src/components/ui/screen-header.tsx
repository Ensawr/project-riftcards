import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Use the brand display font (Home) instead of the regular title style. */
  brand?: boolean;
  /** Action buttons on the right side (e.g. messages, settings). */
  actions?: ReactNode;
};

export function ScreenHeader({ title, subtitle, brand = false, actions }: ScreenHeaderProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.md },
      ]}>
      <View style={styles.titles}>
        <AppText variant={brand ? 'display' : 'title'} accessibilityRole="header" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.xxs }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actions ? <View style={[styles.actions, { gap: theme.spacing.xs }]}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  titles: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', alignItems: 'center' },
});
