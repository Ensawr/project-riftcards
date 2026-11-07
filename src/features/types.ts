/** Row shapes returned by Supabase. Kept in sync with supabase/migrations. */

export type Visibility = 'public' | 'followers' | 'private';
export type PostVisibility = 'public' | 'followers';
export type PostKind = 'collection' | 'deck' | 'sale' | 'trade';
export type ListingKind = 'sale' | 'trade';
export type PostCardRole = 'offer' | 'want';

export type Profile = {
  id: string;
  username: string;
  country_code: string;
  city: string;
  avatar_background: number;
  avatar_symbol: number | null;
  bio: string | null;
  created_at: string;
};

export type ProfileSummary = Pick<Profile, 'id' | 'username' | 'country_code' | 'city' | 'avatar_background' | 'avatar_symbol'>;

export type CardSet = {
  id: string;
  slug: string;
  name: string;
  set_type: string | null;
  released_at: string | null;
};

/** One printing (a specific version of a card) joined with its card and set. */
export type CatalogPrinting = {
  id: string;
  card_id: string;
  set_id: string;
  set_slug: string;
  set_name: string;
  short_code: string;
  public_code: string | null;
  rarity: string;
  art_variant: string;
  finish: string;
  is_signed: boolean;
  is_overnumbered: boolean;
  language: string;
  image_id: string | null;
  canonical_rank: number | null;
  card_slug: string;
  name: string;
  types: string[];
  super_types: string[];
  domains: string[];
  energy: number | null;
  might: number | null;
  power: number | null;
};

export type PrintingDetail = CatalogPrinting & {
  printed_name: string | null;
  artist: string | null;
  rules_text: string | null;
  flavor_text: string | null;
};

export type Collection = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

export type CollectionWithCount = Collection & { card_total: number; unique_total: number };

export type CollectionCard = {
  collection_id: string;
  printing_id: string;
  quantity: number;
  updated_at: string;
  printing: CatalogPrinting;
};

export type PostCard = {
  printing_id: string;
  role: PostCardRole;
  quantity: number;
  printing: CatalogPrinting;
};

export type Post = {
  id: string;
  author_id: string;
  kind: PostKind;
  visibility: PostVisibility;
  description: string | null;
  collection_id: string | null;
  status: 'active' | 'closed';
  country_code: string | null;
  city: string | null;
  created_at: string;
  author: ProfileSummary;
  cards: PostCard[];
  collection: Pick<Collection, 'id' | 'name' | 'visibility'> | null;
};
