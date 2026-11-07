import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AuthHero } from '@/components/auth/auth-hero';
import { AppText, Button, EmptyState, FormScreen, TextField } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function SignUpScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const emailValid = EMAIL_PATTERN.test(email.trim());
  const passwordValid = password.length >= MIN_PASSWORD_LENGTH;

  const submit = async () => {
    if (!emailValid || !passwordValid || submitting) return;
    setSubmitting(true);
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
    setSubmitting(false);
    if (signUpError) {
      setError(getErrorMessage(t, signUpError));
      return;
    }
    // With "Confirm email" enabled in Supabase, no session is returned until the link is clicked.
    if (!data.session) setAwaitingConfirmation(true);
  };

  if (awaitingConfirmation) {
    return (
      <FormScreen edges={['top', 'bottom']}>
        <EmptyState
          icon="mail-outline"
          title={t('auth.confirmTitle')}
          message={t('auth.confirmBody', { email: email.trim() })}
        />
        <Button label={t('auth.backToSignIn')} onPress={() => router.replace('/sign-in')} variant="secondary" />
      </FormScreen>
    );
  }

  return (
    <FormScreen edges={['top', 'bottom']}>
      <View style={{ height: theme.spacing.xl }} />
      <AuthHero title={t('auth.signUpTitle')} subtitle={t('auth.signUpSubtitle')} />
      <TextField
        label={t('auth.email')}
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        error={email.length > 3 && !emailValid ? t('auth.emailInvalid') : null}
      />
      <TextField
        label={t('auth.password')}
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        secureToggle
        autoComplete="new-password"
        textContentType="newPassword"
        hint={t('auth.passwordHint', { count: MIN_PASSWORD_LENGTH })}
        error={password.length > 0 && !passwordValid ? t('auth.passwordHint', { count: MIN_PASSWORD_LENGTH }) : null}
        onSubmitEditing={submit}
      />
      {error ? (
        <AppText variant="caption" color="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      <Button
        label={t('auth.createAccount')}
        onPress={submit}
        loading={submitting}
        disabled={!emailValid || !passwordValid}
        fullWidth
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.xs }}>
        <AppText variant="body" color="textSecondary">
          {t('auth.haveAccount')}
        </AppText>
        <Link href="/sign-in" replace>
          <AppText variant="bodyStrong" color="primary">
            {t('auth.signIn')}
          </AppText>
        </Link>
      </View>
    </FormScreen>
  );
}
