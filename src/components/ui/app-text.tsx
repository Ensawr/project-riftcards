import { Text, type TextProps } from 'react-native';

import { useTheme, type ColorTokens, type TypographyVariant } from '@/theme';

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: keyof ColorTokens;
  align?: 'left' | 'center' | 'right';
};

export function AppText({ variant = 'body', color = 'text', align, style, ...rest }: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[theme.typography[variant], { color: theme.colors[color] }, align && { textAlign: align }, style]}
      {...rest}
    />
  );
}
