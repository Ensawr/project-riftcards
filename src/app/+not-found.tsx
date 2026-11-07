import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, Screen } from '@/components/ui';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <Screen edges={['top', 'bottom']}>
      <EmptyState
        icon="compass-outline"
        title={t('errors.notFoundTitle')}
        message={t('errors.notFoundBody')}
        action={{ label: t('errors.goHome'), icon: 'home-outline', onPress: () => router.replace('/') }}
      />
    </Screen>
  );
}
