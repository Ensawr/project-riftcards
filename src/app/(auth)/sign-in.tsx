import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AuthHero } from '@/components/auth/auth-hero';
import { AppText, Button, FormScreen, TextField } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = EMAIL_PATTERN.test(email.trim()) && password.length > 0;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    // On success the auth listener updates the session and the router guard moves on.
    if (signInError) setError(getErrorMessage(t, signInError));
  };

  return (
    <FormScreen edges={['top', 'bottom']}>
      <View style={{ height: theme.spacing.xl }} />
      <AuthHero title={t('auth.signInTitle')} subtitle={t('auth.signInSubtitle')} />
      <TextField
        label={t('auth.email')}
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <TextField
        label={t('auth.password')}
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        secureToggle
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {error ? (
        <AppText variant="caption" color="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      <Button label={t('auth.signIn')} onPress={submit} loading={submitting} disabled={!valid} fullWidth />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.xs }}>
        <AppText variant="body" color="textSecondary">
          {t('auth.noAccount')}
        </AppText>
        <Link href="/sign-up" replace>
          <AppText variant="bodyStrong" color="primary">
            {t('auth.signUp')}
          </AppText>
        </Link>
      </View>
    </FormScreen>
  );
}
