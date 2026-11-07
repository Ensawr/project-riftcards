import { useSyncExternalStore } from 'react';

import type { CatalogPrinting, ListingKind, PostCardRole, PostVisibility } from '../types';

/**
 * In-memory draft for the "create listing" flow. The catalog picker screen adds cards here,
 * the listing form reads them. Cleared after the listing is published.
 */
export type DraftCard = { printing: CatalogPrinting; quantity: number };

export type ListingDraft = {
  kind: ListingKind;
  visibility: PostVisibility;
  description: string;
  offer: DraftCard[];
  want: DraftCard[];
};

export const MAX_LISTING_CARDS = 100;
const MAX_QUANTITY = 99;

const emptyDraft = (kind: ListingKind = 'trade'): ListingDraft => ({
  kind,
  visibility: 'public',
  description: '',
  offer: [],
  want: [],
});

let draft: ListingDraft = emptyDraft();
const listeners = new Set<() => void>();

function setDraft(next: ListingDraft) {
  draft = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useListingDraft(): ListingDraft {
  return useSyncExternalStore(subscribe, () => draft, () => draft);
}

export const listingDraft = {
  get: () => draft,
  reset: (kind?: ListingKind) => setDraft(emptyDraft(kind)),
  update: (patch: Partial<Omit<ListingDraft, 'offer' | 'want'>>) => setDraft({ ...draft, ...patch }),
  /** Adds one copy, or increases the quantity if the printing is already in the list. */
  addCard(role: PostCardRole, printing: CatalogPrinting) {
    const list = draft[role];
    const existing = list.find((item) => item.printing.id === printing.id);
    const next = existing
      ? list.map((item) =>
          item.printing.id === printing.id ? { ...item, quantity: Math.min(item.quantity + 1, MAX_QUANTITY) } : item,
        )
      : list.length >= MAX_LISTING_CARDS
        ? list
        : [...list, { printing, quantity: 1 }];
    setDraft({ ...draft, [role]: next });
  },
  setQuantity(role: PostCardRole, printingId: string, quantity: number) {
    const list = draft[role];
    const next =
      quantity <= 0
        ? list.filter((item) => item.printing.id !== printingId)
        : list.map((item) =>
            item.printing.id === printingId ? { ...item, quantity: Math.min(quantity, MAX_QUANTITY) } : item,
          );
    setDraft({ ...draft, [role]: next });
  },
  quantityOf(role: PostCardRole, printingId: string) {
    return draft[role].find((item) => item.printing.id === printingId)?.quantity ?? 0;
  },
};
