import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.track,
        { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radius.pill, padding: theme.spacing.xs },
      ]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[
              styles.segment,
              {
                minHeight: theme.sizes.minTouch - theme.spacing.sm,
                borderRadius: theme.radius.pill,
                backgroundColor: selected ? theme.colors.surface : 'transparent',
              },
              selected && styles.selectedShadow,
              selected && { shadowColor: theme.colors.shadow },
            ]}>
            <AppText variant="bodyStrong" color={selected ? 'text' : 'textSecondary'} numberOfLines={1}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row' },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  selectedShadow: {
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});
