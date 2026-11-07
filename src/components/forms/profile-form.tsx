import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, TextField } from '@/components/ui';
import { AVATAR_BACKGROUNDS, AVATAR_SYMBOLS, randomAvatarBackground } from '@/features/profiles/avatar-options';
import { isUsernameAvailable, USERNAME_PATTERN, type ProfileInput } from '@/features/profiles/api';
import type { Profile } from '@/features/types';
import { useTheme } from '@/theme';

import { CountryPicker } from './country-picker';

type UsernameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

type ProfileFormProps = {
  initial?: Profile | null;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (input: ProfileInput) => void;
};

export function ProfileForm({ initial, submitLabel, submitting, error, onSubmit }: ProfileFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [username, setUsername] = useState(initial?.username ?? '');
  const [country, setCountry] = useState<string | null>(initial?.country_code ?? null);
  const [city, setCity] = useState(initial?.city ?? '');
  const [background, setBackground] = useState(() => initial?.avatar_background ?? randomAvatarBackground());
  const [symbol, setSymbol] = useState<number | null>(initial?.avatar_symbol ?? null);
  // Result of the last availability lookup, keyed by the username it was made for.
  const [lookup, setLookup] = useState<{ username: string; available: boolean | null } | null>(null);

  const trimmed = username.trim();
  const unchanged = Boolean(initial) && trimmed.toLowerCase() === initial?.username.toLowerCase();
  const needsLookup = Boolean(trimmed) && !unchanged && USERNAME_PATTERN.test(trimmed);

  const usernameState: UsernameState = !trimmed || unchanged
    ? 'idle'
    : !USERNAME_PATTERN.test(trimmed)
      ? 'invalid'
      : lookup?.username !== trimmed
        ? 'checking'
        : lookup.available === null
          ? 'idle'
          : lookup.available
            ? 'available'
            : 'taken';

  // Debounced availability check; the database unique index is the final authority.
  useEffect(() => {
    if (!needsLookup) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      isUsernameAvailable(trimmed)
        .then((available) => {
          if (!cancelled) setLookup({ username: trimmed, available });
        })
        .catch(() => {
          if (!cancelled) setLookup({ username: trimmed, available: null });
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, needsLookup]);

  const usernameOk = unchanged || usernameState === 'available' || usernameState === 'idle';
  const canSubmit =
    USERNAME_PATTERN.test(trimmed) && usernameOk && usernameState !== 'checking' && Boolean(country) && city.trim().length > 0;

  const usernameMessage =
    usernameState === 'invalid'
      ? t('onboarding.usernameRules')
      : usernameState === 'taken'
        ? t('onboarding.usernameTaken')
        : null;
  const usernameHint =
    usernameState === 'available' ? t('onboarding.usernameAvailable') : usernameState === 'checking' ? t('onboarding.usernameChecking') : t('onboarding.usernameRules');

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
        <Avatar username={trimmed || '?'} background={background} symbol={symbol} size={96} />
        <AppText variant="caption" color="textMuted">
          {symbol === null ? t('onboarding.avatarInitialHint') : t('onboarding.avatarHint')}
        </AppText>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="captionStrong" color="textSecondary">
          {t('onboarding.background')}
        </AppText>
        <View style={[styles.grid, { gap: theme.spacing.sm }]}>
          {AVATAR_BACKGROUNDS.map((palette, index) => (
            <Pressable
              key={palette.from}
              onPress={() => setBackground(index)}
              accessibilityRole="radio"
              accessibilityState={{ checked: background === index }}
              accessibilityLabel={`${t('onboarding.background')} ${index + 1}`}
              style={[
                styles.swatch,
                {
                  backgroundColor: palette.to,
                  borderColor: background === index ? theme.colors.text : palette.from,
                  borderWidth: background === index ? 3 : 2,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="captionStrong" color="textSecondary">
          {t('onboarding.symbol')}
        </AppText>
        <View style={[styles.grid, { gap: theme.spacing.sm }]}>
          <Pressable
            onPress={() => setSymbol(null)}
            accessibilityRole="radio"
            accessibilityState={{ checked: symbol === null }}
            accessibilityLabel={t('onboarding.symbolInitial')}
            style={[styles.symbol, symbolStyle(theme, symbol === null)]}>
            <AppText variant="heading">{(trimmed.charAt(0) || 'A').toUpperCase()}</AppText>
          </Pressable>
          {AVATAR_SYMBOLS.map((name, index) => (
            <Pressable
              key={name}
              onPress={() => setSymbol(index)}
              accessibilityRole="radio"
              accessibilityState={{ checked: symbol === index }}
              accessibilityLabel={`${t('onboarding.symbol')} ${index + 1}`}
              style={[styles.symbol, symbolStyle(theme, symbol === index)]}>
              <MaterialCommunityIcons name={name} size={22} color={symbol === index ? theme.colors.primary : theme.colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </View>

      <TextField
        label={t('onboarding.username')}
        icon="at"
        value={username}
        onChangeText={(value) => setUsername(value.replace(/\s/g, ''))}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        maxLength={20}
        error={usernameMessage}
        hint={usernameHint}
      />
      <CountryPicker label={t('profile.country')} value={country} onChange={setCountry} />
      <TextField
        label={t('profile.city')}
        icon="location-outline"
        value={city}
        onChangeText={setCity}
        maxLength={60}
        autoComplete="off"
        textContentType="addressCity"
      />

      {error ? (
        <AppText variant="caption" color="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}

      <Button
        label={submitLabel}
        onPress={() =>
          canSubmit &&
          onSubmit({
            username: trimmed,
            country_code: country!,
            city: city.trim(),
            avatar_background: background,
            avatar_symbol: symbol,
          })
        }
        loading={submitting}
        disabled={!canSubmit}
        fullWidth
      />
    </View>
  );
}

function symbolStyle(theme: ReturnType<typeof useTheme>, selected: boolean) {
  return {
    borderRadius: theme.radius.md,
    backgroundColor: selected ? theme.colors.primaryMuted : theme.colors.surface,
    borderColor: selected ? theme.colors.primary : theme.colors.border,
  };
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  swatch: { width: 40, height: 40, borderRadius: 20 },
  symbol: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
});
