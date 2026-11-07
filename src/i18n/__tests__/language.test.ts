import { describe, expect, it } from '@jest/globals';

import { resolveInitialLanguage } from '../language';
import en from '../locales/en';
import tr from '../locales/tr';

function collectKeys(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [path] : collectKeys(value as object, path);
  });
}

function collectValues(node: object): string[] {
  return Object.values(node).flatMap((value) =>
    typeof value === 'string' ? [value] : collectValues(value as object),
  );
}

describe('resolveInitialLanguage', () => {
  it('uses Turkish on a Turkish device when nothing is stored', () => {
    expect(resolveInitialLanguage(null, 'tr')).toBe('tr');
    expect(resolveInitialLanguage(undefined, 'TR')).toBe('tr');
  });

  it('falls back to English for every other device language', () => {
    expect(resolveInitialLanguage(null, 'de')).toBe('en');
    expect(resolveInitialLanguage(null, 'en')).toBe('en');
    expect(resolveInitialLanguage(null, null)).toBe('en');
  });

  it('always prefers the language the user picked manually', () => {
    expect(resolveInitialLanguage('en', 'tr')).toBe('en');
    expect(resolveInitialLanguage('tr', 'de')).toBe('tr');
  });

  it('ignores invalid stored values', () => {
    expect(resolveInitialLanguage('fr', 'tr')).toBe('tr');
    expect(resolveInitialLanguage('', 'de')).toBe('en');
  });
});

describe('translation resources', () => {
  it('Turkish and English define exactly the same keys', () => {
    expect(collectKeys(tr).sort()).toEqual(collectKeys(en).sort());
  });

  it('has no empty strings', () => {
    for (const value of [...collectValues(en), ...collectValues(tr)]) {
      expect(value.trim()).not.toHaveLength(0);
    }
  });
});
