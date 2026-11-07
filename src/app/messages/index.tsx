import { useTranslation } from 'react-i18next';

import { EmptyState, Screen } from '@/components/ui';

export default function MessagesScreen() {
  const { t } = useTranslation();

  return (
    <Screen edges={['bottom']}>
      <EmptyState icon="chatbubbles-outline" title={t('messages.emptyTitle')} message={t('messages.emptyBody')} />
    </Screen>
  );
}
