import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Icon, IconButton, TextField } from '@/components/ui';
import { COUNTRIES, flagEmoji, getCountryName } from '@/constants/countries';
import { useTheme } from '@/theme';

type CountryPickerProps = {
  value: string | null;
  onChange: (code: string | null) => void;
  label?: string;
  error?: string | null;
  /** Adds an "any country" option (used by filters). */
  allowAny?: boolean;
  compact?: boolean;
};

function normalize(value: string) {
  return value.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function CountryPicker({ value, onChange, label, error, allowAny = false, compact = false }: CountryPickerProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const language = i18n.language;

  const countries = useMemo(() => {
    const sorted = [...COUNTRIES].sort((a, b) =>
      (language === 'tr' ? a.tr : a.en).localeCompare(language === 'tr' ? b.tr : b.en, language),
    );
    const query = normalize(search.trim());
    if (!query) return sorted;
    return sorted.filter(
      (country) => normalize(country.en).includes(query) || normalize(country.tr).includes(query) || country.code.toLowerCase() === query,
    );
  }, [language, search]);

  const select = (code: string | null) => {
    onChange(code);
    setOpen(false);
    setSearch('');
  };

  return (
    <View style={{ gap: theme.spacing.xs }}>
      {label ? (
        <AppText variant="captionStrong" color="textSecondary">
          {label}
        </AppText>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label ?? t('profile.country')}
        style={[
          styles.field,
          {
            minHeight: compact ? 36 : theme.sizes.minTouch + 4,
            borderRadius: compact ? theme.radius.pill : theme.radius.md,
            borderColor: error ? theme.colors.danger : value && compact ? theme.colors.primary : theme.colors.border,
            backgroundColor: value && compact ? theme.colors.primaryMuted : theme.colors.surface,
            paddingHorizontal: theme.spacing.md,
            gap: theme.spacing.sm,
          },
        ]}>
        <Icon name="globe-outline" size={theme.sizes.iconSm} color={value && compact ? 'primary' : 'textMuted'} />
        <AppText
          variant={compact ? 'captionStrong' : 'body'}
          color={value ? (compact ? 'primary' : 'text') : 'textMuted'}
          style={{ flex: compact ? undefined : 1 }}
          numberOfLines={1}>
          {value ? `${flagEmoji(value)} ${getCountryName(value, language)}` : allowAny ? t('explore.anyCountry') : t('profile.selectCountry')}
        </AppText>
        <Icon name="chevron-down" size={16} color="textMuted" />
      </Pressable>
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
          <View style={[styles.sheetHeader, { padding: theme.spacing.lg, gap: theme.spacing.md }]}>
            <AppText variant="title" style={{ flex: 1 }}>
              {t('profile.selectCountry')}
            </AppText>
            <IconButton icon="close" accessibilityLabel={t('common.close')} onPress={() => setOpen(false)} />
          </View>
          <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
            <TextField
              compact
              icon="search"
              value={search}
              onChangeText={setSearch}
              placeholder={t('profile.searchCountry')}
              autoCorrect={false}
              autoFocus
            />
          </View>
          <FlatList
            data={countries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              allowAny ? (
                <Row label={t('explore.anyCountry')} selected={value === null} onPress={() => select(null)} />
              ) : undefined
            }
            renderItem={({ item }) => (
              <Row
                label={`${flagEmoji(item.code)}  ${language === 'tr' ? item.tr : item.en}`}
                selected={item.code === value}
                onPress={() => select(item.code)}
              />
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function Row({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: theme.sizes.minTouch + 4,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: pressed ? theme.colors.surfaceElevated : 'transparent',
          borderBottomColor: theme.colors.border,
        },
      ]}>
      <AppText variant="body" style={{ flex: 1 }}>
        {label}
      </AppText>
      {selected ? <Icon name="checkmark" color="primary" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
});
