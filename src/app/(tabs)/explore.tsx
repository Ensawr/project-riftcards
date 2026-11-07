import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CountryPicker } from '@/components/forms/country-picker';
import { PostList } from '@/components/posts/post-list';
import { AppText, Chip, EmptyState, ErrorState, LoadingState, ScreenHeader, TextField } from '@/components/ui';
import { DOMAINS } from '@/features/catalog/constants';
import { useSetGroups } from '@/features/catalog/hooks';
import { useExploreListings, type ExploreFilters } from '@/features/posts/api';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { usePullToRefresh } from '@/lib/use-pull-to-refresh';
import { useTheme } from '@/theme';

export default function ExploreScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { mainSets } = useSetGroups();
  const [filters, setFilters] = useState<ExploreFilters>({ order: 'newest' });
  const [showMore, setShowMore] = useState(false);
  // Typing in text filters should not fire a request per keystroke.
  const debouncedFilters = useDebouncedValue(filters, 350);
  const listings = useExploreListings(debouncedFilters);
  const posts = listings.data?.pages.flat() ?? [];
  const pull = usePullToRefresh(listings.refetch);

  const patch = (next: Partial<ExploreFilters>) => setFilters((current) => ({ ...current, ...next }));
  const extraCount = [filters.city, filters.setId, filters.domain].filter(Boolean).length;

  const header = (
    <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.lg }}>
      <TextField
        compact
        icon="search"
        value={filters.cardQuery ?? ''}
        onChangeText={(cardQuery) => patch({ cardQuery })}
        placeholder={t('explore.searchCard')}
        autoCorrect={false}
        returnKeyType="search"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: theme.spacing.sm }}>
        <Chip label={t('explore.all')} selected={!filters.kind} onPress={() => patch({ kind: null })} />
        <Chip label={t('posts.kindSale')} icon="pricetag-outline" selected={filters.kind === 'sale'} onPress={() => patch({ kind: 'sale' })} />
        <Chip label={t('posts.kindTrade')} icon="swap-horizontal" selected={filters.kind === 'trade'} onPress={() => patch({ kind: 'trade' })} />
        <CountryPicker compact allowAny value={filters.country ?? null} onChange={(country) => patch({ country })} />
        <Chip
          icon="swap-vertical"
          label={filters.order === 'oldest' ? t('explore.oldest') : t('explore.newest')}
          onPress={() => patch({ order: filters.order === 'oldest' ? 'newest' : 'oldest' })}
        />
        <Chip
          icon="funnel-outline"
          label={extraCount ? `${t('catalog.filters')} · ${extraCount}` : t('catalog.filters')}
          selected={showMore || extraCount > 0}
          onPress={() => setShowMore((value) => !value)}
        />
      </ScrollView>
      {showMore ? (
        <View style={{ gap: theme.spacing.md }}>
          <TextField
            compact
            icon="location-outline"
            value={filters.city ?? ''}
            onChangeText={(city) => patch({ city })}
            placeholder={t('explore.city')}
          />
          <AppText variant="label" color="textMuted">
            {t('catalog.set')}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
            {mainSets.map((set, index) => (
              <Chip
                key={set.id}
                label={`${index + 1} · ${set.name}`}
                selected={filters.setId === set.id}
                onPress={() => patch({ setId: filters.setId === set.id ? null : set.id })}
              />
            ))}
          </ScrollView>
          <AppText variant="label" color="textMuted">
            {t('catalog.domain')}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
            {DOMAINS.map((domain) => (
              <Chip
                key={domain.slug}
                label={domain.label}
                dotColor={domain.color}
                selected={filters.domain === domain.slug}
                onPress={() => patch({ domain: filters.domain === domain.slug ? null : domain.slug })}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={t('explore.title')} subtitle={t('explore.subtitle')} />
      {listings.isError ? (
        <ErrorState message={t('errors.loadFailed')} onRetry={() => void listings.refetch()} />
      ) : (
        <PostList
          posts={posts}
          header={header}
          onEndReached={() => listings.hasNextPage && !listings.isFetchingNextPage && void listings.fetchNextPage()}
          loadingMore={listings.isFetchingNextPage}
          refreshing={pull.refreshing}
          onRefresh={pull.onRefresh}
          empty={
            listings.isPending ? (
              <LoadingState />
            ) : (
              <EmptyState icon="pricetags-outline" title={t('explore.emptyTitle')} message={t('explore.emptyBody')} />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
