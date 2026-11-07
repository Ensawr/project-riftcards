import type { CardSet } from '../types';

/**
 * Main sets are the numbered Riftbound expansions (Set 1 Origins, Set 2 Spiritforged, …).
 * OpenRift marks them with setType "main"; announced-but-unreleased main sets are kept out
 * until their release date, so new sets appear automatically once they are out.
 */
export function getMainSets(sets: CardSet[], today = new Date()): CardSet[] {
  const todayIso = today.toISOString().slice(0, 10);
  return sets
    .filter((set) => set.set_type === 'main' && set.released_at !== null && set.released_at <= todayIso)
    .sort((a, b) => (a.released_at ?? '').localeCompare(b.released_at ?? ''));
}
