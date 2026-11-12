import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  Platform,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

/** Stay still until the device preference has been read. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        changed = true;
        if (active) setReduced(value);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => { if (active && !changed) setReduced(value); },
      () => { /* A missing preference keeps motion reduced. */ },
    );
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MotionPressable({
  children, disabled, onPressIn, onPressOut, style, ...props
}: Omit<PressableProps, "style" | "children"> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (disabled || reduced) {
      animation.current?.stop();
      scale.setValue(1);
    }
    return () => { animation.current?.stop(); };
  }, [disabled, reduced, scale]);
  const settle = (value: number) => {
    animation.current?.stop();
    if (disabled || reduced) { scale.setValue(1); return; }
    animation.current = Animated.timing(scale, {
      toValue: value, duration: value < 1 ? 90 : 160,
      easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web",
    });
    animation.current.start();
  };
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => { settle(0.98); onPressIn?.(event); }}
      onPressOut={(event) => { settle(1); onPressOut?.(event); }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** A brief reveal when an action changes the content, without remounting it. */
export function AnimatedChange({ children, changeKey }: {
  children: React.ReactNode;
  changeKey: string | number;
}) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(1));
  useEffect(() => {
    progress.stopAnimation();
    if (reduced) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1, duration: 180, easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [changeKey, reduced, progress]);
  return <Animated.View style={{
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }],
  }}>{children}</Animated.View>;
}

/** One gentle confirmation for a panda or success illustration. */
export function SuccessMotion({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    scale.stopAnimation();
    if (reduced) { scale.setValue(1); return; }
    scale.setValue(0.94);
    const animation = Animated.spring(scale, {
      toValue: 1, speed: 16, bounciness: 3, useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [reduced, scale]);
  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}
