import { describe, expect, it } from '@jest/globals';

import { parseThemePreference, resolveColorScheme } from '../preference';
import { colors, createTheme } from '../tokens';

describe('theme preference', () => {
  it('defaults to system when nothing valid is stored', () => {
    expect(parseThemePreference(null)).toBe('system');
    expect(parseThemePreference('blue')).toBe('system');
    expect(parseThemePreference('dark')).toBe('dark');
  });

  it('follows the OS only when preference is system', () => {
    expect(resolveColorScheme('system', 'light')).toBe('light');
    expect(resolveColorScheme('system', 'dark')).toBe('dark');
    expect(resolveColorScheme('light', 'dark')).toBe('light');
    expect(resolveColorScheme('dark', 'light')).toBe('dark');
  });

  it('uses dark when the OS reports no preference', () => {
    expect(resolveColorScheme('system', null)).toBe('dark');
    expect(resolveColorScheme('system', 'unspecified')).toBe('dark');
  });
});

describe('design tokens', () => {
  it('light and dark palettes define the same color tokens', () => {
    expect(Object.keys(colors.light).sort()).toEqual(Object.keys(colors.dark).sort());
  });

  it('createTheme returns the palette for the requested scheme', () => {
    expect(createTheme('dark').colors).toBe(colors.dark);
    expect(createTheme('light').scheme).toBe('light');
  });
});
