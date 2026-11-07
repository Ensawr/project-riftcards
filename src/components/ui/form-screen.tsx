import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

type FormScreenProps = {
  children: ReactNode;
  header?: ReactNode;
  /** Pinned action area (e.g. submit button) that stays above the keyboard. */
  footer?: ReactNode;
  edges?: Edge[];
};

/** Screen container for forms: keyboard-aware scrolling and a pinned footer. */
export function FormScreen({ children, header, footer, edges = ['bottom'] }: FormScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        <ScrollView
          style={styles.root}
          contentContainerStyle={[
            styles.content,
            { padding: theme.spacing.lg, gap: theme.spacing.lg, maxWidth: theme.sizes.maxContentWidth },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          {children}
        </ScrollView>
        {footer ? (
          <View
            style={[
              styles.footer,
              {
                padding: theme.spacing.lg,
                borderTopColor: theme.colors.border,
                backgroundColor: theme.colors.background,
              },
            ]}>
            <View style={{ width: '100%', maxWidth: theme.sizes.maxContentWidth, alignSelf: 'center' }}>{footer}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: '100%', alignSelf: 'center' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth },
});
