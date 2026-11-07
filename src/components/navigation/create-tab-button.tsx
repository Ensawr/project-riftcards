import { router } from 'expo-router';
import type { BottomTabBarButtonProps } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui';
import { useTheme } from '@/theme';

/**
 * Center tab button. It does not switch tabs: it opens the "create" sheet as a modal,
 * so the user keeps their place in the current tab.
 */
export function CreateTabButton({ style }: BottomTabBarButtonProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const size = theme.sizes.createButton;

  return (
    <View style={[style, styles.slot]}>
      <Pressable
        onPress={() => router.push('/compose')}
        accessibilityRole="button"
        accessibilityLabel={t('create.open')}
        hitSlop={theme.spacing.sm}
        style={({ pressed }) => [
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: theme.radius.pill,
            marginTop: -theme.spacing.lg,
            backgroundColor: pressed ? theme.colors.primaryPressed : theme.colors.primary,
            borderColor: theme.colors.tabBar,
            shadowColor: theme.colors.shadow,
          },
        ]}>
        <Icon name="add" size={theme.sizes.iconLg + 2} color="onPrimary" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
