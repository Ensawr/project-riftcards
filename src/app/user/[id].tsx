import { Redirect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ProfileContent } from '@/components/profile/profile-content';
import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { useProfile, useProfileStats, useToggleFollow } from '@/features/profiles/api';
import { getErrorMessage } from '@/lib/errors';
import { useTheme } from '@/theme';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const { userId } = useAuth();
  const profile = useProfile(id);
  const stats = useProfileStats(id);
  const follow = useToggleFollow(id);

  useEffect(() => {
    navigation.setOptions({ title: profile.data?.username ?? '' });
  }, [navigation, profile.data?.username]);

  if (id === userId) return <Redirect href="/profile" />;
  if (profile.isPending) return <LoadingState />;
  if (profile.isError) return <ErrorState message={t('errors.loadFailed')} onRetry={() => void profile.refetch()} />;
  if (!profile.data) return <EmptyState icon="person-outline" title={t('profile.notFound')} />;

  const following = stats.data?.is_following ?? false;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ProfileContent
        isOwn={false}
        profile={profile.data}
        actions={
          <View style={{ gap: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={following ? t('profile.unfollow') : t('profile.follow')}
                  icon={following ? 'checkmark' : 'person-add-outline'}
                  variant={following ? 'secondary' : 'primary'}
                  loading={follow.isPending || stats.isPending}
                  onPress={() => follow.mutate(!following)}
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button label={t('profile.message')} icon="chatbubble-outline" variant="secondary" onPress={() => {}} disabled fullWidth />
              </View>
            </View>
            {follow.error ? <ErrorState message={getErrorMessage(t, follow.error)} /> : null}
          </View>
        }
      />
    </View>
  );
}
