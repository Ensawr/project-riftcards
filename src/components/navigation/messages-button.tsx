import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { IconButton } from '@/components/ui';

/**
 * Entry point to the inbox, shown in the Home header (messaging lives outside the five tabs).
 * `hasUnread` will be wired to real data in the messaging stage.
 */
export function MessagesButton({ hasUnread = false }: { hasUnread?: boolean }) {
  const { t } = useTranslation();
  return (
    <IconButton
      icon="chatbubbles-outline"
      accessibilityLabel={t('home.openMessages')}
      onPress={() => router.push('/messages')}
      showBadge={hasUnread}
    />
  );
}
