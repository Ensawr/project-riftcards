import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { AppText, Chip, Icon, TextField } from '@/components/ui';
import { OTHER_SETS, type CatalogFilters } from '@/features/catalog/api';
import { CARD_TYPES, DOMAINS, RARITIES } from '@/features/catalog/constants';
import { useSetGroups } from '@/features/catalog/hooks';
import { useTheme } from '@/theme';

type CatalogFilterBarProps = {
  filters: CatalogFilters;
  onChange: (filters: CatalogFilters) => void;
};

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <AppText variant="label" color="textMuted">
        {title}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: theme.spacing.sm, paddingRight: theme.spacing.lg }}>
        {children}
      </ScrollView>
    </View>
  );
}

/** Search + set / domain / rarity / type filters for the card catalog. */
export function CatalogFilterBar({ filters, onChange }: CatalogFilterBarProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { mainSets } = useSetGroups();
  const [expanded, setExpanded] = useState(false);

  const activeCount = [filters.setId, filters.domain, filters.rarity, filters.type].filter(Boolean).length;
  const hasAnything = activeCount > 0 || Boolean(filters.query?.trim());

  const toggle = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) =>
    onChange({ ...filters, [key]: filters[key] === value ? null : value });

  return (
    <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
      <View style={[styles.row, { gap: theme.spacing.sm }]}>
        <View style={{ flex: 1 }}>
          <TextField
            compact
            icon="search"
            value={filters.query ?? ''}
            onChangeText={(query) => onChange({ ...filters, query })}
            placeholder={t('catalog.searchPlaceholder')}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <Pressable
          onPress={() => setExpanded((value) => !value)}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={t('catalog.filters')}
          style={({ pressed }) => [
            styles.filterButton,
            {
              borderRadius: theme.radius.md,
              backgroundColor: expanded || activeCount ? theme.colors.primary : pressed ? theme.colors.surfaceElevated : theme.colors.surface,
              borderColor: expanded || activeCount ? theme.colors.primary : theme.colors.border,
            },
          ]}>
          <Icon name="options-outline" size={20} color={expanded || activeCount ? 'onPrimary' : 'text'} />
          {activeCount ? (
            <View style={[styles.count, { backgroundColor: theme.colors.onPrimary }]}>
              <AppText variant="captionStrong" color="primary" style={styles.countText}>
                {activeCount}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      </View>

      {expanded ? (
        <Animated.View
          entering={FadeInUp.duration(200)}
          exiting={FadeOutUp.duration(150)}
          style={[
            styles.panel,
            {
              gap: theme.spacing.lg,
              padding: theme.spacing.lg,
              paddingRight: 0,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <FilterSection title={t('catalog.set')}>
            {mainSets.map((set, index) => (
              <Chip
                key={set.id}
                label={`${index + 1} · ${set.name}`}
                selected={filters.setId === set.id}
                onPress={() => toggle('setId', set.id)}
              />
            ))}
            <Chip label={t('catalog.otherSets')} selected={filters.setId === OTHER_SETS} onPress={() => toggle('setId', OTHER_SETS)} />
          </FilterSection>
          <FilterSection title={t('catalog.domain')}>
            {DOMAINS.map((domain) => (
              <Chip
                key={domain.slug}
                label={domain.label}
                dotColor={domain.color}
                selected={filters.domain === domain.slug}
                onPress={() => toggle('domain', domain.slug)}
              />
            ))}
          </FilterSection>
          <FilterSection title={t('catalog.rarity')}>
            {RARITIES.map((rarity) => (
              <Chip key={rarity.slug} label={rarity.label} selected={filters.rarity === rarity.slug} onPress={() => toggle('rarity', rarity.slug)} />
            ))}
          </FilterSection>
          <FilterSection title={t('catalog.type')}>
            {CARD_TYPES.map((type) => (
              <Chip key={type.slug} label={type.label} selected={filters.type === type.slug} onPress={() => toggle('type', type.slug)} />
            ))}
          </FilterSection>
        </Animated.View>
      ) : null}

      {hasAnything ? (
        <Pressable
          onPress={() => onChange({})}
          accessibilityRole="button"
          hitSlop={8}
          style={[styles.reset, { gap: theme.spacing.xs }]}>
          <Icon name="refresh" size={15} color="primary" />
          <AppText variant="captionStrong" color="primary">
            {t('catalog.resetFilters')}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  filterButton: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  count: { position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 11, lineHeight: 14 },
  panel: { borderWidth: 1 },
  reset: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
});
