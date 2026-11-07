-- Riftcards core schema: catalog, profiles, social graph, collections (binders), listings.
-- Every table has RLS enabled. Writes from the app only ever touch the caller's own rows.

create extension if not exists pg_trgm with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Card catalog (synced from OpenRift, read-only for clients)
-- Images are NOT copied: only OpenRift image ids are stored, files are loaded from openrift.app.
-- ---------------------------------------------------------------------------
create table public.card_sets (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  set_type text,
  released_at date,
  synced_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  types text[] not null default '{}',
  super_types text[] not null default '{}',
  domains text[] not null default '{}',
  energy integer,
  might integer,
  power integer,
  keywords text[] not null default '{}',
  tags text[] not null default '{}',
  synced_at timestamptz not null default now()
);

create index cards_name_trgm_idx on public.cards using gin (name extensions.gin_trgm_ops);
create index cards_domains_idx on public.cards using gin (domains);
create index cards_types_idx on public.cards using gin (types);

create table public.card_printings (
  id uuid primary key,
  card_id uuid not null references public.cards (id) on delete restrict,
  set_id uuid not null references public.card_sets (id) on delete restrict,
  short_code text not null,
  public_code text,
  rarity text not null,
  art_variant text not null default 'normal',
  finish text not null default 'normal',
  is_signed boolean not null default false,
  is_overnumbered boolean not null default false,
  language text not null default 'EN',
  printed_name text,
  image_id text,
  artist text,
  rules_text text,
  flavor_text text,
  canonical_rank integer,
  synced_at timestamptz not null default now()
);

create index card_printings_card_idx on public.card_printings (card_id);
create index card_printings_set_idx on public.card_printings (set_id);
create index card_printings_rarity_idx on public.card_printings (rarity);
create index card_printings_rank_idx on public.card_printings (canonical_rank);

alter table public.card_sets enable row level security;
alter table public.cards enable row level security;
alter table public.card_printings enable row level security;

create policy "Catalog sets are readable by everyone" on public.card_sets for select to anon, authenticated using (true);
create policy "Catalog cards are readable by everyone" on public.cards for select to anon, authenticated using (true);
create policy "Catalog printings are readable by everyone" on public.card_printings for select to anon, authenticated using (true);

-- Flat, filterable view used by catalog screens (RLS of the base tables still applies).
create view public.catalog_printings
with (security_invoker = true)
as
select
  p.id,
  p.card_id,
  p.set_id,
  s.slug as set_slug,
  s.name as set_name,
  p.short_code,
  p.public_code,
  p.rarity,
  p.art_variant,
  p.finish,
  p.is_signed,
  p.is_overnumbered,
  p.language,
  p.image_id,
  p.canonical_rank,
  c.slug as card_slug,
  c.name,
  c.types,
  c.super_types,
  c.domains,
  c.energy,
  c.might,
  c.power
from public.card_printings p
join public.cards c on c.id = p.card_id
join public.card_sets s on s.id = p.set_id;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  country_code text not null,
  city text not null,
  avatar_background smallint not null default floor(random() * 10)::smallint,
  avatar_symbol smallint,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_.]{3,20}$'),
  constraint profiles_country_format check (country_code ~ '^[A-Z]{2}$'),
  constraint profiles_city_length check (char_length(btrim(city)) between 1 and 60),
  constraint profiles_avatar_background_range check (avatar_background between 0 and 9),
  -- null symbol = show the first letter of the username
  constraint profiles_avatar_symbol_range check (avatar_symbol is null or avatar_symbol between 0 and 9),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 280)
);

-- Case-insensitive uniqueness enforced by the database, not only the app.
create unique index profiles_username_lower_key on public.profiles (lower(username));

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;

create policy "Profiles are visible to signed-in users" on public.profiles
  for select to authenticated using (true);
create policy "Users create their own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users update their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_username ~ '^[A-Za-z0-9_.]{3,20}$'
    and not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;
revoke execute on function public.is_username_available(text) from public, anon;
grant execute on function public.is_username_available(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Social graph: follows, blocks, reports
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('profile', 'post', 'collection', 'message')),
  target_id uuid not null,
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index reports_reporter_idx on public.reports (reporter_id);

alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create or replace function private.is_blocked_between(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = p_a and blocked_id = p_b) or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

create policy "Follow graph is visible to signed-in users" on public.follows
  for select to authenticated using (true);
create policy "Users follow others as themselves" on public.follows
  for insert to authenticated
  with check ((select auth.uid()) = follower_id and not private.is_blocked_between(follower_id, following_id));
create policy "Users unfollow as themselves" on public.follows
  for delete to authenticated using ((select auth.uid()) = follower_id);

