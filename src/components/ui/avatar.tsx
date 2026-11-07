import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { AVATAR_BACKGROUNDS, AVATAR_SYMBOLS } from '@/features/profiles/avatar-options';
import { useTheme } from '@/theme';

import { AppText } from './app-text';

type AvatarProps = {
  username: string;
  background: number;
  /** null → first letter of the username */
  symbol: number | null;
  size?: number;
};

export function Avatar({ username, background, symbol, size = 40 }: AvatarProps) {
  const theme = useTheme();
  const palette = AVATAR_BACKGROUNDS[background] ?? AVATAR_BACKGROUNDS[0];
  const symbolName = symbol === null ? null : AVATAR_SYMBOLS[symbol];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={username}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.to,
          borderColor: palette.from,
          borderWidth: Math.max(2, size / 20),
        },
      ]}>
      {symbolName ? (
        <MaterialCommunityIcons name={symbolName} size={size * 0.52} color="#FFFFFF" />
      ) : (
        <AppText
          style={{
            color: '#FFFFFF',
            fontFamily: theme.typography.title.fontFamily,
            fontSize: size * 0.44,
            lineHeight: size * 0.56,
          }}>
          {(username.charAt(0) || '?').toUpperCase()}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
