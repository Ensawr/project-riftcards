import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  icon?: IconName;
  error?: string | null;
  hint?: string | null;
  /** Adds a show/hide toggle for password fields. */
  secureToggle?: boolean;
  /** Visually smaller field for search bars. */
  compact?: boolean;
};

export function TextField({
  label,
  icon,
  error,
  hint,
  secureToggle = false,
  compact = false,
  secureTextEntry,
  multiline,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderColor = error ? theme.colors.danger : focused ? theme.colors.primary : theme.colors.border;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      {label ? (
        <AppText variant="captionStrong" color="textSecondary">
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.box,
          {
            minHeight: compact ? 40 : theme.sizes.minTouch + 4,
            borderRadius: theme.radius.md,
            borderColor,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: theme.spacing.md,
            gap: theme.spacing.sm,
            alignItems: multiline ? 'flex-start' : 'center',
            paddingVertical: multiline ? theme.spacing.sm : 0,
          },
        ]}>
        {icon ? <Icon name={icon} size={theme.sizes.iconSm} color="textMuted" /> : null}
        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.primary}
          keyboardAppearance={theme.scheme}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          multiline={multiline}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            theme.typography.body,
            { color: theme.colors.text, minHeight: multiline ? 96 : undefined },
            multiline && { textAlignVertical: 'top' },
          ]}
          {...rest}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setHidden((value) => !value)}
            hitSlop={theme.spacing.sm}
            accessibilityRole="button"
            accessibilityLabel={hidden ? t('auth.showPassword') : t('auth.hidePassword')}>
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={theme.sizes.iconSm} color="textMuted" />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="textMuted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', borderWidth: 1 },
  input: { flex: 1, paddingVertical: 10 },
});
