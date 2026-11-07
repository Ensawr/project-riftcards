import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Icon, PressableScale, type IconName } from '@/components/ui';
import type { CollectionWithCount, Visibility } from '@/features/types';
import { useTheme } from '@/theme';

export const VISIBILITY_ICONS: Record<Visibility, IconName> = {
  public: 'earth-outline',
  followers: 'people-outline',
  private: 'lock-closed-outline',
};

export function useVisibilityLabel() {
  const { t } = useTranslation();
  return (visibility: Visibility) =>
    visibility === 'public'
      ? t('visibility.public')
      : visibility === 'followers'
        ? t('visibility.followers')
        : t('visibility.private');
}

export function BinderRow({ binder, onPress }: { binder: CollectionWithCount; onPress?: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const visibilityLabel = useVisibilityLabel();

  return (
    <PressableScale
      onPress={onPress ?? (() => router.push({ pathname: '/binder/[id]', params: { id: binder.id } }))}
      accessibilityRole="button"
      scaleTo={0.98}
      style={[
        styles.row,
        {
          gap: theme.spacing.md,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
      ]}>
      <View
        style={[
          styles.icon,
          { width: 48, height: 48, borderRadius: theme.radius.md, backgroundColor: theme.colors.primaryMuted },
        ]}>
        <Icon name="albums" color="primary" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {binder.name}
        </AppText>
        <View style={[styles.meta, { gap: theme.spacing.xs }]}>
          <Icon name={VISIBILITY_ICONS[binder.visibility]} size={13} color="textMuted" />
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {visibilityLabel(binder.visibility)} · {t('collection.cardCount', { cards: binder.card_total, unique: binder.unique_total })}
          </AppText>
        </View>
      </View>
      <Icon name="chevron-forward" size={theme.sizes.iconSm} color="textMuted" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  icon: { alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center' },
});
