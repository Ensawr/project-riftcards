import { router } from 'expo-router';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CardImage, isLandscapeCard } from '@/components/cards/card-image';
import { AppText, Avatar, Icon, PressableScale } from '@/components/ui';
import { flagEmoji } from '@/constants/countries';
import type { Post, PostCard as PostCardItem } from '@/features/types';
import { formatRelativeTime } from '@/lib/format';
import { useTheme, type ColorTokens } from '@/theme';

export function useKindStyle(kind: Post['kind']) {
  const { t } = useTranslation();
  const map: Record<Post['kind'], { label: string; fg: keyof ColorTokens; bg: keyof ColorTokens }> = {
    sale: { label: t('posts.kindSale'), fg: 'highlight', bg: 'highlightMuted' },
    trade: { label: t('posts.kindTrade'), fg: 'accent', bg: 'accentMuted' },
    collection: { label: t('posts.kindCollection'), fg: 'primary', bg: 'primaryMuted' },
    deck: { label: t('posts.kindDeck'), fg: 'primary', bg: 'primaryMuted' },
  };
  return map[kind];
}

export function KindBadge({ kind }: { kind: Post['kind'] }) {
  const theme = useTheme();
  const style = useKindStyle(kind);
  return (
    <View
      style={{
        backgroundColor: theme.colors[style.bg],
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
      }}>
      <AppText variant="label" color={style.fg} style={{ fontSize: 10, lineHeight: 14 }}>
        {style.label}
      </AppText>
    </View>
  );
}

function CardStrip({ cards, label }: { cards: PostCardItem[]; label: string }) {
  const theme = useTheme();
  if (cards.length === 0) return null;
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <AppText variant="label" color="textMuted" style={{ fontSize: 10 }}>
        {label} · {cards.reduce((sum, card) => sum + card.quantity, 0)}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
        {cards.slice(0, 12).map((card) => (
          <View key={`${card.role}-${card.printing_id}`} style={{ width: 64 }}>
            <CardImage
              imageId={card.printing.image_id}
              name={card.printing.name}
              size="240w"
              rounded={theme.radius.sm - 2}
              landscape={isLandscapeCard(card.printing.types)}
            />
            {card.quantity > 1 ? (
              <View style={[styles.qty, { backgroundColor: theme.colors.overlay, borderRadius: theme.radius.pill }]}>
                <AppText variant="captionStrong" style={{ color: '#FFFFFF', fontSize: 11, lineHeight: 14 }}>
                  ×{card.quantity}
                </AppText>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export const PostCard = memo(function PostCard({ post }: { post: Post }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const offer = post.cards.filter((card) => card.role === 'offer');
  const want = post.cards.filter((card) => card.role === 'want');

  const open = () => {
    if (post.kind === 'collection' && post.collection_id) router.push({ pathname: '/binder/[id]', params: { id: post.collection_id } });
    else router.push({ pathname: '/listing/[id]', params: { id: post.id } });
  };

  return (
    <PressableScale
      onPress={open}
      accessibilityRole="button"
      scaleTo={0.98}
      style={[
        styles.card,
        {
          gap: theme.spacing.md,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={[styles.header, { gap: theme.spacing.md }]}>
        <Pressable
          onPress={() => router.push({ pathname: '/user/[id]', params: { id: post.author.id } })}
          accessibilityRole="button"
          accessibilityLabel={post.author.username}
          hitSlop={4}>
          <Avatar
            username={post.author.username}
            background={post.author.avatar_background}
            symbol={post.author.avatar_symbol}
            size={40}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {post.author.username}
          </AppText>
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {[post.country_code ? `${flagEmoji(post.country_code)} ${post.city ?? ''}`.trim() : null, formatRelativeTime(t, post.created_at, i18n.language)]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
        </View>
        <KindBadge kind={post.kind} />
      </View>

      {post.description ? (
        <AppText variant="body" numberOfLines={4}>
          {post.description}
        </AppText>
      ) : null}

      {post.kind === 'collection' && post.collection ? (
        <View style={[styles.binderRow, { gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceMuted }]}>
          <Icon name="albums-outline" size={theme.sizes.iconSm} color="primary" />
          <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {post.collection.name}
          </AppText>
          <Icon name="chevron-forward" size={theme.sizes.iconSm} color="textMuted" />
        </View>
      ) : null}

      <CardStrip cards={offer} label={post.kind === 'sale' ? t('posts.forSale') : t('posts.offering')} />
      <CardStrip cards={want} label={t('posts.lookingFor')} />

      {post.status === 'closed' ? (
        <AppText variant="captionStrong" color="textMuted">
          {t('posts.closed')}
        </AppText>
      ) : null}
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  binderRow: { flexDirection: 'row', alignItems: 'center' },
  qty: { position: 'absolute', right: 3, bottom: 3, paddingHorizontal: 5 },
});
