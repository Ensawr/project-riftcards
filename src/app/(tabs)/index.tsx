import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MessagesButton } from '@/components/navigation/messages-button';
import { PostList } from '@/components/posts/post-list';
import { EmptyState, ErrorState, LoadingState, ScreenHeader } from '@/components/ui';
import { useHomeFeed } from '@/features/posts/api';
import { usePullToRefresh } from '@/lib/use-pull-to-refresh';
import { useTheme } from '@/theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const feed = useHomeFeed();
  const pull = usePullToRefresh(feed.refetch);
  const posts = feed.data?.pages.flat() ?? [];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader brand title={t('home.title')} actions={<MessagesButton />} />
      {feed.isPending ? (
        <LoadingState />
      ) : feed.isError ? (
        <ErrorState message={t('errors.loadFailed')} onRetry={() => void feed.refetch()} />
      ) : (
        <PostList
          posts={posts}
          onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && void feed.fetchNextPage()}
          loadingMore={feed.isFetchingNextPage}
          refreshing={pull.refreshing}
          onRefresh={pull.onRefresh}
          empty={
            <EmptyState
              icon="sparkles-outline"
              title={t('home.emptyTitle')}
              message={t('home.emptyBody')}
              action={{ label: t('home.emptyAction'), icon: 'compass-outline', onPress: () => router.navigate('/explore') }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
