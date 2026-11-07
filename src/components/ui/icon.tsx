import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { useTheme, type ColorTokens } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type IconProps = {
  name: IconName;
  size?: number;
  /** A theme color token, or a raw color passed down by a navigator (e.g. tab tint). */
  color?: keyof ColorTokens | (string & {});
};

export function Icon({ name, size, color = 'text' }: IconProps) {
  const theme = useTheme();
  const resolved = color in theme.colors ? theme.colors[color as keyof ColorTokens] : color;
  return <Ionicons name={name} size={size ?? theme.sizes.icon} color={resolved} />;
}
