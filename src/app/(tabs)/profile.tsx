import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileContent } from '@/components/profile/profile-content';
import { Button, IconButton, ScreenHeader } from '@/components/ui';
import { useCurrentProfile } from '@/features/auth/auth-provider';
import { useTheme } from '@/theme';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const profile = useCurrentProfile();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader
        title={t('profile.title')}
        actions={
          <IconButton icon="settings-outline" accessibilityLabel={t('profile.openSettings')} onPress={() => router.push('/settings')} />
        }
      />
      <ProfileContent
        isOwn
        profile={profile}
        actions={
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button label={t('profile.edit')} icon="create-outline" variant="secondary" onPress={() => router.push('/edit-profile')} fullWidth />
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}
