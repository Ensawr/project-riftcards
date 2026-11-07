import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Button } from './button';
import { Icon, type IconName } from './icon';

type StateAction = { label: string; onPress: () => void; icon?: IconName };

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message?: string;
  action?: StateAction;
};

/** Centered placeholder shown when a list or screen has nothing to show yet. */
export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { gap: theme.spacing.md, padding: theme.spacing.xl }]}>
      <View
        style={[
          styles.iconWrap,
          {
            width: theme.sizes.iconXl * 2,
            height: theme.sizes.iconXl * 2,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.primaryMuted,
            marginBottom: theme.spacing.xs,
          },
        ]}>
        <Icon name={icon} size={theme.sizes.iconXl} color="primary" />
      </View>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" color="textSecondary" align="center" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {action ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <Button label={action.label} icon={action.icon} onPress={action.onPress} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

export function LoadingState({ message }: { message?: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={[styles.container, { gap: theme.spacing.md, padding: theme.spacing.xl }]}
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? t('common.loading')}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <AppText variant="caption" color="textSecondary" align="center">
        {message ?? t('common.loading')}
      </AppText>
    </View>
  );
}

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.container, { gap: theme.spacing.md, padding: theme.spacing.xl }]} accessibilityRole="alert">
      <View
        style={[
          styles.iconWrap,
          {
            width: theme.sizes.iconXl * 2,
            height: theme.sizes.iconXl * 2,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.dangerMuted,
            marginBottom: theme.spacing.xs,
          },
        ]}>
        <Icon name="alert-circle-outline" size={theme.sizes.iconXl} color="danger" />
      </View>
      <AppText variant="heading" align="center">
        {title ?? t('errors.genericTitle')}
      </AppText>
      <AppText variant="body" color="textSecondary" align="center" style={styles.message}>
        {message ?? t('errors.genericBody')}
      </AppText>
      {onRetry ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <Button label={t('common.retry')} icon="refresh" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  message: { maxWidth: 340 },
});
