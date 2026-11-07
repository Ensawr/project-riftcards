import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { BinderRow } from '@/components/collections/binder-row';
import { PostCard } from '@/components/posts/post-card';
import { EmptyState, LoadingState, SegmentedControl } from '@/components/ui';
import { useCollections } from '@/features/collections/api';
import { useUserPosts } from '@/features/posts/api';
import { useProfileStats } from '@/features/profiles/api';
import type { CollectionWithCount, Post, Profile } from '@/features/types';
import { usePullToRefresh } from '@/lib/use-pull-to-refresh';
import { useTheme } from '@/theme';

import { ProfileHeader } from './profile-header';

type Tab = 'posts' | 'binders';
type Row = { type: 'post'; post: Post } | { type: 'binder'; binder: CollectionWithCount };

/** Shared body of "my profile" and other users' profiles. RLS decides which binders/posts are visible. */
export function ProfileContent({ profile, actions, isOwn }: { profile: Profile; actions?: ReactElement; isOwn: boolean }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('posts');
  const stats = useProfileStats(profile.id);
  const posts = useUserPosts(profile.id);
  const binders = useCollections(profile.id);
  const pull = usePullToRefresh(() => Promise.all([stats.refetch(), posts.refetch(), binders.refetch()]));

  const rows: Row[] =
    tab === 'posts'
      ? (posts.data ?? []).map((post) => ({ type: 'post', post }))
      : (binders.data ?? [])
          // Your own private binders are visible to you, but not listed on your public profile view.
          .filter((binder) => isOwn || binder.visibility !== 'private')
          .map((binder) => ({ type: 'binder', binder }));
  const loading = tab === 'posts' ? posts.isPending : binders.isPending;

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => (row.type === 'post' ? row.post.id : row.binder.id)}
      renderItem={({ item }) => (item.type === 'post' ? <PostCard post={item.post} /> : <BinderRow binder={item.binder} />)}
      ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
      ListHeaderComponent={
        <View style={{ paddingBottom: theme.spacing.md }}>
          <ProfileHeader profile={profile} stats={stats.data} actions={actions} />
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: 'posts', label: t('profile.posts') },
              { value: 'binders', label: t('collection.collectionsTab') },
            ]}
          />
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <LoadingState />
        ) : (
          <EmptyState
            icon={tab === 'posts' ? 'pricetags-outline' : 'albums-outline'}
            title={tab === 'posts' ? t('profile.noPosts') : t('profile.noBinders')}
          />
        )
      }
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
    />
  );
}
