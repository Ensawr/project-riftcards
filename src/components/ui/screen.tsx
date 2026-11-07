import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  /** Optional fixed header rendered above the scrollable content. */
  header?: ReactNode;
  /** Safe-area edges to pad. Tab screens use `top` (the tab bar handles the bottom). */
  edges?: Edge[];
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Base container for every screen: theme background, safe area and a readable max width. */
export function Screen({ children, header, edges = ['top'], scroll = true, contentStyle }: ScreenProps) {
  const theme = useTheme();
  const padding = { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl };
  const width = { maxWidth: theme.sizes.maxContentWidth };

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {header ? <View style={[styles.centered, width]}>{header}</View> : null}
      {scroll ? (
        <ScrollView
          style={styles.root}
          contentContainerStyle={[styles.grow, styles.centered, width, padding, contentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.root, styles.centered, width, padding, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  grow: { flexGrow: 1 },
  centered: { width: '100%', alignSelf: 'center' },
});
