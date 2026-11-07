import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BinderRow } from '@/components/collections/binder-row';
import { AppText, Button, EmptyState, FormScreen, Icon, LoadingState, OptionGroup, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { useCollections } from '@/features/collections/api';
import { useCreateCollectionPost } from '@/features/posts/api';
import type { PostVisibility } from '@/features/types';
import { getErrorMessage } from '@/lib/errors';
import { useTheme } from '@/theme';

export default function CreateCollectionPostScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { userId } = useAuth();
  const binders = useCollections(userId);
  const create = useCreateCollectionPost();
  const [binderId, setBinderId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');

  // Private binders cannot be shared; their contents are hidden from others.
  const shareable = (binders.data ?? []).filter((binder) => binder.visibility !== 'private');

  if (binders.isPending) return <LoadingState />;

  if (shareable.length === 0) {
    return (
      <FormScreen>
        <EmptyState
          icon="albums-outline"
          title={t('create.noShareableTitle')}
          message={t('create.noShareableBody')}
          action={{ label: t('collection.newBinder'), icon: 'add', onPress: () => router.replace('/binder-form') }}
        />
      </FormScreen>
    );
  }

  const submit = () => {
    if (!binderId) return;
    create.mutate(
      { collectionId: binderId, visibility, description },
      { onSuccess: () => router.replace('/profile') },
    );
  };

  return (
    <FormScreen
      footer={
        <View style={{ gap: theme.spacing.sm }}>
          {create.error ? (
            <AppText variant="caption" color="danger">
              {getErrorMessage(t, create.error)}
            </AppText>
          ) : null}
          <Button label={t('listing.publish')} icon="checkmark" onPress={submit} loading={create.isPending} disabled={!binderId} fullWidth />
        </View>
      }>
      <AppText variant="captionStrong" color="textSecondary">
        {t('create.pickBinder')}
      </AppText>
      <View style={{ gap: theme.spacing.sm }}>
        {shareable.map((binder) => (
          <View key={binder.id} style={{ position: 'relative' }}>
            <BinderRow binder={binder} onPress={() => setBinderId(binder.id)} />
            {binderId === binder.id ? (
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                  borderRadius: theme.radius.lg,
                  borderWidth: 2,
                  borderColor: theme.colors.primary,
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingRight: theme.spacing.lg,
                  },
                ]}>
                <Icon name="checkmark-circle" color="primary" />
              </View>
            ) : null}
          </View>
        ))}
      </View>
      <TextField
        label={t('listing.description')}
        value={description}
        onChangeText={setDescription}
        placeholder={t('create.collectionPlaceholder')}
        multiline
        maxLength={2000}
      />
      <OptionGroup
        label={t('visibility.label')}
        value={visibility}
        onChange={setVisibility}
        options={[
          { value: 'public', label: t('visibility.public'), icon: 'earth-outline' },
          { value: 'followers', label: t('visibility.followers'), icon: 'people-outline' },
        ]}
      />
    </FormScreen>
  );
}
