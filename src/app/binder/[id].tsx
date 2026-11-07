import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AddCardTile, CardGrid } from '@/components/cards/card-grid';
import { CardTile } from '@/components/cards/card-tile';
import { useVisibilityLabel, VISIBILITY_ICONS } from '@/components/collections/binder-row';
import { AppText, EmptyState, ErrorState, Icon, IconButton, LoadingState, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { useCollection, useCollectionCards } from '@/features/collections/api';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { usePullToRefresh } from '@/lib/use-pull-to-refresh';
import { useTheme } from '@/theme';

export default function BinderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const { userId } = useAuth();
  const visibilityLabel = useVisibilityLabel();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const binder = useCollection(id);
  const cards = useCollectionCards(id, debouncedSearch);
  const isOwner = binder.data?.owner_id === userId;
  const pull = usePullToRefresh(() => Promise.all([binder.refetch(), cards.refetch()]));

  const openPicker = useCallback(
    () => router.push({ pathname: '/catalog', params: { mode: 'binder', binderId: id } }),
    [id],
  );

  useEffect(() => {
    navigation.setOptions({
      title: binder.data?.name ?? '',
      headerRight: isOwner
        ? () => (
            <View style={[styles.headerActions, { gap: theme.spacing.xs }]}>
              <IconButton
                icon="create-outline"
                accessibilityLabel={t('collection.editBinder')}
                onPress={() => router.push({ pathname: '/binder-form', params: { id } })}
              />
              <IconButton icon="add" accessibilityLabel={t('collection.addCards')} onPress={openPicker} />
            </View>
          )
        : undefined,
    });
  }, [navigation, binder.data?.name, isOwner, id, t, theme.spacing.xs, openPicker]);

  if (binder.isPending) return <LoadingState />;
  if (binder.isError) return <ErrorState message={t('errors.loadFailed')} onRetry={() => void binder.refetch()} />;
  if (!binder.data) return <EmptyState icon="lock-closed-outline" title={t('collection.notFoundTitle')} message={t('collection.notFoundBody')} />;

  const data = binder.data;
  const items = cards.data?.pages.flat() ?? [];
  const showAddTile = isOwner && !search;

  const header = (
    <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.lg }}>
      <View style={[styles.meta, { gap: theme.spacing.sm }]}>
        <Icon name={VISIBILITY_ICONS[data.visibility]} size={14} color="textMuted" />
        <AppText variant="caption" color="textMuted">
          {visibilityLabel(data.visibility)} · {t('collection.cardCount', { cards: data.card_total, unique: data.unique_total })}
        </AppText>
      </View>
      {data.description ? (
        <AppText variant="body" color="textSecondary">
          {data.description}
        </AppText>
      ) : null}
      {data.unique_total > 0 ? (
        <TextField compact icon="search" value={search} onChangeText={setSearch} placeholder={t('collection.searchInBinder')} />
      ) : null}
    </View>
  );

  return (
    <CardGrid
      data={items}
      keyExtractor={(item) => item.printing_id}
      header={header}
      leading={showAddTile ? <AddCardTile onPress={openPicker} label={t('collection.addCards')} /> : undefined}
      renderItem={(item) => (
        <CardTile
          printing={item.printing}
          quantity={item.quantity}
          onPress={() =>
            router.push({
              pathname: '/card/[id]',
              params: isOwner ? { id: item.printing_id, binderId: data.id } : { id: item.printing_id },
            })
          }
        />
      )}
      onEndReached={() => cards.hasNextPage && !cards.isFetchingNextPage && void cards.fetchNextPage()}
      loadingMore={cards.isFetchingNextPage}
      refreshing={pull.refreshing}
      onRefresh={pull.onRefresh}
      empty={
        cards.isPending ? (
          <LoadingState />
        ) : cards.isError ? (
          <ErrorState message={t('errors.loadFailed')} onRetry={() => void cards.refetch()} />
        ) : (
          <EmptyState
            icon="albums-outline"
            title={search ? t('catalog.noResultsTitle') : t('collection.binderEmptyTitle')}
            message={search ? t('catalog.noResultsBody') : undefined}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
});
