import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon } from './icon';

type QuantityStepperProps = {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  busy?: boolean;
  max?: number;
  compact?: boolean;
};

export function QuantityStepper({ value, onIncrement, onDecrement, busy = false, max = 999, compact = false }: QuantityStepperProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const size = compact ? 32 : theme.sizes.minTouch;

  const button = (icon: 'remove' | 'add', onPress: () => void, disabled: boolean, label: string) => (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={compact ? 6 : 0}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: theme.radius.pill,
          backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surfaceElevated,
          opacity: disabled ? 0.4 : 1,
        },
      ]}>
      <Icon name={icon} size={compact ? 16 : theme.sizes.icon} />
    </Pressable>
  );

  return (
    <View style={[styles.row, { gap: compact ? theme.spacing.xs : theme.spacing.md }]}>
      {button('remove', onDecrement, value <= 0, t('common.decrease'))}
      <View style={{ minWidth: compact ? 24 : 40, alignItems: 'center' }} accessibilityLiveRegion="polite">
        {busy ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <AppText variant={compact ? 'captionStrong' : 'heading'}>{value}</AppText>
        )}
      </View>
      {button('add', onIncrement, value >= max, t('common.increase'))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  button: { alignItems: 'center', justifyContent: 'center' },
});
