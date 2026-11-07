import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './icon';

type IconButtonProps = {
  icon: IconName;
  /** Required: icon-only buttons need a label for screen readers. */
  accessibilityLabel: string;
  onPress: () => void;
  /** Shows a small dot, e.g. for unread messages. */
  showBadge?: boolean;
  disabled?: boolean;
};

export function IconButton({ icon, accessibilityLabel, onPress, showBadge = false, disabled }: IconButtonProps) {
  const theme = useTheme();
  const size = theme.sizes.minTouch;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={theme.spacing.xs}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: theme.radius.pill,
          backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}>
      <Icon name={icon} />
      {showBadge ? (
        <View
          style={[
            styles.badge,
            { backgroundColor: theme.colors.accent, borderColor: theme.colors.surface, top: theme.spacing.sm, right: theme.spacing.sm },
          ]}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});
