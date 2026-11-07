import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { AppText, Icon, PressableScale } from '@/components/ui';
import { domainColor, printingVariantLabel } from '@/features/catalog/constants';
import type { CatalogPrinting } from '@/features/types';
import { useTheme } from '@/theme';

import { CardImage, isLandscapeCard } from './card-image';

type CardTileProps = {
  printing: CatalogPrinting;
  onPress?: (printing: CatalogPrinting) => void;
  /** Shows a quantity badge (binder / listing contexts). */
  quantity?: number;
  /** When set (and quantity > 0), shows a "−" button to remove one copy. */
  onDecrement?: (printing: CatalogPrinting) => void;
  /** Accent ring when the tile is "selected" (e.g. already in a draft). */
  highlighted?: boolean;
};

export const CardTile = memo(function CardTile({ printing, onPress, quantity, onDecrement, highlighted = false }: CardTileProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const hasQuantity = Boolean(quantity && quantity > 0);

  return (
    <View style={styles.tile}>
      <PressableScale
        onPress={onPress ? () => onPress(printing) : undefined}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={[printing.name, printing.short_code, hasQuantity ? `×${quantity}` : ''].filter(Boolean).join(', ')}
        style={{ gap: theme.spacing.xs }}>
        <View
          style={[
            { borderRadius: theme.radius.sm + 2, padding: 2 },
            { backgroundColor: highlighted ? theme.colors.primary : 'transparent' },
          ]}>
          <CardImage imageId={printing.image_id} name={printing.name} landscape={isLandscapeCard(printing.types)} />
        </View>
        <View style={[styles.meta, { gap: theme.spacing.xs }]}>
          <View style={[styles.domains, { gap: 3 }]}>
            {printing.domains.slice(0, 2).map((domain) => (
              <View key={domain} style={[styles.dot, { backgroundColor: domainColor(domain) }]} />
            ))}
          </View>
          <AppText variant="captionStrong" numberOfLines={1} style={styles.name}>
            {printing.name}
          </AppText>
        </View>
        <AppText variant="caption" color="textMuted" numberOfLines={1} style={styles.sub}>
          {[printing.short_code, printingVariantLabel(printing)].filter(Boolean).join(' · ')}
        </AppText>
      </PressableScale>

      {hasQuantity ? (
        <Animated.View
          key={quantity}
          entering={ZoomIn.springify().damping(14)}
          pointerEvents="none"
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.sm,
              top: theme.spacing.xs + 2,
              right: theme.spacing.xs + 2,
            },
          ]}>
          <AppText variant="captionStrong" color="onPrimary">
            ×{quantity}
          </AppText>
        </Animated.View>
      ) : null}

      {hasQuantity && onDecrement ? (
        <Animated.View entering={ZoomIn} exiting={ZoomOut} style={[styles.minusWrap, { top: theme.spacing.xs, left: theme.spacing.xs }]}>
          <Pressable
            onPress={() => onDecrement(printing)}
            accessibilityRole="button"
            accessibilityLabel={t('catalog.removeOne', { name: printing.name })}
            hitSlop={8}
            style={({ pressed }) => [
              styles.minus,
              {
                backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
                borderColor: theme.colors.borderStrong,
              },
            ]}>
            <Icon name="remove" size={18} />
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  tile: { flex: 1 },
  badge: { position: 'absolute', minWidth: 30, alignItems: 'center' },
  minusWrap: { position: 'absolute' },
  minus: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  meta: { flexDirection: 'row', alignItems: 'center' },
  domains: { flexDirection: 'row' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  name: { flex: 1 },
  sub: { fontSize: 11, lineHeight: 14, marginTop: -2 },
});
