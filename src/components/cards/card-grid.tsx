import type { ReactElement } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon, PressableScale } from '@/components/ui';
import { useTheme } from '@/theme';

type CardGridProps<T> = {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement;
  onEndReached?: () => void;
  loadingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  header?: ReactElement;
  empty?: ReactElement;
  /** Re-render tiles when state outside `data` changes (selection, quantities). */
  extraData?: unknown;
  /** Rendered as the first tile of the grid (e.g. an "add card" placeholder). */
  leading?: ReactElement;
};

type Cell<T> = { kind: 'leading' } | { kind: 'item'; item: T };

const LEADING_KEY = '__leading__';

/** Responsive, virtualized card grid (3 columns on phones, more on tablets). */
export function CardGrid<T>({
  data,
  keyExtractor,
  renderItem,
  onEndReached,
  loadingMore = false,
  refreshing = false,
  onRefresh,
  header,
  empty,
  extraData,
  leading,
}: CardGridProps<T>) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, theme.sizes.maxContentWidth);
  const columns = contentWidth >= 600 ? 5 : contentWidth >= 420 ? 4 : 3;
  const gap = theme.spacing.md;
  const itemWidth = Math.floor((contentWidth - theme.spacing.lg * 2 - gap * (columns - 1)) / columns);

  const cells: Cell<T>[] = [
    ...(leading ? [{ kind: 'leading' } as const] : []),
    ...data.map((item) => ({ kind: 'item', item }) as const),
  ];

  return (
    <FlatList
      key={columns}
      data={cells}
      extraData={extraData}
      numColumns={columns}
      keyExtractor={(cell) => (cell.kind === 'leading' ? LEADING_KEY : keyExtractor(cell.item))}
      renderItem={({ item: cell }) => (
        <Animated.View entering={FadeIn.duration(220)} style={{ width: itemWidth }}>
          {cell.kind === 'leading' ? leading : renderItem(cell.item)}
        </Animated.View>
      )}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator style={{ marginVertical: theme.spacing.xl }} color={theme.colors.primary} /> : undefined
      }
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      columnWrapperStyle={{ gap, marginBottom: theme.spacing.lg }}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl, maxWidth: theme.sizes.maxContentWidth },
      ]}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      initialNumToRender={18}
      maxToRenderPerBatch={18}
      windowSize={7}
      removeClippedSubviews
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} /> : undefined
      }
    />
  );
}

/** Same footprint as a card tile, used as the "+ add card" slot. */
export function AddCardTile({ onPress, label }: { onPress: () => void; label: string }) {
  const theme = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={{ padding: 2 }}>
        <View
          style={[
            styles.addFrame,
            {
              aspectRatio: theme.sizes.cardAspect,
              borderRadius: theme.radius.sm,
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.primaryMuted,
            },
          ]}>
          <View style={[styles.addCircle, { backgroundColor: theme.colors.primary }]}>
            <Icon name="add" size={26} color="onPrimary" />
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, width: '100%', alignSelf: 'center' },
  addFrame: { width: '100%', borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
