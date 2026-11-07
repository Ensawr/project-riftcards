import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ProfileForm } from '@/components/forms/profile-form';
import { FormScreen } from '@/components/ui';
import { useCurrentProfile } from '@/features/auth/auth-provider';
import { useSaveProfile } from '@/features/profiles/api';
import { getErrorMessage } from '@/lib/errors';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const profile = useCurrentProfile();
  const save = useSaveProfile();

  return (
    <FormScreen>
      <ProfileForm
        initial={profile}
        submitLabel={t('common.save')}
        submitting={save.isPending}
        error={save.error ? getErrorMessage(t, save.error) : null}
        onSubmit={(input) => save.mutate(input, { onSuccess: () => router.back() })}
      />
    </FormScreen>
  );
}
