/**
 * Official Riftbound game terms. They are shown in their original (English) form in every language,
 * as requested: only the UI around them is translated.
 * Values match OpenRift `enums` slugs.
 */
export const DOMAINS = [
  { slug: 'fury', label: 'Fury', color: '#E5484D' },
  { slug: 'calm', label: 'Calm', color: '#30A46C' },
  { slug: 'mind', label: 'Mind', color: '#3E8BFF' },
  { slug: 'body', label: 'Body', color: '#F76B15' },
  { slug: 'chaos', label: 'Chaos', color: '#8E4EC6' },
  { slug: 'order', label: 'Order', color: '#E2B712' },
  { slug: 'colorless', label: 'Colorless', color: '#8B8D98' },
] as const;

export const RARITIES = [
  { slug: 'common', label: 'Common' },
  { slug: 'uncommon', label: 'Uncommon' },
  { slug: 'rare', label: 'Rare' },
  { slug: 'epic', label: 'Epic' },
  { slug: 'showcase', label: 'Showcase' },
] as const;

export const CARD_TYPES = [
  { slug: 'legend', label: 'Legend' },
  { slug: 'unit', label: 'Unit' },
  { slug: 'spell', label: 'Spell' },
  { slug: 'gear', label: 'Gear' },
  { slug: 'rune', label: 'Rune' },
  { slug: 'battlefield', label: 'Battlefield' },
] as const;

const FINISH_LABELS: Record<string, string> = {
  normal: 'Normal',
  foil: 'Foil',
  metal: 'Metal',
  'metal-deluxe': 'Metal (Deluxe)',
};

const ART_LABELS: Record<string, string> = {
  normal: '',
  altart: 'Alt Art',
  ultimate: 'Ultimate',
};

export function domainColor(slug: string): string {
  return DOMAINS.find((domain) => domain.slug === slug)?.color ?? '#8B8D98';
}

export function labelFor(list: readonly { slug: string; label: string }[], slug: string): string {
  return list.find((item) => item.slug === slug)?.label ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

/** e.g. "Foil · Alt Art · Signed" — empty for the plain normal printing. */
export function printingVariantLabel(printing: {
  finish: string;
  art_variant: string;
  is_signed: boolean;
  is_overnumbered: boolean;
}): string {
  return [
    printing.finish !== 'normal' ? FINISH_LABELS[printing.finish] ?? printing.finish : '',
    ART_LABELS[printing.art_variant] ?? printing.art_variant,
    printing.is_overnumbered ? 'Overnumbered' : '',
    printing.is_signed ? 'Signed' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Card images are served by OpenRift; we never mirror them. */
export function cardImageUrl(imageId: string | null | undefined, size: '120w' | '240w' | '400w' | 'full' = '400w') {
  return imageId ? `https://openrift.app/media/cards/${imageId}-${size}.webp` : null;
}

export function openRiftCardUrl(cardSlug: string) {
  return `https://openrift.app/cards/${cardSlug}`;
}
