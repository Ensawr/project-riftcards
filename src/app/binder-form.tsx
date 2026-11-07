import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { VISIBILITY_ICONS } from '@/components/collections/binder-row';
import { AppText, Button, EmptyState, FormScreen, LoadingState, OptionGroup, TextField } from '@/components/ui';
import { useCollection, useDeleteCollection, useSaveCollection } from '@/features/collections/api';
import type { Collection, Visibility } from '@/features/types';
import { getErrorMessage } from '@/lib/errors';
import { useTheme } from '@/theme';

/** Create (no id) or edit (with ?id=) a binder. */
export default function BinderFormScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useCollection(id);

  useEffect(() => {
    navigation.setOptions({ title: id ? t('collection.editBinder') : t('collection.newBinder') });
  }, [navigation, id, t]);

  if (id && existing.isPending) return <LoadingState />;
  if (id && !existing.data) {
    return <EmptyState icon="lock-closed-outline" title={t('collection.notFoundTitle')} message={t('collection.notFoundBody')} />;
  }
  // Keyed so the form state is initialised once from the loaded binder.
  return <BinderForm key={existing.data?.id ?? 'new'} initial={existing.data ?? null} />;
}

function BinderForm({ initial }: { initial: Collection | null }) {
  const { t } = useTranslation();
  const save = useSaveCollection();
  const remove = useDeleteCollection();
  const theme = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? 'public');
  const id = initial?.id;

  const valid = name.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    save.mutate(
      { id, name, description, visibility },
      {
        onSuccess: (savedId) => {
          if (id) router.back();
          else router.replace({ pathname: '/binder/[id]', params: { id: savedId } });
        },
      },
    );
  };

  const confirmDelete = () =>
    Alert.alert(t('collection.deleteTitle'), t('collection.deleteBody', { name: initial?.name ?? '' }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          remove.mutate(id!, {
            // Leave both the form and the deleted binder's screen.
            onSuccess: () => router.dismissTo('/collection'),
            onError: (error) => Alert.alert(t('errors.genericTitle'), getErrorMessage(t, error)),
          }),
      },
    ]);

  return (
    <FormScreen
      footer={
        <View style={{ gap: theme.spacing.sm }}>
          <Button label={t('common.save')} onPress={submit} loading={save.isPending} disabled={!valid} fullWidth />
          {id ? (
            <Button label={t('collection.deleteTitle')} icon="trash-outline" variant="ghost" onPress={confirmDelete} loading={remove.isPending} />
          ) : null}
        </View>
      }>
      <TextField
        label={t('collection.binderName')}
        value={name}
        onChangeText={setName}
        maxLength={60}
        placeholder={t('collection.binderNamePlaceholder')}
        autoFocus={!id}
      />
      <TextField
        label={t('collection.binderDescription')}
        value={description}
        onChangeText={setDescription}
        maxLength={500}
        multiline
      />
      <OptionGroup
        label={t('visibility.label')}
        value={visibility}
        onChange={setVisibility}
        options={[
          { value: 'public', label: t('visibility.public'), icon: VISIBILITY_ICONS.public },
          { value: 'followers', label: t('visibility.followers'), icon: VISIBILITY_ICONS.followers },
          { value: 'private', label: t('visibility.private'), icon: VISIBILITY_ICONS.private },
        ]}
      />
      <AppText variant="caption" color="textMuted">
        {t(`visibility.${visibility}Hint`)}
      </AppText>
      {save.error ? (
        <AppText variant="caption" color="danger" accessibilityRole="alert">
          {getErrorMessage(t, save.error)}
        </AppText>
      ) : null}
    </FormScreen>
  );
}
