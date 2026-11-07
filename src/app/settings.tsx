import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ListRow, Screen, Section, type IconName } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { LANGUAGE_NATIVE_NAMES, SUPPORTED_LANGUAGES, useAppLanguage } from '@/i18n';
import { THEME_PREFERENCES, useTheme, useThemePreference, type ThemePreference } from '@/theme';

const THEME_ICONS: Record<ThemePreference, IconName> = {
  light: 'sunny-outline',
  dark: 'moon-outline',
  system: 'phone-portrait-outline',
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();
  const { language, setLanguage } = useAppLanguage();
  const { signOut } = useAuth();

  const themeLabels: Record<ThemePreference, string> = {
    light: t('settings.themeLight'),
    dark: t('settings.themeDark'),
    system: t('settings.themeSystem'),
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: theme.spacing.xl, paddingTop: theme.spacing.md }}>
      <Section title={t('settings.appearance')}>
        {THEME_PREFERENCES.map((option, index) => (
          <ListRow
            key={option}
            icon={THEME_ICONS[option]}
            label={themeLabels[option]}
            selected={preference === option}
            onPress={() => setPreference(option)}
            isLast={index === THEME_PREFERENCES.length - 1}
          />
        ))}
      </Section>

      <Section title={t('settings.language')}>
        {SUPPORTED_LANGUAGES.map((option, index) => (
          <ListRow
            key={option}
            icon="language-outline"
            label={LANGUAGE_NATIVE_NAMES[option]}
            selected={language === option}
            onPress={() => void setLanguage(option)}
            isLast={index === SUPPORTED_LANGUAGES.length - 1}
          />
        ))}
      </Section>

      <Section title={t('settings.account')}>
        <ListRow icon="create-outline" label={t('profile.edit')} onPress={() => router.push('/edit-profile')} navigates />
        <ListRow icon="log-out-outline" label={t('profile.signOut')} onPress={() => void signOut()} isLast />
      </Section>

      <Section title={t('settings.about')}>
        <ListRow
          icon="information-circle-outline"
          label={t('settings.version')}
          value={Constants.expoConfig?.version ?? '—'}
          isLast
        />
      </Section>
    </Screen>
  );
}
