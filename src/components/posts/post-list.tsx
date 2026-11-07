import type { ReactElement } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { Post } from '@/features/types';
import { useTheme } from '@/theme';

import { PostCard } from './post-card';

type PostListProps = {
  posts: Post[];
  onEndReached?: () => void;
  loadingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  header?: ReactElement;
  empty?: ReactElement;
};

export function PostList({ posts, onEndReached, loadingMore, refreshing = false, onRefresh, header, empty }: PostListProps) {
  const theme = useTheme();
  return (
    <FlatList
      data={posts}
      keyExtractor={(post) => post.id}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index, 6) * 40)}>
          <PostCard post={item} />
        </Animated.View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator style={{ marginVertical: theme.spacing.xl }} color={theme.colors.primary} /> : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        flexGrow: 1,
        width: '100%',
        maxWidth: theme.sizes.maxContentWidth,
        alignSelf: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xxxl,
      }}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} /> : undefined
      }
    />
  );
}
