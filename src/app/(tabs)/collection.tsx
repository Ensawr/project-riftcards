import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BinderRow } from '@/components/collections/binder-row';
import { EmptyState, ErrorState, IconButton, LoadingState, ScreenHeader, SegmentedControl } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { useCollections } from '@/features/collections/api';
import { usePullToRefresh } from '@/lib/use-pull-to-refresh';
import { useTheme } from '@/theme';

type Section = 'collections' | 'decks';

export default function CollectionScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { userId } = useAuth();
  const [section, setSection] = useState<Section>('collections');
  const binders = useCollections(userId);
  const pull = usePullToRefresh(binders.refetch);

  const createBinder = () => router.push('/binder-form');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader
        title={t('collection.title')}
        actions={
          <>
            <IconButton icon="search" accessibilityLabel={t('catalog.title')} onPress={() => router.push('/catalog')} />
            {section === 'collections' ? (
              <IconButton icon="add" accessibilityLabel={t('collection.newBinder')} onPress={createBinder} />
            ) : null}
          </>
        }
      />
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
        <SegmentedControl
          accessibilityLabel={t('collection.sections')}
          value={section}
          onChange={setSection}
          options={[
            { value: 'collections', label: t('collection.collectionsTab') },
            { value: 'decks', label: t('collection.decksTab') },
          ]}
        />
      </View>

      {section === 'decks' ? (
        <EmptyState icon="layers-outline" title={t('collection.decksEmptyTitle')} message={t('collection.decksComingSoon')} />
      ) : binders.isPending ? (
        <LoadingState />
      ) : binders.isError ? (
        <ErrorState message={t('errors.loadFailed')} onRetry={() => void binders.refetch()} />
      ) : (
        <FlatList
          data={binders.data}
          keyExtractor={(binder) => binder.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(260).delay(Math.min(index, 6) * 40)}>
              <BinderRow binder={item} />
            </Animated.View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          contentContainerStyle={{
            flexGrow: 1,
            width: '100%',
            maxWidth: theme.sizes.maxContentWidth,
            alignSelf: 'center',
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.xxxl,
          }}
          refreshControl={
            <RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={theme.colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="albums-outline"
              title={t('collection.collectionsEmptyTitle')}
              message={t('collection.collectionsEmptyBody')}
              action={{ label: t('collection.newBinder'), icon: 'add', onPress: createBinder }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
