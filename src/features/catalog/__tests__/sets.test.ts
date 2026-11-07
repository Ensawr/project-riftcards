import { describe, expect, it } from '@jest/globals';

import type { CardSet } from '../../types';
import { getMainSets } from '../sets';

const set = (slug: string, set_type: string, released_at: string | null): CardSet => ({
  id: slug,
  slug,
  name: slug,
  set_type,
  released_at,
});

describe('getMainSets', () => {
  const sets = [
    set('RAD', 'main', '2026-10-23'),
    set('OGN', 'main', '2025-10-31'),
    set('SFD', 'main', '2026-02-13'),
    set('LGC', 'main', '2027-01-29'),
    set('OGS', 'supplemental', '2025-10-31'),
    set('ARC', 'supplemental', null),
  ];

  it('keeps released main sets in release order (Set 1 first)', () => {
    expect(getMainSets(sets, new Date('2026-11-03')).map((s) => s.slug)).toEqual(['OGN', 'SFD', 'RAD']);
  });

  it('adds announced main sets once their release date passes', () => {
    expect(getMainSets(sets, new Date('2027-02-01')).map((s) => s.slug)).toContain('LGC');
  });

  it('never includes supplemental products', () => {
    expect(getMainSets(sets, new Date('2030-01-01')).map((s) => s.slug)).not.toContain('OGS');
  });
});
