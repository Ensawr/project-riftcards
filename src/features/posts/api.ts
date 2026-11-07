import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { mapEmbeddedPrinting, PRINTING_EMBED, type EmbeddedPrintingRow } from '../catalog/api';
import type { ListingKind, Post, PostCard, PostVisibility } from '../types';

export const POSTS_PAGE_SIZE = 20;

/** Embeds author, cards (with printing data) and the shared binder for every post query. */
const POST_SELECT = `id, author_id, kind, visibility, description, collection_id, status, country_code, city, created_at,
  author:profiles!posts_author_id_fkey(id, username, country_code, city, avatar_background, avatar_symbol),
  cards:post_cards(printing_id, role, quantity, printing:card_printings(${PRINTING_EMBED})),
  collection:collections(id, name, visibility)`;

type PostRow = Omit<Post, 'cards'> & {
  cards: (Omit<PostCard, 'printing'> & { printing: EmbeddedPrintingRow })[];
};

function mapPost(row: PostRow): Post {
  return {
    ...row,
    cards: row.cards.map((card) => ({ ...card, printing: mapEmbeddedPrinting(card.printing) })),
  };
}

export type ExploreFilters = {
  kind?: ListingKind | null;
  country?: string | null;
  city?: string;
  cardQuery?: string;
  setId?: string | null;
  domain?: string | null;
  order?: 'newest' | 'oldest';
};

function nextCursor(lastPage: Post[]): string | undefined {
  return lastPage.length < POSTS_PAGE_SIZE ? undefined : lastPage[lastPage.length - 1]?.created_at;
}

export function useExploreListings(filters: ExploreFilters) {
  return useInfiniteQuery({
    queryKey: ['feed', 'explore', filters],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase
        .rpc('explore_listings', {
          p_kind: filters.kind ?? null,
          p_country: filters.country ?? null,
          p_city: filters.city?.trim() || null,
          p_card_query: filters.cardQuery?.trim() || null,
          p_set_id: filters.setId ?? null,
          p_domain: filters.domain ?? null,
          p_order: filters.order ?? 'newest',
          p_cursor: pageParam,
          p_limit: POSTS_PAGE_SIZE,
        })
        .select(POST_SELECT);
      if (error) throw error;
      return ((data ?? []) as unknown as PostRow[]).map(mapPost);
    },
    initialPageParam: null as string | null,
    getNextPageParam: nextCursor,
  });
}

export function useHomeFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'home'],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase
        .rpc('home_feed', { p_cursor: pageParam, p_limit: POSTS_PAGE_SIZE })
        .select(POST_SELECT);
      if (error) throw error;
      return ((data ?? []) as unknown as PostRow[]).map(mapPost);
    },
    initialPageParam: null as string | null,
    getNextPageParam: nextCursor,
  });
}

export function useUserPosts(authorId: string | undefined) {
  return useQuery({
    queryKey: ['feed', 'user', authorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('author_id', authorId!)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return ((data ?? []) as unknown as PostRow[]).map(mapPost);
    },
    enabled: Boolean(authorId),
  });
}

export function usePost(postId: string | undefined) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select(POST_SELECT).eq('id', postId!).maybeSingle();
      if (error) throw error;
      return data ? mapPost(data as unknown as PostRow) : null;
    },
    enabled: Boolean(postId),
  });
}

export type ListingCardInput = { printing_id: string; quantity: number };

export type ListingInput = {
  kind: ListingKind;
  visibility: PostVisibility;
  description: string;
  offer: ListingCardInput[];
  want: ListingCardInput[];
};

function invalidateFeeds(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['feed'] });
  void queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ListingInput) => {
      const { data, error } = await supabase.rpc('create_listing', {
        p_kind: input.kind,
        p_visibility: input.visibility,
        p_description: input.description,
        p_offer: input.offer,
        p_want: input.kind === 'trade' ? input.want : [],
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => invalidateFeeds(queryClient),
  });
}

export function useCreateCollectionPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { collectionId: string; visibility: PostVisibility; description: string }) => {
      const { data, error } = await supabase.rpc('create_collection_post', {
        p_collection_id: input.collectionId,
        p_visibility: input.visibility,
        p_description: input.description,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => invalidateFeeds(queryClient),
  });
}

export function useUpdatePostStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'closed' }) => {
      const { error } = await supabase.from('posts').update({ status }).eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      invalidateFeeds(queryClient);
      void queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateFeeds(queryClient),
  });
}
