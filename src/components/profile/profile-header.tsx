import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, Icon } from '@/components/ui';
import { flagEmoji, getCountryName } from '@/constants/countries';
import type { ProfileStats } from '@/features/profiles/api';
import type { Profile } from '@/features/types';
import { useTheme } from '@/theme';

function StatItem({ value, label }: { value: number | undefined; label: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="heading">{value ?? '–'}</AppText>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

export function ProfileHeader({ profile, stats, actions }: { profile: Profile; stats?: ProfileStats; actions?: ReactNode }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  return (
    <View style={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.lg }}>
      <View style={[styles.top, { gap: theme.spacing.lg }]}>
        <Avatar username={profile.username} background={profile.avatar_background} symbol={profile.avatar_symbol} size={76} />
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <AppText variant="title" numberOfLines={1}>
            {profile.username}
          </AppText>
          <View style={[styles.location, { gap: theme.spacing.xs }]}>
            <Icon name="location-outline" size={14} color="textMuted" />
            <AppText variant="caption" color="textSecondary" numberOfLines={1}>
              {flagEmoji(profile.country_code)} {profile.city}, {getCountryName(profile.country_code, i18n.language)}
            </AppText>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.stats,
          { borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, paddingVertical: theme.spacing.md },
        ]}>
        <StatItem value={stats?.followers} label={t('profile.followers')} />
        <StatItem value={stats?.following} label={t('profile.following')} />
        <StatItem value={stats?.posts} label={t('profile.posts')} />
      </View>
      {actions}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center' },
  location: { flexDirection: 'row', alignItems: 'center' },
  stats: { flexDirection: 'row', borderWidth: 1 },
  stat: { flex: 1, alignItems: 'center' },
});
