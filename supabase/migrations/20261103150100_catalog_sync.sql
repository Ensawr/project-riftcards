-- OpenRift catalog sync, fully inside the database (pg_net + pg_cron).
-- 1) private.request_catalog_sync() queues an HTTP request to the public OpenRift API.
-- 2) private.apply_catalog_sync() upserts sets/cards/printings from the response.
-- Only card data and image ids are stored; images are never mirrored (OpenRift terms).
-- Card text and images belong to Riot Games.

create extension if not exists pg_net;
create extension if not exists pg_cron;

create table private.catalog_sync_runs (
  id bigint generated always as identity primary key,
  request_id bigint,
  status text not null default 'requested',
  message text,
  set_count integer,
  card_count integer,
  printing_count integer,
  requested_at timestamptz not null default now(),
  applied_at timestamptz,
  constraint catalog_sync_runs_status check (status in ('requested', 'applied', 'failed'))
);

create or replace function private.request_catalog_sync()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id bigint;
begin
  select net.http_get(
    url := 'https://openrift.app/api/v1/catalog?langs=EN',
    headers := jsonb_build_object(
      'User-Agent', 'Riftcards/0.1 (Riftbound collection app; catalog sync once per day)',
      'Accept', 'application/json'
    ),
    timeout_milliseconds := 60000
  ) into v_request_id;

  insert into private.catalog_sync_runs (request_id) values (v_request_id);
  return v_request_id;
end;
$$;

create or replace function private.apply_catalog_sync()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run private.catalog_sync_runs%rowtype;
  v_status integer;
  v_body jsonb;
  v_error text;
  v_sets integer;
  v_cards integer;
  v_printings integer;
begin
  select * into v_run
  from private.catalog_sync_runs
  where status = 'requested'
  order by id desc
  limit 1;

  if v_run.id is null then
    return 'nothing_to_apply';
  end if;

  select r.status_code, r.error_msg into v_status, v_error
  from net._http_response r
  where r.id = v_run.request_id;

  if not found then
    return 'pending';
  end if;

  if v_status is distinct from 200 then
    update private.catalog_sync_runs
    set status = 'failed', message = coalesce(v_error, 'http ' || v_status), applied_at = now()
    where id = v_run.id;
    return 'failed';
  end if;

  select r.content::jsonb into v_body from net._http_response r where r.id = v_run.request_id;

  insert into public.card_sets (id, slug, name, set_type, released_at, synced_at)
  select
    (s ->> 'id')::uuid,
    s ->> 'slug',
    s ->> 'name',
    s ->> 'setType',
    coalesce(
      (s -> 'releases' -> 'EN' ->> 'releasedAt')::date,
      (select min((r.value ->> 'releasedAt')::date) from jsonb_each(s -> 'releases') r)
    ),
    now()
  from jsonb_array_elements(v_body -> 'sets') s
  on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    set_type = excluded.set_type,
    released_at = excluded.released_at,
    synced_at = excluded.synced_at;
  get diagnostics v_sets = row_count;

  insert into public.cards (id, slug, name, types, super_types, domains, energy, might, power, keywords, tags, synced_at)
  select
    c.key::uuid,
    c.value ->> 'slug',
    c.value ->> 'name',
    coalesce(array(select jsonb_array_elements_text(c.value -> 'types')), '{}'),
    coalesce(array(select jsonb_array_elements_text(c.value -> 'superTypes')), '{}'),
    coalesce(array(select jsonb_array_elements_text(c.value -> 'domains')), '{}'),
    (c.value ->> 'energy')::integer,
    (c.value ->> 'might')::integer,
    (c.value ->> 'power')::integer,
    coalesce(array(select jsonb_array_elements_text(c.value -> 'keywords')), '{}'),
    coalesce(array(select jsonb_array_elements_text(c.value -> 'tags')), '{}'),
    now()
  from jsonb_each(v_body -> 'cards') c
  on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    types = excluded.types,
    super_types = excluded.super_types,
    domains = excluded.domains,
    energy = excluded.energy,
    might = excluded.might,
    power = excluded.power,
    keywords = excluded.keywords,
    tags = excluded.tags,
    synced_at = excluded.synced_at;
  get diagnostics v_cards = row_count;

  insert into public.card_printings (
    id, card_id, set_id, short_code, public_code, rarity, art_variant, finish, is_signed, is_overnumbered,
    language, printed_name, image_id, artist, rules_text, flavor_text, canonical_rank, synced_at
  )
  select
    p.key::uuid,
    (p.value ->> 'cardId')::uuid,
    (p.value ->> 'setId')::uuid,
    p.value ->> 'shortCode',
    p.value ->> 'publicCode',
    p.value ->> 'rarity',
    coalesce(p.value ->> 'artVariant', 'normal'),
    coalesce(p.value ->> 'finish', 'normal'),
    coalesce((p.value ->> 'isSigned')::boolean, false),
    coalesce((p.value ->> 'isOvernumbered')::boolean, false),
    coalesce(p.value ->> 'language', 'EN'),
    p.value ->> 'printedName',
    coalesce(p.value -> 'images' -> 0 ->> 'imageId', p.value ->> 'fallbackImageId'),
    p.value ->> 'artist',
    p.value ->> 'printedRulesText',
    p.value ->> 'flavorText',
    (p.value ->> 'canonicalRank')::integer,
    now()
  from jsonb_each(v_body -> 'printings') p
  on conflict (id) do update set
    card_id = excluded.card_id,
    set_id = excluded.set_id,
    short_code = excluded.short_code,
    public_code = excluded.public_code,
    rarity = excluded.rarity,
    art_variant = excluded.art_variant,
    finish = excluded.finish,
    is_signed = excluded.is_signed,
    is_overnumbered = excluded.is_overnumbered,
    language = excluded.language,
    printed_name = excluded.printed_name,
    image_id = excluded.image_id,
    artist = excluded.artist,
    rules_text = excluded.rules_text,
    flavor_text = excluded.flavor_text,
    canonical_rank = excluded.canonical_rank,
    synced_at = excluded.synced_at;
  get diagnostics v_printings = row_count;

  update private.catalog_sync_runs
  set status = 'applied', applied_at = now(),
      set_count = v_sets, card_count = v_cards, printing_count = v_printings
  where id = v_run.id;

  return format('applied: %s sets, %s cards, %s printings', v_sets, v_cards, v_printings);
exception when others then
  update private.catalog_sync_runs
  set status = 'failed', message = sqlerrm, applied_at = now()
  where id = v_run.id;
  return 'failed: ' || sqlerrm;
end;
$$;

revoke execute on function private.request_catalog_sync() from public;
revoke execute on function private.apply_catalog_sync() from public;

-- Once a day (OpenRift asks clients to keep traffic light; prices are not synced).
select cron.schedule('riftcards-catalog-request', '17 3 * * *', $$select private.request_catalog_sync()$$);
select cron.schedule('riftcards-catalog-apply', '27 3 * * *', $$select private.apply_catalog_sync()$$);
