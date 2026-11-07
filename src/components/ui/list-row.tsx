import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

type ListRowProps = {
  label: string;
  icon?: IconName;
  /** Secondary text on the right (e.g. app version). */
  value?: string;
  onPress?: () => void;
  /** Renders as a radio option with a checkmark when selected. */
  selected?: boolean;
  /** Shows a chevron for rows that navigate somewhere. */
  navigates?: boolean;
  isLast?: boolean;
};

export function ListRow({ label, icon, value, onPress, selected, navigates = false, isLast = false }: ListRowProps) {
  const theme = useTheme();
  const isRadio = selected !== undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={isRadio ? 'radio' : onPress ? 'button' : 'text'}
      accessibilityState={isRadio ? { checked: selected } : undefined}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: theme.sizes.minTouch + theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.md,
          backgroundColor: pressed && onPress ? theme.colors.surfaceElevated : 'transparent',
        },
      ]}>
      {icon ? <Icon name={icon} size={theme.sizes.iconSm + 2} color="textSecondary" /> : null}
      <View
        style={[
          styles.body,
          !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
        ]}>
        <AppText variant="body" style={styles.label} numberOfLines={1}>
          {label}
        </AppText>
        {value ? (
          <AppText variant="caption" color="textMuted">
            {value}
          </AppText>
        ) : null}
        {isRadio && selected ? <Icon name="checkmark" size={theme.sizes.icon} color="primary" /> : null}
        {navigates ? <Icon name="chevron-forward" size={theme.sizes.iconSm} color="textMuted" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', gap: 8 },
  label: { flex: 1 },
});
