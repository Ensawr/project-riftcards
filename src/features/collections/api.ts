import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { useAuth } from '../auth/auth-provider';
import { mapEmbeddedPrinting, PRINTING_EMBED, type EmbeddedPrintingRow } from '../catalog/api';
import type { Collection, CollectionCard, CollectionWithCount, Visibility } from '../types';

export const COLLECTION_CARDS_PAGE_SIZE = 60;
const COLLECTION_COLUMNS = 'id, owner_id, name, description, visibility, created_at, updated_at';

type CollectionRow = Collection & { collection_cards: { quantity: number }[] };

function withCounts(row: CollectionRow): CollectionWithCount {
  const { collection_cards: cards, ...collection } = row;
  return {
    ...collection,
    unique_total: cards.length,
    card_total: cards.reduce((sum, card) => sum + card.quantity, 0),
  };
}

/** Binders of a user. RLS hides the ones the caller is not allowed to see. */
export function useCollections(ownerId: string | null | undefined) {
  return useQuery({
    queryKey: ['collections', ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select(`${COLLECTION_COLUMNS}, collection_cards(quantity)`)
        .eq('owner_id', ownerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as CollectionRow[]).map(withCounts);
    },
    enabled: Boolean(ownerId),
  });
}

export function useCollection(collectionId: string | undefined) {
  return useQuery({
    queryKey: ['collection', collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select(`${COLLECTION_COLUMNS}, collection_cards(quantity)`)
        .eq('id', collectionId!)
        .maybeSingle();
      if (error) throw error;
      return data ? withCounts(data as CollectionRow) : null;
    },
    enabled: Boolean(collectionId),
  });
}

type CollectionCardRow = Omit<CollectionCard, 'printing'> & { printing: EmbeddedPrintingRow };

export function useCollectionCards(collectionId: string | undefined, search: string) {
  return useInfiniteQuery({
    queryKey: ['collection-cards', collectionId, search],
    queryFn: async ({ pageParam }) => {
      const from = pageParam * COLLECTION_CARDS_PAGE_SIZE;
      let request = supabase
        .from('collection_cards')
        .select(`collection_id, printing_id, quantity, updated_at, printing:card_printings!inner(${PRINTING_EMBED.replace('card:cards(', 'card:cards!inner(')})`)
        .eq('collection_id', collectionId!);
      const query = search.trim();
      if (query) {
        request = request.ilike('printing.card.name', `%${query.replace(/[%_\\,()]/g, ' ')}%`);
      }
      const { data, error } = await request
        .order('updated_at', { ascending: false })
        .order('printing_id', { ascending: true })
        .range(from, from + COLLECTION_CARDS_PAGE_SIZE - 1);
      if (error) throw error;
      return ((data ?? []) as unknown as CollectionCardRow[]).map((row) => ({
        ...row,
        printing: mapEmbeddedPrinting(row.printing),
      })) as CollectionCard[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length < COLLECTION_CARDS_PAGE_SIZE ? undefined : lastPageParam + 1,
    enabled: Boolean(collectionId),
  });
}

/** Quantity of one printing in one of the caller's binders (for the card detail screen). */
export function useCollectionQuantity(collectionId: string | undefined, printingId: string | undefined) {
  return useQuery({
    queryKey: ['collection-quantity', collectionId, printingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_cards')
        .select('quantity')
        .eq('collection_id', collectionId!)
        .eq('printing_id', printingId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.quantity as number | undefined) ?? 0;
    },
    enabled: Boolean(collectionId && printingId),
  });
}

/**
 * printing id → quantity for every card in a binder. Lets the catalog picker show
 * existing copies on each tile (two small columns, fine even for large binders).
 */
export function useCollectionQuantities(collectionId: string | undefined) {
  return useQuery({
    queryKey: ['collection-quantities', collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_cards')
        .select('printing_id, quantity')
        .eq('collection_id', collectionId!)
        .range(0, 9999);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of (data ?? []) as { printing_id: string; quantity: number }[]) map[row.printing_id] = row.quantity;
      return map;
    },
    enabled: Boolean(collectionId),
  });
}

export type CollectionInput = { name: string; description: string; visibility: Visibility };

export function useSaveCollection() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: CollectionInput & { id?: string }) => {
      const values = {
        name: input.name.trim(),
        description: input.description.trim() || null,
        visibility: input.visibility,
      };
      if (id) {
        const { error } = await supabase.from('collections').update(values).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from('collections')
        .insert({ ...values, owner_id: userId! })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
      void queryClient.invalidateQueries({ queryKey: ['collection', id] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('collections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useAdjustCollectionCard(collectionId: string) {
  const queryClient = useQueryClient();
  const quantitiesKey = ['collection-quantities', collectionId];

  const setQuantity = (printingId: string, update: (current: number) => number) =>
    queryClient.setQueryData<Record<string, number>>(quantitiesKey, (current) => {
      const next = { ...(current ?? {}) };
      const value = Math.max(0, Math.min(999, update(next[printingId] ?? 0)));
      if (value > 0) next[printingId] = value;
      else delete next[printingId];
      return next;
    });

  return useMutation({
    // Taps on the same binder run one after another, so quick repeated taps never race.
    scope: { id: `collection-${collectionId}` },
    mutationFn: async ({ printingId, delta }: { printingId: string; delta: number }) => {
      const { data, error } = await supabase.rpc('adjust_collection_card', {
        p_collection_id: collectionId,
        p_printing_id: printingId,
        p_delta: delta,
      });
      if (error) throw error;
      return { printingId, quantity: Number(data ?? 0) };
    },
    // Optimistic: the badge updates instantly, the server value replaces it when it arrives.
    onMutate: ({ printingId, delta }) => {
      setQuantity(printingId, (current) => current + delta);
    },
    onSuccess: ({ printingId, quantity }) => {
      queryClient.setQueryData(['collection-quantity', collectionId, printingId], quantity);
      setQuantity(printingId, () => quantity);
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: quantitiesKey });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['collection-cards', collectionId] });
      void queryClient.invalidateQueries({ queryKey: ['collection', collectionId] });
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}
