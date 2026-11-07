import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far the element shrinks while pressed (1 = no effect). */
  scaleTo?: number;
};

/** Pressable with a subtle spring "press-in" scale; runs on the UI thread via Reanimated. */
export function PressableScale({ children, style, scaleTo = 0.96, onPressIn, onPressOut, disabled, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) scale.set(withSpring(scaleTo, SPRING));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withSpring(1, SPRING));
        onPressOut?.(event);
      }}
      {...rest}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
