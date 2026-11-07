import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { CardGrid } from '@/components/cards/card-grid';
import { CardTile } from '@/components/cards/card-tile';
import { CatalogFilterBar } from '@/components/cards/catalog-filter-bar';
import { AppText, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import type { CatalogFilters } from '@/features/catalog/api';
import { useCatalog } from '@/features/catalog/hooks';
import { useAdjustCollectionCard, useCollectionQuantities } from '@/features/collections/api';
import { listingDraft, useListingDraft } from '@/features/posts/listing-draft';
import type { CatalogPrinting } from '@/features/types';
import { getErrorMessage } from '@/lib/errors';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useTheme } from '@/theme';

type Mode = 'browse' | 'binder' | 'offer' | 'want';

/**
 * Card catalog. Depending on `mode` a tap opens the card, adds a copy to a binder,
 * or adds the card to the listing draft (offered / wanted).
 */
export default function CatalogScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ mode?: Mode; binderId?: string }>();
  const mode: Mode = params.mode ?? 'browse';
  const binderId = params.binderId ?? '';

  const [filters, setFilters] = useState<CatalogFilters>({});
  const debounced = useDebouncedValue(filters);
  const catalog = useCatalog(debounced);
  const items = catalog.data?.pages.flat() ?? [];

  const draft = useListingDraft();
  const adjust = useAdjustCollectionCard(binderId);
  const binderQuantities = useCollectionQuantities(mode === 'binder' ? binderId : undefined);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const titles: Record<Mode, string> = {
      browse: t('catalog.title'),
      binder: t('collection.addCards'),
      offer: mode === 'offer' && draft.kind === 'sale' ? t('listing.pickForSale') : t('listing.pickOffer'),
      want: t('listing.pickWant'),
    };
    navigation.setOptions({
      title: titles[mode],
      headerRight:
        mode === 'browse'
          ? undefined
          : () => (
              <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8}>
                <AppText variant="bodyStrong" color="primary">
                  {t('common.done')}
                </AppText>
              </Pressable>
            ),
    });
  }, [navigation, mode, draft.kind, t]);

  const onPress = (printing: CatalogPrinting) => {
    if (mode === 'browse') {
      router.push({ pathname: '/card/[id]', params: { id: printing.id } });
      return;
    }
    if (mode === 'binder') {
      setMessage(null);
      adjust.mutate({ printingId: printing.id, delta: 1 }, { onError: (error) => setMessage(getErrorMessage(t, error)) });
      return;
    }
    listingDraft.addCard(mode, printing);
  };

  const onDecrement = (printing: CatalogPrinting) => {
    if (mode === 'binder') {
      setMessage(null);
      adjust.mutate({ printingId: printing.id, delta: -1 }, { onError: (error) => setMessage(getErrorMessage(t, error)) });
      return;
    }
    if (mode === 'offer' || mode === 'want') {
      listingDraft.setQuantity(mode, printing.id, listingDraft.quantityOf(mode, printing.id) - 1);
    }
  };

  const quantityFor = (printingId: string) => {
    if (mode === 'binder') return binderQuantities.data?.[printingId];
    if (mode === 'offer' || mode === 'want') return draft[mode].find((item) => item.printing.id === printingId)?.quantity;
    return undefined;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <CardGrid
        data={items}
        keyExtractor={(item) => item.id}
        extraData={mode === 'binder' ? binderQuantities.data : draft}
        header={
          <View>
            <CatalogFilterBar filters={filters} onChange={setFilters} />
            {mode !== 'browse' ? (
              <AppText variant="caption" color={message ? 'danger' : 'textMuted'} style={{ marginBottom: theme.spacing.md }}>
                {message ?? (mode === 'binder' ? t('catalog.tapToAddBinder') : t('catalog.tapToAddListing'))}
              </AppText>
            ) : null}
          </View>
        }
        renderItem={(item) => {
          const quantity = quantityFor(item.id);
          return (
            <CardTile
              printing={item}
              quantity={quantity}
              highlighted={Boolean(quantity)}
              onPress={onPress}
              onDecrement={mode === 'browse' ? undefined : onDecrement}
            />
          );
        }}
        onEndReached={() => catalog.hasNextPage && !catalog.isFetchingNextPage && void catalog.fetchNextPage()}
        loadingMore={catalog.isFetchingNextPage}
        empty={
          catalog.isPending ? (
            <LoadingState />
          ) : catalog.isError ? (
            <ErrorState message={t('errors.loadFailed')} onRetry={() => void catalog.refetch()} />
          ) : (
            <EmptyState icon="search-outline" title={t('catalog.noResultsTitle')} message={t('catalog.noResultsBody')} />
          )
        }
      />
    </View>
  );
}
