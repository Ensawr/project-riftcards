import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { CardImage, isLandscapeCard } from '@/components/cards/card-image';
import { AppText, Button, FormScreen, Icon, OptionGroup, QuantityStepper, Surface, TextField } from '@/components/ui';
import { printingVariantLabel } from '@/features/catalog/constants';
import { useCreateListing } from '@/features/posts/api';
import { listingDraft, useListingDraft, type DraftCard } from '@/features/posts/listing-draft';
import type { PostCardRole } from '@/features/types';
import { getErrorMessage } from '@/lib/errors';
import { useTheme } from '@/theme';

function DraftCardList({ role, items, emptyLabel }: { role: PostCardRole; items: DraftCard[]; emptyLabel: string }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Surface>
      {items.map((item, index) => (
        <View
          key={item.printing.id}
          style={[
            styles.cardRow,
            {
              gap: theme.spacing.md,
              padding: theme.spacing.md,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme.colors.border,
            },
            index === items.length - 1 && { borderBottomWidth: 0 },
          ]}>
          <View style={{ width: 44 }}>
            <CardImage
              imageId={item.printing.image_id}
              name={item.printing.name}
              size="120w"
              rounded={4}
              landscape={isLandscapeCard(item.printing.types)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {item.printing.name}
            </AppText>
            <AppText variant="caption" color="textMuted" numberOfLines={1}>
              {[item.printing.short_code, printingVariantLabel(item.printing)].filter(Boolean).join(' · ')}
            </AppText>
          </View>
          <QuantityStepper
            compact
            max={99}
            value={item.quantity}
            onIncrement={() => listingDraft.setQuantity(role, item.printing.id, item.quantity + 1)}
            onDecrement={() => listingDraft.setQuantity(role, item.printing.id, item.quantity - 1)}
          />
        </View>
      ))}
      <Pressable
        onPress={() => router.push({ pathname: '/catalog', params: { mode: role } })}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.cardRow,
          {
            gap: theme.spacing.sm,
            padding: theme.spacing.lg,
            backgroundColor: pressed ? theme.colors.surfaceElevated : 'transparent',
          },
        ]}>
        <Icon name="add-circle-outline" color="primary" />
        <AppText variant="bodyStrong" color="primary">
          {items.length ? t('listing.addMore') : emptyLabel}
        </AppText>
      </Pressable>
    </Surface>
  );
}

export default function CreateListingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const draft = useListingDraft();
  const create = useCreateListing();

  const valid = draft.offer.length > 0;

  const submit = () => {
    if (!valid) return;
    create.mutate(
      {
        kind: draft.kind,
        visibility: draft.visibility,
        description: draft.description,
        offer: draft.offer.map((item) => ({ printing_id: item.printing.id, quantity: item.quantity })),
        want: draft.want.map((item) => ({ printing_id: item.printing.id, quantity: item.quantity })),
      },
      {
        onSuccess: (postId) => {
          listingDraft.reset();
          router.replace({ pathname: '/listing/[id]', params: { id: postId } });
        },
      },
    );
  };

  return (
    <FormScreen
      footer={
        <View style={{ gap: theme.spacing.sm }}>
          {create.error ? (
            <AppText variant="caption" color="danger" accessibilityRole="alert">
              {getErrorMessage(t, create.error)}
            </AppText>
          ) : null}
          <Button label={t('listing.publish')} icon="checkmark" onPress={submit} loading={create.isPending} disabled={!valid} fullWidth />
        </View>
      }>
      <OptionGroup
        label={t('listing.type')}
        value={draft.kind}
        onChange={(kind) => listingDraft.update({ kind })}
        options={[
          { value: 'trade', label: t('posts.kindTrade'), icon: 'swap-horizontal' },
          { value: 'sale', label: t('posts.kindSale'), icon: 'pricetag-outline' },
        ]}
      />

      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="captionStrong" color="textSecondary">
          {draft.kind === 'sale' ? t('posts.forSale') : t('posts.offering')}
        </AppText>
        <DraftCardList role="offer" items={draft.offer} emptyLabel={t('listing.addOffered')} />
      </View>

      {draft.kind === 'trade' ? (
        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="captionStrong" color="textSecondary">
            {t('posts.lookingFor')}
          </AppText>
          <DraftCardList role="want" items={draft.want} emptyLabel={t('listing.addWanted')} />
          <AppText variant="caption" color="textMuted">
            {t('listing.wantOptional')}
          </AppText>
        </View>
      ) : null}

      <TextField
        label={t('listing.description')}
        value={draft.description}
        onChangeText={(description) => listingDraft.update({ description })}
        placeholder={draft.kind === 'sale' ? t('listing.salePlaceholder') : t('listing.tradePlaceholder')}
        multiline
        maxLength={2000}
      />

      <OptionGroup
        label={t('visibility.label')}
        value={draft.visibility}
        onChange={(visibility) => listingDraft.update({ visibility })}
        options={[
          { value: 'public', label: t('visibility.public'), icon: 'earth-outline' },
          { value: 'followers', label: t('visibility.followers'), icon: 'people-outline' },
        ]}
      />

      <AppText variant="caption" color="textMuted">
        {t('listing.safetyNote')}
      </AppText>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  cardRow: { flexDirection: 'row', alignItems: 'center' },
});