create policy "Users see their own blocks" on public.blocks
  for select to authenticated using ((select auth.uid()) = blocker_id);
create policy "Users block as themselves" on public.blocks
  for insert to authenticated with check ((select auth.uid()) = blocker_id);
create policy "Users unblock as themselves" on public.blocks
  for delete to authenticated using ((select auth.uid()) = blocker_id);

create policy "Users see their own reports" on public.reports
  for select to authenticated using ((select auth.uid()) = reporter_id);
create policy "Users report as themselves" on public.reports
  for insert to authenticated with check ((select auth.uid()) = reporter_id);

-- Central visibility rule shared by collections and posts.
create or replace function private.can_view(p_owner uuid, p_visibility text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then false
    when p_owner = (select auth.uid()) then true
    when private.is_blocked_between(p_owner, (select auth.uid())) then false
    when p_visibility = 'public' then true
    when p_visibility = 'followers' then exists (
      select 1 from public.follows f
      where f.follower_id = (select auth.uid()) and f.following_id = p_owner
    )
    else false
  end;
$$;

-- ---------------------------------------------------------------------------
-- Collections (binders)
-- ---------------------------------------------------------------------------
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_name_length check (char_length(btrim(name)) between 1 and 60),
  constraint collections_description_length check (description is null or char_length(description) <= 500),
  constraint collections_visibility check (visibility in ('public', 'followers', 'private'))
);
create index collections_owner_idx on public.collections (owner_id, created_at desc);

create trigger collections_set_updated_at before update on public.collections
for each row execute function private.set_updated_at();

create table public.collection_cards (
  collection_id uuid not null references public.collections (id) on delete cascade,
  printing_id uuid not null references public.card_printings (id) on delete restrict,
  quantity integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection_id, printing_id),
  constraint collection_cards_quantity check (quantity between 1 and 999)
);
create index collection_cards_printing_idx on public.collection_cards (printing_id);
create index collection_cards_recent_idx on public.collection_cards (collection_id, updated_at desc);

create trigger collection_cards_set_updated_at before update on public.collection_cards
for each row execute function private.set_updated_at();

create or replace function private.owns_collection(p_collection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.collections
    where id = p_collection_id and owner_id = (select auth.uid())
  );
$$;

create or replace function private.can_view_collection(p_collection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.collections c
    where c.id = p_collection_id and private.can_view(c.owner_id, c.visibility)
  );
$$;

-- Anti-abuse: cap the number of binders per user.
create or replace function private.enforce_collection_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.collections where owner_id = new.owner_id) >= 50 then
    raise exception 'collection_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger collections_enforce_limit before insert on public.collections
for each row execute function private.enforce_collection_limit();

alter table public.collections enable row level security;
alter table public.collection_cards enable row level security;

create policy "Collections follow their visibility" on public.collections
  for select to authenticated using (private.can_view(owner_id, visibility));
create policy "Users create their own collections" on public.collections
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Users update their own collections" on public.collections
  for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Users delete their own collections" on public.collections
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "Collection cards follow the collection visibility" on public.collection_cards
  for select to authenticated using (private.can_view_collection(collection_id));
create policy "Owners add cards to their collections" on public.collection_cards
  for insert to authenticated with check (private.owns_collection(collection_id));
create policy "Owners update cards in their collections" on public.collection_cards
  for update to authenticated using (private.owns_collection(collection_id)) with check (private.owns_collection(collection_id));
create policy "Owners remove cards from their collections" on public.collection_cards
  for delete to authenticated using (private.owns_collection(collection_id));

