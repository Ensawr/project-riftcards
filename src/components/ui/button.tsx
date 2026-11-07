import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Stretch to the parent's width. */
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const theme = useTheme();
  const { colors } = theme;
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: colors.primary, fg: 'onPrimary', border: colors.primary },
    secondary: { bg: colors.surface, fg: 'text', border: colors.borderStrong },
    ghost: { bg: 'transparent', fg: 'primary', border: 'transparent' },
  } as const;
  const tone = palette[variant];

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.base,
        {
          minHeight: theme.sizes.minTouch + 4,
          paddingHorizontal: theme.spacing.xl,
          borderRadius: theme.radius.pill,
          backgroundColor: tone.bg,
          borderColor: tone.border,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'center',
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={colors[tone.fg]} />
      ) : (
        <View style={[styles.content, { gap: theme.spacing.sm }]}>
          {icon ? <Icon name={icon} size={theme.sizes.iconSm} color={tone.fg} /> : null}
          <AppText variant="bodyStrong" color={tone.fg}>
            {label}
          </AppText>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  content: { flexDirection: 'row', alignItems: 'center' },
});
