import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardImage, isLandscapeCard } from '@/components/cards/card-image';
import { BinderRow } from '@/components/collections/binder-row';
import {
  AppText,
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  QuantityStepper,
  Surface,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { usePrinting } from '@/features/catalog/hooks';
import { useAdjustCollectionCard, useCollectionQuantity, useCollections } from '@/features/collections/api';
import { getErrorMessage } from '@/lib/errors';
import { useTheme } from '@/theme';

/** Quantity controls for one binder. */
function BinderQuantity({ binderId, printingId }: { binderId: string; printingId: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const quantity = useCollectionQuantity(binderId, printingId);
  const adjust = useAdjustCollectionCard(binderId);
  const value = quantity.data ?? 0;

  return (
    <Surface style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
      <View style={styles.rowBetween}>
        <AppText variant="bodyStrong">{t('card.inThisBinder')}</AppText>
        <QuantityStepper
          value={value}
          busy={adjust.isPending || quantity.isPending}
          onIncrement={() => adjust.mutate({ printingId, delta: 1 })}
          onDecrement={() => adjust.mutate({ printingId, delta: -1 })}
        />
      </View>
      {value > 0 ? (
        <Button
          label={t('card.removeFromBinder')}
          icon="trash-outline"
          variant="ghost"
          onPress={() => adjust.mutate({ printingId, delta: -value })}
        />
      ) : null}
      {adjust.error ? (
        <AppText variant="caption" color="danger">
          {getErrorMessage(t, adjust.error)}
        </AppText>
      ) : null}
    </Surface>
  );
}

/** Lets the user pick one of their binders and add copies there. */
function AddToBinderSheet({ printingId, visible, onClose }: { printingId: string; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { userId } = useAuth();
  const binders = useCollections(userId);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={[styles.rowBetween, { padding: theme.spacing.lg }]}>
          <AppText variant="title">{t('card.addToBinder')}</AppText>
          <IconButton icon="close" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
          {binders.isPending ? (
            <LoadingState />
          ) : (binders.data ?? []).length === 0 ? (
            <EmptyState
              icon="albums-outline"
              title={t('collection.collectionsEmptyTitle')}
              message={t('card.createBinderFirst')}
              action={{
                label: t('collection.newBinder'),
                icon: 'add',
                onPress: () => {
                  onClose();
                  router.push('/binder-form');
                },
              }}
            />
          ) : (
            (binders.data ?? []).map((binder) =>
              selected === binder.id ? (
                <Animated.View key={binder.id} entering={FadeIn} style={{ gap: theme.spacing.sm }}>
                  <AppText variant="bodyStrong">{binder.name}</AppText>
                  <BinderQuantity binderId={binder.id} printingId={printingId} />
                </Animated.View>
              ) : (
                <BinderRow key={binder.id} binder={binder} onPress={() => setSelected(binder.id)} />
              ),
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function CardScreen() {
  const { id, binderId } = useLocalSearchParams<{ id: string; binderId?: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const printing = usePrinting(id);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: printing.data?.name ?? '' });
  }, [navigation, printing.data?.name]);

  if (printing.isPending) return <LoadingState />;
  if (printing.isError) return <ErrorState message={t('errors.loadFailed')} onRetry={() => void printing.refetch()} />;
  if (!printing.data) return <EmptyState icon="help-circle-outline" title={t('card.notFound')} />;

  const card = printing.data;
  const landscape = isLandscapeCard(card.types);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        padding: theme.spacing.lg,
        gap: theme.spacing.xl,
        paddingBottom: theme.spacing.xxxl,
        width: '100%',
        maxWidth: theme.sizes.maxContentWidth,
        alignSelf: 'center',
      }}>
      <Animated.View entering={FadeInDown.duration(320)} style={{ alignItems: 'center', gap: theme.spacing.lg }}>
        {/* Battlefields are printed landscape, so the detail view shows them horizontally. */}
        <View style={[styles.imageShadow, { width: landscape ? '100%' : '76%', maxWidth: landscape ? 520 : 360, shadowColor: theme.colors.shadow }]}>
          <CardImage
            imageId={card.image_id}
            name={card.name}
            size="full"
            rounded={theme.radius.lg}
            landscape={landscape}
            naturalOrientation
          />
        </View>
        <AppText variant="heading" color="textSecondary" align="center">
          {card.set_name} · {card.short_code}
        </AppText>
      </Animated.View>

      {binderId ? (
        <BinderQuantity binderId={binderId} printingId={card.id} />
      ) : (
        <Button label={t('card.addToBinder')} icon="add" onPress={() => setSheetOpen(true)} fullWidth />
      )}

      <AddToBinderSheet printingId={card.id} visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  imageShadow: { shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
});
