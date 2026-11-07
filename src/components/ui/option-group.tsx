import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

type Option<T extends string> = { value: T; label: string; description?: string; icon?: IconName };

type OptionGroupProps<T extends string> = {
  label?: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Vertical radio-card group (e.g. visibility, listing type). */
export function OptionGroup<T extends string>({ label, options, value, onChange }: OptionGroupProps<T>) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }} accessibilityRole="radiogroup">
      {label ? (
        <AppText variant="captionStrong" color="textSecondary">
          {label}
        </AppText>
      ) : null}
      <View style={[styles.row, { gap: theme.spacing.sm }]}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={[
                styles.option,
                {
                  gap: theme.spacing.xs,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selected ? theme.colors.primaryMuted : theme.colors.surface,
                },
              ]}>
              {option.icon ? <Icon name={option.icon} size={theme.sizes.iconSm} color={selected ? 'primary' : 'textSecondary'} /> : null}
              <AppText variant="captionStrong" color={selected ? 'primary' : 'text'} numberOfLines={1}>
                {option.label}
              </AppText>
              {option.description ? (
                <AppText variant="caption" color="textMuted" numberOfLines={2} style={{ fontSize: 11, lineHeight: 14 }}>
                  {option.description}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  option: { flex: 1, borderWidth: 1.5 },
});
