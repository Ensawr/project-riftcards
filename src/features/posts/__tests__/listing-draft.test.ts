import { beforeEach, describe, expect, it } from '@jest/globals';

import type { CatalogPrinting } from '../../types';
import { listingDraft, MAX_LISTING_CARDS } from '../listing-draft';

function printing(id: string): CatalogPrinting {
  return {
    id,
    card_id: `card-${id}`,
    set_id: 'set',
    set_slug: 'OGN',
    set_name: 'Origins',
    short_code: `OGN-${id}`,
    public_code: null,
    rarity: 'common',
    art_variant: 'normal',
    finish: 'normal',
    is_signed: false,
    is_overnumbered: false,
    language: 'EN',
    image_id: null,
    canonical_rank: 1,
    card_slug: `card-${id}`,
    name: `Card ${id}`,
    types: ['unit'],
    super_types: [],
    domains: ['fury'],
    energy: 1,
    might: 1,
    power: null,
  };
}

describe('listing draft', () => {
  beforeEach(() => listingDraft.reset('trade'));

  it('adds a card once and increments its quantity on repeat', () => {
    listingDraft.addCard('offer', printing('1'));
    listingDraft.addCard('offer', printing('1'));
    expect(listingDraft.get().offer).toHaveLength(1);
    expect(listingDraft.quantityOf('offer', '1')).toBe(2);
  });

  it('keeps offered and wanted cards separate', () => {
    listingDraft.addCard('offer', printing('1'));
    listingDraft.addCard('want', printing('1'));
    expect(listingDraft.quantityOf('offer', '1')).toBe(1);
    expect(listingDraft.quantityOf('want', '1')).toBe(1);
  });

  it('removes a card when its quantity drops to zero', () => {
    listingDraft.addCard('offer', printing('1'));
    listingDraft.setQuantity('offer', '1', 0);
    expect(listingDraft.get().offer).toHaveLength(0);
  });

  it('caps quantity at 99 and the list at the card limit', () => {
    listingDraft.addCard('offer', printing('1'));
    listingDraft.setQuantity('offer', '1', 500);
    expect(listingDraft.quantityOf('offer', '1')).toBe(99);

    for (let i = 0; i < MAX_LISTING_CARDS + 5; i += 1) listingDraft.addCard('want', printing(`w${i}`));
    expect(listingDraft.get().want).toHaveLength(MAX_LISTING_CARDS);
  });

  it('reset clears everything', () => {
    listingDraft.addCard('offer', printing('1'));
    listingDraft.update({ description: 'hello' });
    listingDraft.reset('sale');
    expect(listingDraft.get()).toEqual({ kind: 'sale', visibility: 'public', description: '', offer: [], want: [] });
  });
});