-- Atomically add/remove copies. Returns the new quantity (0 = removed).
create or replace function public.adjust_collection_card(p_collection_id uuid, p_printing_id uuid, p_delta integer)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_quantity integer;
begin
  if p_delta is null or p_delta = 0 or abs(p_delta) > 999 then
    raise exception 'invalid_delta' using errcode = '22023';
  end if;
  if not private.owns_collection(p_collection_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select quantity into v_quantity
  from public.collection_cards
  where collection_id = p_collection_id and printing_id = p_printing_id
  for update;

  if v_quantity is null then
    if p_delta < 0 then
      return 0;
    end if;
    insert into public.collection_cards (collection_id, printing_id, quantity)
    values (p_collection_id, p_printing_id, least(p_delta, 999));
    return least(p_delta, 999);
  end if;

  v_quantity := v_quantity + p_delta;
  if v_quantity <= 0 then
    delete from public.collection_cards where collection_id = p_collection_id and printing_id = p_printing_id;
    return 0;
  end if;

  v_quantity := least(v_quantity, 999);
  update public.collection_cards set quantity = v_quantity
  where collection_id = p_collection_id and printing_id = p_printing_id;
  return v_quantity;
end;
$$;
revoke execute on function public.adjust_collection_card(uuid, uuid, integer) from public, anon;
grant execute on function public.adjust_collection_card(uuid, uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Posts: collection shares and sale/trade listings
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  visibility text not null default 'public',
  description text,
  collection_id uuid references public.collections (id) on delete cascade,
  status text not null default 'active',
  -- Snapshot of the author's location when posting, used by Explore filters. Set by trigger.
  country_code text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_kind check (kind in ('collection', 'deck', 'sale', 'trade')),
  constraint posts_visibility check (visibility in ('public', 'followers')),
  constraint posts_status check (status in ('active', 'closed')),
  constraint posts_description_length check (description is null or char_length(description) <= 2000),
  constraint posts_collection_required check (kind <> 'collection' or collection_id is not null)
);
create index posts_author_idx on public.posts (author_id, created_at desc);
create index posts_listing_idx on public.posts (created_at desc) where kind in ('sale', 'trade') and status = 'active';
create index posts_location_idx on public.posts (country_code, created_at desc);

create trigger posts_set_updated_at before update on public.posts
for each row execute function private.set_updated_at();

create table public.post_cards (
  post_id uuid not null references public.posts (id) on delete cascade,
  printing_id uuid not null references public.card_printings (id) on delete restrict,
  role text not null,
  quantity integer not null default 1,
  primary key (post_id, printing_id, role),
  constraint post_cards_role check (role in ('offer', 'want')),
  constraint post_cards_quantity check (quantity between 1 and 99)
);
create index post_cards_printing_idx on public.post_cards (printing_id);

create or replace function private.prepare_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Location always comes from the author's profile, never from the client.
  select country_code, city into new.country_code, new.city
  from public.profiles where id = new.author_id;

  -- Anti-spam: at most 20 posts per hour per user.
  if (select count(*) from public.posts
      where author_id = new.author_id and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'post_rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger posts_prepare before insert on public.posts
for each row execute function private.prepare_post();

create or replace function private.owns_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.posts where id = p_post_id and author_id = (select auth.uid()));
$$;

create or replace function private.can_view_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post_id and private.can_view(p.author_id, p.visibility)
  );
$$;

alter table public.posts enable row level security;
alter table public.post_cards enable row level security;

create policy "Posts follow their visibility" on public.posts
  for select to authenticated using (private.can_view(author_id, visibility));
create policy "Users create their own posts" on public.posts
  for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Users update their own posts" on public.posts
  for update to authenticated using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy "Users delete their own posts" on public.posts
  for delete to authenticated using ((select auth.uid()) = author_id);

create policy "Post cards follow the post visibility" on public.post_cards
  for select to authenticated using (private.can_view_post(post_id));
create policy "Authors add cards to their posts" on public.post_cards
  for insert to authenticated with check (private.owns_post(post_id));
create policy "Authors remove cards from their posts" on public.post_cards
  for delete to authenticated using (private.owns_post(post_id));

