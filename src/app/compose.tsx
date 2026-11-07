import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, IconButton, Screen, ScreenHeader, type IconName } from '@/components/ui';
import { listingDraft } from '@/features/posts/listing-draft';
import { useTheme, type ColorTokens } from '@/theme';

type ComposeOption = {
  icon: IconName;
  title: string;
  body: string;
  fg: keyof ColorTokens;
  bg: keyof ColorTokens;
  onPress: () => void;
};

export default function ComposeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const go = (href: Parameters<typeof router.replace>[0]) => router.replace(href);

  const options: ComposeOption[] = [
    {
      icon: 'swap-horizontal',
      title: t('create.tradeTitle'),
      body: t('create.tradeBody'),
      fg: 'accent',
      bg: 'accentMuted',
      onPress: () => {
        listingDraft.reset('trade');
        go('/create/listing');
      },
    },
    {
      icon: 'pricetag-outline',
      title: t('create.saleTitle'),
      body: t('create.saleBody'),
      fg: 'highlight',
      bg: 'highlightMuted',
      onPress: () => {
        listingDraft.reset('sale');
        go('/create/listing');
      },
    },
    {
      icon: 'albums-outline',
      title: t('create.collectionPostTitle'),
      body: t('create.collectionPostBody'),
      fg: 'primary',
      bg: 'primaryMuted',
      onPress: () => go('/create/collection-post'),
    },
  ];

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader
          title={t('create.title')}
          subtitle={t('create.subtitle')}
          actions={<IconButton icon="close" accessibilityLabel={t('common.close')} onPress={close} />}
        />
      }
      contentStyle={{ gap: theme.spacing.md, paddingTop: theme.spacing.sm }}>
      {options.map((option) => (
        <Pressable
          key={option.title}
          onPress={option.onPress}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.option,
            {
              gap: theme.spacing.lg,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.lg,
              backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <View
            style={[
              styles.optionIcon,
              {
                width: theme.sizes.minTouch + theme.spacing.xs,
                height: theme.sizes.minTouch + theme.spacing.xs,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors[option.bg],
              },
            ]}>
            <Icon name={option.icon} color={option.fg} />
          </View>
          <View style={[styles.optionText, { gap: theme.spacing.xs }]}>
            <AppText variant="heading">{option.title}</AppText>
            <AppText variant="caption" color="textSecondary">
              {option.body}
            </AppText>
          </View>
          <Icon name="chevron-forward" size={theme.sizes.iconSm} color="textMuted" />
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  optionIcon: { alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1 },
});
