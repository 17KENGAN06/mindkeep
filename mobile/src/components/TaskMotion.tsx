import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { AppIcon } from './AppIcon';
import { useTheme } from '../features/theme/useTheme';

type TaskCardShellProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Fade and slide in on mount (a task that was just added). */
  appear?: boolean;
  /** Fade out and collapse; `onLeft` runs when the card is gone. */
  leaving?: boolean;
  onLeft?: () => void;
  /** The card's own bottom padding, collapsed with it (default 10). */
  collapsePadding?: number;
};

/**
 * A task card that arrives and leaves gently: new tasks fade in and slide up a little, a deleted
 * task fades and collapses so the cards below glide up instead of jumping. Plain Animated on this
 * one view only — no global LayoutAnimation (that froze updates on the New Architecture).
 */
export function TaskCardShell({
  children,
  style,
  appear = false,
  leaving = false,
  onLeft,
  collapsePadding = 10,
}: TaskCardShellProps) {
  const enter = useRef(new Animated.Value(appear ? 0 : 1)).current;
  const exit = useRef(new Animated.Value(1)).current;
  const [height, setHeight] = useState<number | null>(null);
  const onLeftRef = useRef(onLeft);
  onLeftRef.current = onLeft;

  useEffect(() => {
    if (!appear) return;
    Animated.timing(enter, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [appear, enter]);

  useEffect(() => {
    if (!leaving) return;
    // Height can't use the native driver; the whole exit runs on JS for one short animation.
    Animated.timing(exit, {
      toValue: 0,
      duration: 260,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) onLeftRef.current?.();
    });
  }, [exit, leaving]);

  if (leaving && height !== null) {
    return (
      <Animated.View
        style={[
          style,
          styles.clip,
          {
            height: exit.interpolate({ inputRange: [0, 1], outputRange: [0, height] }),
            // Also take back the list's 12 px gap, so nothing is left to jump at the end.
            marginBottom: exit.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }),
            opacity: exit,
            paddingBottom: exit.interpolate({
              inputRange: [0, 1],
              outputRange: [0, collapsePadding],
            }),
            borderWidth: exit.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
          },
        ]}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      style={[
        style,
        {
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

type TaskCheckProps = {
  checked: boolean;
  borderColor: string;
  size?: number;
};

/** Checkbox that answers a tap: a soft spring of the box and the tick fading/scaling in. */
export function TaskCheck({ checked, borderColor, size = 36 }: TaskCheckProps) {
  const { colors } = useTheme();
  const tick = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    Animated.parallel([
      Animated.timing(tick, {
        toValue: checked ? 1 : 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(pop, { toValue: 0.86, duration: 90, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
      ]),
    ]).start();
  }, [checked, pop, tick]);

  return (
    <Animated.View
      style={[
        styles.check,
        { borderColor: checked ? colors.brand : borderColor, height: size, width: size },
        { transform: [{ scale: pop }] },
      ]}
    >
      {/* Reaches under the border (the box clips to its rounded edge), so a ticked box is one
          solid colour with no light seam between the fill and the border. */}
      <Animated.View style={[styles.fill, { backgroundColor: colors.brand, opacity: tick }]} />
      <Animated.View
        style={{
          opacity: tick,
          transform: [{ scale: tick.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }}
      >
        <AppIcon name="checkmark" color={colors.onBrand} size={Math.round(size * 0.5)} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  check: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: { borderRadius: 12, bottom: -1.5, left: -1.5, position: 'absolute', right: -1.5, top: -1.5 },
});
