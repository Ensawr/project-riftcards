import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme';

/** Card-like container: surface color, hairline border, rounded corners. */
export function Surface({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
        },
        style,
      ]}
      {...rest}
    />
  );
}
