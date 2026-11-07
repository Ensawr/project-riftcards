import { useTranslation } from 'react-i18next';

import { AuthHero } from '@/components/auth/auth-hero';
import { ProfileForm } from '@/components/forms/profile-form';
import { Button, FormScreen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { useSaveProfile } from '@/features/profiles/api';
import { getErrorMessage } from '@/lib/errors';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const save = useSaveProfile();

  return (
    <FormScreen edges={['top', 'bottom']}>
      <AuthHero title={t('onboarding.title')} subtitle={t('onboarding.subtitle')} />
      <ProfileForm
        submitLabel={t('onboarding.submit')}
        submitting={save.isPending}
        error={save.error ? getErrorMessage(t, save.error) : null}
        onSubmit={(input) => save.mutate(input)}
      />
      <Button label={t('profile.signOut')} variant="ghost" onPress={() => void signOut()} />
    </FormScreen>
  );
}
