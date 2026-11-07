import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  CATALOG_PAGE_SIZE,
  fetchCardPrintings,
  fetchCatalogPage,
  fetchPrinting,
  fetchSets,
  getMainSets,
  OTHER_SETS,
  type CatalogFilters,
} from './api';

export function useCatalog(filters: CatalogFilters) {
  const { mainSets } = useSetGroups();
  const mainSetIds = mainSets.map((set) => set.id);
  const needsMainSets = filters.setId === OTHER_SETS;
  return useInfiniteQuery({
    queryKey: ['catalog', filters, needsMainSets ? mainSetIds : null],
    queryFn: ({ pageParam }) => fetchCatalogPage(filters, pageParam, mainSetIds),
    enabled: !needsMainSets || mainSetIds.length > 0,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length < CATALOG_PAGE_SIZE ? undefined : lastPageParam + 1,
    staleTime: 10 * 60_000,
  });
}

export function useSets() {
  return useQuery({ queryKey: ['sets'], queryFn: fetchSets, staleTime: 60 * 60_000 });
}

export function usePrinting(printingId: string | undefined) {
  return useQuery({
    queryKey: ['printing', printingId],
    queryFn: () => fetchPrinting(printingId!),
    enabled: Boolean(printingId),
    staleTime: 60 * 60_000,
  });
}

export function useCardPrintings(cardId: string | undefined) {
  return useQuery({
    queryKey: ['card-printings', cardId],
    queryFn: () => fetchCardPrintings(cardId!),
    enabled: Boolean(cardId),
    staleTime: 60 * 60_000,
  });
}

/** Released main sets in release order (Set 1 first). Everything else is grouped as "Others". */
export function useSetGroups() {
  const sets = useSets();
  const mainSets = useMemo(() => getMainSets(sets.data ?? []), [sets.data]);
  return { mainSets, isPending: sets.isPending };
}
