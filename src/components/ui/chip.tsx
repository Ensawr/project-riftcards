import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  /** Small colored dot, e.g. a domain color. */
  dotColor?: string;
};

export function Chip({ label, selected = false, onPress, icon, dotColor }: ChipProps) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={{ top: 4, bottom: 4 }}
      style={[
        styles.chip,
        {
          gap: theme.spacing.xs + 2,
          paddingHorizontal: theme.spacing.md + 2,
          height: 36,
          borderRadius: theme.radius.pill,
          backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceMuted,
          borderColor: selected ? theme.colors.primary : 'transparent',
        },
      ]}>
      {dotColor ? (
        <View style={[styles.dot, { backgroundColor: dotColor, borderColor: selected ? theme.colors.onPrimary : 'transparent' }]} />
      ) : null}
      {icon ? <Icon name={icon} size={16} color={selected ? 'onPrimary' : 'textSecondary'} /> : null}
      <AppText variant="captionStrong" color={selected ? 'onPrimary' : 'text'} numberOfLines={1}>
        {label}
      </AppText>
      {selected && onPress ? <Icon name="close" size={14} color="onPrimary" /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
});
