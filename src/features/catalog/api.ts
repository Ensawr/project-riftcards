import { supabase } from '@/lib/supabase';

import type { CardSet, CatalogPrinting, PrintingDetail } from '../types';

export { getMainSets } from './sets';

export const CATALOG_PAGE_SIZE = 60;

/** Special set filter value: everything outside the released main sets (promos, box sets, previews…). */
export const OTHER_SETS = 'others';

export type CatalogFilters = {
  query?: string;
  /** A set id, `OTHER_SETS`, or null for all sets. */
  setId?: string | null;
  domain?: string | null;
  rarity?: string | null;
  type?: string | null;
};

/** Columns used to embed a printing (with its card and set) inside other rows. */
export const PRINTING_EMBED =
  'id, card_id, set_id, short_code, public_code, rarity, art_variant, finish, is_signed, is_overnumbered, language, image_id, canonical_rank, card:cards(slug, name, types, super_types, domains, energy, might, power), set:card_sets(slug, name)';

type EmbeddedPrinting = Omit<
  CatalogPrinting,
  'card_slug' | 'name' | 'types' | 'super_types' | 'domains' | 'energy' | 'might' | 'power' | 'set_slug' | 'set_name'
> & {
  card: Pick<CatalogPrinting, 'name' | 'types' | 'super_types' | 'domains' | 'energy' | 'might' | 'power'> & { slug: string };
  set: { slug: string; name: string };
};

export function mapEmbeddedPrinting(row: EmbeddedPrinting): CatalogPrinting {
  const { card, set, ...printing } = row;
  return {
    ...printing,
    card_slug: card.slug,
    name: card.name,
    types: card.types,
    super_types: card.super_types,
    domains: card.domains,
    energy: card.energy,
    might: card.might,
    power: card.power,
    set_slug: set.slug,
    set_name: set.name,
  };
}

export type EmbeddedPrintingRow = EmbeddedPrinting;

/** Escapes characters that have a meaning inside PostgREST `ilike` filters. */
function toLikePattern(value: string): string {
  return `%${value.replace(/[%_\\]/g, (char) => `\\${char}`).replace(/[,()]/g, ' ')}%`;
}

export async function fetchCatalogPage(
  filters: CatalogFilters,
  page: number,
  mainSetIds: string[] = [],
): Promise<CatalogPrinting[]> {
  let request = supabase.from('catalog_printings').select('*');

  const query = filters.query?.trim();
  if (query) request = request.ilike('name', toLikePattern(query));
  if (filters.setId === OTHER_SETS) {
    if (mainSetIds.length > 0) request = request.not('set_id', 'in', `(${mainSetIds.join(',')})`);
  } else if (filters.setId) {
    request = request.eq('set_id', filters.setId);
  }
  if (filters.rarity) request = request.eq('rarity', filters.rarity);
  if (filters.domain) request = request.contains('domains', [filters.domain]);
  if (filters.type) request = request.contains('types', [filters.type]);

  const from = page * CATALOG_PAGE_SIZE;
  const { data, error } = await request
    .order('name', { ascending: true })
    .order('short_code', { ascending: true })
    .order('id', { ascending: true })
    .range(from, from + CATALOG_PAGE_SIZE - 1);

  if (error) throw error;
  return (data ?? []) as CatalogPrinting[];
}

export async function fetchSets(): Promise<CardSet[]> {
  const { data, error } = await supabase
    .from('card_sets')
    .select('id, slug, name, set_type, released_at')
    .order('released_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as CardSet[];
}

export async function fetchPrinting(printingId: string): Promise<PrintingDetail | null> {
  const [{ data: base, error: baseError }, { data: extra, error: extraError }] = await Promise.all([
    supabase.from('catalog_printings').select('*').eq('id', printingId).maybeSingle(),
    supabase
      .from('card_printings')
      .select('printed_name, artist, rules_text, flavor_text')
      .eq('id', printingId)
      .maybeSingle(),
  ]);
  if (baseError) throw baseError;
  if (extraError) throw extraError;
  if (!base) return null;
  return { ...(base as CatalogPrinting), ...(extra as Omit<PrintingDetail, keyof CatalogPrinting>) };
}

/** Other printings (versions) of the same card, e.g. foil or alt-art. */
export async function fetchCardPrintings(cardId: string): Promise<CatalogPrinting[]> {
  const { data, error } = await supabase
    .from('catalog_printings')
    .select('*')
    .eq('card_id', cardId)
    .order('canonical_rank', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as CatalogPrinting[];
}
