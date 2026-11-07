import type { TextStyle } from 'react-native';

/**
 * Riftcards design tokens.
 * Every color, spacing, radius and type value used in the UI comes from here.
 * Screens and components must read them through `useTheme()`, never hard-code them.
 */

export type ColorScheme = 'light' | 'dark';

export type ColorTokens = {
  /** App background behind every screen */
  background: string;
  /** Cards, sheets, list rows */
  surface: string;
  /** Raised elements on top of a surface (pressed rows, inputs) */
  surfaceElevated: string;
  /** Subtle fills: chips, segmented control track, skeletons */
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  /** Text/icon drawn on top of `primary` */
  onPrimary: string;
  /** Hextech mint — main brand / call-to-action color */
  primary: string;
  primaryPressed: string;
  primaryMuted: string;
  /** Sky blue — secondary highlight, used for trades */
  accent: string;
  accentMuted: string;
  /** Arcane amber — warm highlight, used for sales */
  highlight: string;
  highlightMuted: string;
  danger: string;
  dangerMuted: string;
  success: string;
  successMuted: string;
  tabBar: string;
  overlay: string;
  shadow: string;
};

const lightColors: ColorTokens = {
  background: '#F6F6F8',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F0F3',
  surfaceMuted: '#E8E8EC',
  border: '#E3E3E8',
  borderStrong: '#CDCDD5',
  text: '#17171C',
  textSecondary: '#52525E',
  textMuted: '#8A8A96',
  onPrimary: '#FFFFFF',
  primary: '#0E9F80',
  primaryPressed: '#0B8169',
  primaryMuted: '#D3F5EA',
  accent: '#0284C7',
  accentMuted: '#D6EEFB',
  highlight: '#D97706',
  highlightMuted: '#FEF0D2',
  danger: '#DC2626',
  dangerMuted: '#FDE4E4',
  success: '#059669',
  successMuted: '#D7F5EA',
  tabBar: '#FFFFFF',
  overlay: 'rgba(10, 10, 14, 0.45)',
  shadow: '#000000',
};

const darkColors: ColorTokens = {
  background: '#111114',
  surface: '#1A1A1F',
  surfaceElevated: '#232329',
  surfaceMuted: '#2A2A31',
  border: '#2C2C34',
  borderStrong: '#3C3C46',
  text: '#F4F4F6',
  textSecondary: '#A9A9B6',
  textMuted: '#74747F',
  onPrimary: '#03241C',
  primary: '#22E3B5',
  primaryPressed: '#14C79D',
  primaryMuted: '#0F3A31',
  accent: '#38BDF8',
  accentMuted: '#0E3247',
  highlight: '#FBBF24',
  highlightMuted: '#3A2E12',
  danger: '#F87171',
  dangerMuted: '#3B1D1F',
  success: '#34D399',
  successMuted: '#123329',
  tabBar: '#16161A',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
};

export const colors: Record<ColorScheme, ColorTokens> = {
  light: lightColors,
  dark: darkColors,
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Inter font files registered in the root layout via `useFonts`. Each weight is its own family. */
export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  captionStrong: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const sizes = {
  /** Minimum touch target (Apple HIG 44pt / Material 48dp, we use 44 + hitSlop) */
  minTouch: 44,
  iconSm: 18,
  icon: 22,
  iconLg: 28,
  iconXl: 40,
  createButton: 54,
  cardAspect: 744 / 1039,
  maxContentWidth: 720,
} as const;

export type Theme = {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  sizes: typeof sizes;
};

export function createTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: colors[scheme],
    spacing,
    radius,
    typography,
    sizes,
  };
}
