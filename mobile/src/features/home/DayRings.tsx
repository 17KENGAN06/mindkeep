import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppIcon, type AppIconName } from '../../components/AppIcon';
import { CardSheen } from '../../components/CardSheen';
import { fonts } from '../../config/fonts';
import { useTheme } from '../theme/useTheme';

const SIZE = 60;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CARD_RADIUS = 24;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type DayRing = {
  key: string;
  label: string;
  /** Text in the middle: "3/5", "62%". */
  value: string;
  /** 0–1; above 1 is shown full and, with `over`, in the warning colour. */
  progress: number;
  /** Past the goal in a bad way (calories over the norm). */
  over?: boolean;
  onPress: () => void;
};

function Ring({ ring }: { ring: DayRing }) {
  const { colors } = useTheme();
  const fill = useRef(new Animated.Value(0)).current;
  const target = Math.max(0, Math.min(1, Number.isFinite(ring.progress) ? ring.progress : 0));

  // Rings sweep to their value on first show and whenever it changes.
  useEffect(() => {
    Animated.timing(fill, {
      toValue: target,
      duration: 700,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [fill, target]);

  const tone = ring.over ? colors.danger : colors.brand;
  const complete = target >= 1 && !ring.over;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${ring.label}: ${ring.value}`}
      onPress={ring.onPress}
      style={({ pressed }) => [styles.ring, pressed && styles.pressed]}
    >
      <View style={styles.dial}>
        <Svg width={SIZE} height={SIZE} style={styles.svg}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.line}
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={tone}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill={complete ? `${colors.brand}1f` : 'none'}
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={fill.interpolate({
              inputRange: [0, 1],
              outputRange: [CIRCUMFERENCE, 0],
            })}
          />
        </Svg>
        <Text
          style={[styles.value, { color: ring.over ? colors.danger : colors.ink }]}
          numberOfLines={1}
        >
          {ring.value}
        </Text>
      </View>
      <Text style={[styles.label, { color: colors.muted }]} numberOfLines={1}>
        {ring.label}
      </Text>
    </Pressable>
  );
}

/** Headline number of a section without a daily goal (budget, notes). */
export type PulseStat = {
  key: string;
  icon: AppIconName;
  label: string;
  value: string;
  /** Placeholder value ("no expenses yet"): shown quieter. */
  muted?: boolean;
  onPress: () => void;
};

function Stat({ stat }: { stat: PulseStat }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${stat.label}: ${stat.value}`}
      onPress={stat.onPress}
      style={({ pressed }) => [styles.stat, pressed && styles.pressed]}
    >
      <View style={[styles.statIcon, { backgroundColor: `${colors.brand}1f` }]}>
        <AppIcon name={stat.icon} color={colors.brand} size={18} />
      </View>
      <Text style={[styles.label, { color: colors.muted }]} numberOfLines={1}>
        {stat.label}
      </Text>
      <Text
        style={[
          styles.statValue,
          { color: stat.muted ? colors.muted : colors.ink },
          stat.muted && styles.statValueMuted,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {stat.value}
      </Text>
    </Pressable>
  );
}

/**
 * "Day pulse": one compact row of progress rings for the enabled sections with a daily goal;
 * a tap opens the section. Without any of those (only budget or notes switched on) the card
 * stays and shows those sections' headline numbers instead, so Home never starts empty.
 */
export function DayRings({ rings, stats = [] }: { rings: DayRing[]; stats?: PulseStat[] }) {
  const { colors } = useTheme();
  if (rings.length === 0 && stats.length === 0) return null;
  return (
    <View style={[styles.card, { backgroundColor: colors.panel }]}>
      <CardSheen glow={0.14} radius={CARD_RADIUS} />
      {rings.length > 0
        ? rings.map((ring) => <Ring key={ring.key} ring={ring} />)
        : stats.map((stat) => <Stat key={stat.key} stat={stat} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  ring: { alignItems: 'center', flex: 1, gap: 8 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  dial: { alignItems: 'center', height: SIZE, justifyContent: 'center', width: SIZE },
  svg: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  value: { fontFamily: fonts.bold, fontSize: 13 },
  label: { fontFamily: fonts.medium, fontSize: 11.5 },
  stat: { alignItems: 'center', flex: 1, gap: 6, paddingHorizontal: 6 },
  statIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  statValue: { fontFamily: fonts.display, fontSize: 18, letterSpacing: -0.3, maxWidth: '100%' },
  statValueMuted: { fontFamily: fonts.medium, fontSize: 13 },
});
