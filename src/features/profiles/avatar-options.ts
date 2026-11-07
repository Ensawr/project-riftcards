import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

type SymbolName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Avatars are not uploaded photos: a profile stores two small ids (background + symbol).
 * Order matters — the index is what gets saved in the database (0–9).
 */
export const AVATAR_BACKGROUNDS: readonly { from: string; to: string }[] = [
  { from: '#8B5CF6', to: '#5B21B6' }, // rift violet
  { from: '#22D3EE', to: '#0E7490' }, // hextech cyan
  { from: '#FBBF24', to: '#B45309' }, // arcane amber
  { from: '#F472B6', to: '#9D174D' }, // spirit pink
  { from: '#34D399', to: '#047857' }, // jade
  { from: '#F87171', to: '#991B1B' }, // noxian red
  { from: '#60A5FA', to: '#1D4ED8' }, // piltover blue
  { from: '#A3E635', to: '#4D7C0F' }, // zaun green
  { from: '#FB923C', to: '#C2410C' }, // ember
  { from: '#A1A1AA', to: '#3F3F46' }, // steel
];

export const AVATAR_SYMBOLS: readonly SymbolName[] = [
  'sword',
  'moon-waning-crescent',
  'star-four-points',
  'shield',
  'crown',
  'cards',
  'fire',
  'lightning-bolt',
  'eye',
  'diamond-stone',
];

export function randomAvatarBackground(): number {
  return Math.floor(Math.random() * AVATAR_BACKGROUNDS.length);
}
