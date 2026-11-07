import { StyleSheet, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { useTheme } from '@/theme';

export function AuthHero({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
      <View
        style={[
          styles.logo,
          {
            width: 56,
            height: 56,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
          },
        ]}>
        <Icon name="albums" size={28} color="onPrimary" />
      </View>
      <AppText variant="display">{title}</AppText>
      <AppText variant="body" color="textSecondary">
        {subtitle}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
