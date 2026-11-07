import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CardTile } from '@/components/cards/card-tile';
import { KindBadge } from '@/components/posts/post-card';
import { AppText, Avatar, Button, EmptyState, ErrorState, Icon, LoadingState, Surface } from '@/components/ui';
import { flagEmoji, getCountryName } from '@/constants/countries';
import { useAuth } from '@/features/auth/auth-provider';
import { useDeletePost, usePost, useUpdatePostStatus } from '@/features/posts/api';
import type { PostCard } from '@/features/types';
import { getErrorMessage } from '@/lib/errors';
import { formatRelativeTime } from '@/lib/format';
import { useTheme } from '@/theme';

function CardSection({ title, cards }: { title: string; cards: PostCard[] }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const columns = width >= 600 ? 5 : 3;
  const contentWidth = Math.min(width, theme.sizes.maxContentWidth) - theme.spacing.lg * 2;
  const itemWidth = Math.floor((contentWidth - theme.spacing.md * (columns - 1)) / columns);
  if (cards.length === 0) return null;

  return (
    <View style={{ gap: theme.spacing.md }}>
      <AppText variant="label" color="textMuted">
        {title} · {cards.reduce((sum, card) => sum + card.quantity, 0)}
      </AppText>
      <View style={[styles.grid, { gap: theme.spacing.md }]}>
        {cards.map((card) => (
          <View key={`${card.role}-${card.printing_id}`} style={{ width: itemWidth }}>
            <CardTile
              printing={card.printing}
              quantity={card.quantity}
              onPress={() => router.push({ pathname: '/card/[id]', params: { id: card.printing_id } })}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const { userId } = useAuth();
  const post = usePost(id);
  const updateStatus = useUpdatePostStatus();
  const remove = useDeletePost();

  useEffect(() => {
    navigation.setOptions({ title: post.data ? (post.data.kind === 'sale' ? t('posts.kindSale') : t('posts.kindTrade')) : '' });
  }, [navigation, post.data, t]);

  if (post.isPending) return <LoadingState />;
  if (post.isError) return <ErrorState message={t('errors.loadFailed')} onRetry={() => void post.refetch()} />;
  if (!post.data) return <EmptyState icon="lock-closed-outline" title={t('listing.notFoundTitle')} message={t('listing.notFoundBody')} />;

  const data = post.data;
  const isOwner = data.author_id === userId;
  const offer = data.cards.filter((card) => card.role === 'offer');
  const want = data.cards.filter((card) => card.role === 'want');

  const confirmDelete = () =>
    Alert.alert(t('listing.deleteTitle'), t('listing.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          remove.mutate(data.id, {
            onSuccess: () => router.back(),
            onError: (error) => Alert.alert(t('errors.genericTitle'), getErrorMessage(t, error)),
          }),
      },
    ]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        padding: theme.spacing.lg,
        gap: theme.spacing.xl,
        paddingBottom: theme.spacing.xxxl,
        width: '100%',
        maxWidth: theme.sizes.maxContentWidth,
        alignSelf: 'center',
      }}>
      <Pressable
        onPress={() => router.push({ pathname: '/user/[id]', params: { id: data.author.id } })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.author, { gap: theme.spacing.md, opacity: pressed ? 0.8 : 1 }]}>
        <Avatar username={data.author.username} background={data.author.avatar_background} symbol={data.author.avatar_symbol} size={48} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{data.author.username}</AppText>
          <AppText variant="caption" color="textMuted">
            {data.country_code ? `${flagEmoji(data.country_code)} ${data.city}, ${getCountryName(data.country_code, i18n.language)} · ` : ''}
            {formatRelativeTime(t, data.created_at, i18n.language)}
          </AppText>
        </View>
        <KindBadge kind={data.kind} />
      </Pressable>

      {data.status === 'closed' ? (
        <Surface style={[styles.notice, { padding: theme.spacing.md, gap: theme.spacing.sm }]}>
          <Icon name="lock-closed-outline" size={16} color="textMuted" />
          <AppText variant="caption" color="textSecondary">
            {t('posts.closed')}
          </AppText>
        </Surface>
      ) : null}

      {data.description ? <AppText variant="body">{data.description}</AppText> : null}

      <CardSection title={data.kind === 'sale' ? t('posts.forSale') : t('posts.offering')} cards={offer} />
      <CardSection title={t('posts.lookingFor')} cards={want} />

      {isOwner ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Button
            label={data.status === 'active' ? t('listing.close') : t('listing.reopen')}
            icon={data.status === 'active' ? 'lock-closed-outline' : 'refresh'}
            variant="secondary"
            loading={updateStatus.isPending}
            onPress={() => updateStatus.mutate({ id: data.id, status: data.status === 'active' ? 'closed' : 'active' })}
            fullWidth
          />
          <Button label={t('listing.delete')} icon="trash-outline" variant="ghost" onPress={confirmDelete} />
        </View>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          <Button label={t('listing.messageSeller')} icon="chatbubble-outline" onPress={() => {}} disabled fullWidth />
          <AppText variant="caption" color="textMuted" align="center">
            {t('listing.messagingSoon')}
          </AppText>
        </View>
      )}

      <AppText variant="caption" color="textMuted">
        {t('listing.safetyNote')}
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  author: { flexDirection: 'row', alignItems: 'center' },
  notice: { flexDirection: 'row', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
