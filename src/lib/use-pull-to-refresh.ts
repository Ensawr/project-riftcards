import { useCallback, useState } from 'react';

/**
 * Pull-to-refresh state that only reflects a refresh the user started.
 * Background refetches (e.g. when returning to a screen) must not show the spinner,
 * otherwise the list looks "stuck" as if it was being pulled down.
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { refreshing, onRefresh };
}
