import { describe, expect, it } from '@jest/globals';

import { formatRulesText } from '../format';

describe('formatRulesText', () => {
  it('turns OpenRift icon tokens into readable text', () => {
    expect(formatRulesText(':rb_exhaust:: Add :rb_rune_rainbow:.')).toBe('[exhaust]: Add [rune rainbow].');
  });

  it('unwraps italic reminder text', () => {
    expect(formatRulesText('Deal 1. _(Each instance is increased by 1.)_')).toBe('Deal 1. (Each instance is increased by 1.)');
  });

  it('handles empty values', () => {
    expect(formatRulesText(null)).toBe('');
  });
});