-- Creates a sale/trade listing with its cards in one transaction.
-- p_offer / p_want: [{"printing_id": "<uuid>", "quantity": 1}, ...]
create or replace function public.create_listing(
  p_kind text,
  p_visibility text,
  p_description text,
  p_offer jsonb,
  p_want jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_post_id uuid;
  v_offer jsonb := coalesce(p_offer, '[]'::jsonb);
  v_want jsonb := coalesce(p_want, '[]'::jsonb);
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_kind not in ('sale', 'trade') then
    raise exception 'invalid_kind' using errcode = '22023';
  end if;
  if jsonb_typeof(v_offer) <> 'array' or jsonb_typeof(v_want) <> 'array' then
    raise exception 'invalid_cards' using errcode = '22023';
  end if;
  if jsonb_array_length(v_offer) = 0 then
    raise exception 'offer_required' using errcode = '22023';
  end if;
  if p_kind = 'sale' and jsonb_array_length(v_want) > 0 then
    raise exception 'want_only_for_trade' using errcode = '22023';
  end if;
  if jsonb_array_length(v_offer) > 100 or jsonb_array_length(v_want) > 100 then
    raise exception 'too_many_cards' using errcode = '22023';
  end if;

  insert into public.posts (author_id, kind, visibility, description)
  values ((select auth.uid()), p_kind, p_visibility, nullif(btrim(p_description), ''))
  returning id into v_post_id;

  insert into public.post_cards (post_id, printing_id, role, quantity)
  select v_post_id, (e ->> 'printing_id')::uuid, 'offer', coalesce((e ->> 'quantity')::integer, 1)
  from jsonb_array_elements(v_offer) e;

  insert into public.post_cards (post_id, printing_id, role, quantity)
  select v_post_id, (e ->> 'printing_id')::uuid, 'want', coalesce((e ->> 'quantity')::integer, 1)
  from jsonb_array_elements(v_want) e;

  return v_post_id;
end;
$$;
revoke execute on function public.create_listing(text, text, text, jsonb, jsonb) from public, anon;
grant execute on function public.create_listing(text, text, text, jsonb, jsonb) to authenticated;

-- Shares one of the caller's binders as a feed post.
create or replace function public.create_collection_post(p_collection_id uuid, p_visibility text, p_description text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_post_id uuid;
  v_collection_visibility text;
begin
  select visibility into v_collection_visibility
  from public.collections
  where id = p_collection_id and owner_id = (select auth.uid());

  if v_collection_visibility is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if v_collection_visibility = 'private' then
    raise exception 'collection_private' using errcode = 'P0001';
  end if;

  insert into public.posts (author_id, kind, visibility, description, collection_id)
  values ((select auth.uid()), 'collection', p_visibility, nullif(btrim(p_description), ''), p_collection_id)
  returning id into v_post_id;
  return v_post_id;
end;
$$;
revoke execute on function public.create_collection_post(uuid, text, text) from public, anon;
grant execute on function public.create_collection_post(uuid, text, text) to authenticated;

-- Explore: every visible active listing, newest or oldest first, keyset-paginated.
create or replace function public.explore_listings(
  p_kind text default null,
  p_country text default null,
  p_city text default null,
  p_card_query text default null,
  p_set_id uuid default null,
  p_domain text default null,
  p_order text default 'newest',
  p_cursor timestamptz default null,
  p_limit integer default 20
)
returns setof public.posts
language sql
stable
security invoker
set search_path = ''
as $$
  select p.*
  from public.posts p
  where p.kind in ('sale', 'trade')
    and p.status = 'active'
    and (p_kind is null or p.kind = p_kind)
    and (p_country is null or p.country_code = p_country)
    and (p_city is null or p.city ilike '%' || replace(replace(p_city, '%', '\%'), '_', '\_') || '%')
    and (
      p_cursor is null
      or (p_order = 'oldest' and p.created_at > p_cursor)
      or (p_order <> 'oldest' and p.created_at < p_cursor)
    )
    and (
      (p_card_query is null and p_set_id is null and p_domain is null)
      or exists (
        select 1
        from public.post_cards pc
        join public.card_printings cp on cp.id = pc.printing_id
        join public.cards c on c.id = cp.card_id
        where pc.post_id = p.id
          and (p_card_query is null or c.name ilike '%' || replace(replace(p_card_query, '%', '\%'), '_', '\_') || '%')
          and (p_set_id is null or cp.set_id = p_set_id)
          and (p_domain is null or p_domain = any (c.domains))
      )
    )
  order by
    case when p_order = 'oldest' then p.created_at end asc,
    case when p_order <> 'oldest' then p.created_at end desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;
revoke execute on function public.explore_listings(text, text, text, text, uuid, text, text, timestamptz, integer) from public, anon;
grant execute on function public.explore_listings(text, text, text, text, uuid, text, text, timestamptz, integer) to authenticated;

-- Home: posts from people the caller follows, newest first.
create or replace function public.home_feed(p_cursor timestamptz default null, p_limit integer default 20)
returns setof public.posts
language sql
stable
security invoker
set search_path = ''
as $$
  select p.*
  from public.posts p
  join public.follows f on f.following_id = p.author_id and f.follower_id = (select auth.uid())
  where p.status = 'active'
    and (p_cursor is null or p.created_at < p_cursor)
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;
revoke execute on function public.home_feed(timestamptz, integer) from public, anon;
grant execute on function public.home_feed(timestamptz, integer) to authenticated;

create or replace function public.profile_stats(p_profile_id uuid)
returns table (followers bigint, following bigint, posts bigint, is_following boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    (select count(*) from public.follows where following_id = p_profile_id),
    (select count(*) from public.follows where follower_id = p_profile_id),
    (select count(*) from public.posts where author_id = p_profile_id),
    exists (select 1 from public.follows where follower_id = (select auth.uid()) and following_id = p_profile_id);
$$;
revoke execute on function public.profile_stats(uuid) from public, anon;
grant execute on function public.profile_stats(uuid) to authenticated;

-- Private helpers are only reachable through policies / the functions above.
revoke execute on all functions in schema private from public;
grant execute on function private.can_view(uuid, text) to authenticated;
grant execute on function private.is_blocked_between(uuid, uuid) to authenticated;
grant execute on function private.owns_collection(uuid) to authenticated;
grant execute on function private.can_view_collection(uuid) to authenticated;
grant execute on function private.owns_post(uuid) to authenticated;
grant execute on function private.can_view_post(uuid) to authenticated;
