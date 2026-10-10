import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fonts } from '../config/fonts';
import { useTheme } from '../features/theme/useTheme';

const ROW = 32;
const VISIBLE = 3;
const PAD = ROW * Math.floor(VISIBLE / 2);

const pad2 = (value: number) => String(value).padStart(2, '0');

type ColumnProps = {
  count: number;
  value: number;
  label: string;
  onChange: (value: number) => void;
};

/** One drum: scroll and let it snap; the row in the middle band is the value. */
function Column({ count, value, label, onChange }: ColumnProps) {
  const { colors } = useTheme();
  const ref = useRef<ScrollView>(null);
  const items = useMemo(() => Array.from({ length: count }, (_, index) => index), [count]);
  const settled = useRef(value);
  // Row in the middle band while the drum moves, so the highlight follows the finger.
  const [live, setLive] = useState(value);

  // Follow outside changes (and place the drum on first layout) without fighting the finger.
  useEffect(() => {
    if (settled.current === value) return;
    settled.current = value;
    setLive(value);
    ref.current?.scrollTo({ y: value * ROW, animated: false });
  }, [value]);

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.max(
      0,
      Math.min(count - 1, Math.round(event.nativeEvent.contentOffset.y / ROW)),
    );
    setLive(index);
    if (index === settled.current) return;
    settled.current = index;
    onChange(index);
  };

  return (
    <ScrollView
      ref={ref}
      accessibilityLabel={`${label}: ${pad2(value)}`}
      style={styles.column}
      contentContainerStyle={styles.columnContent}
      // contentOffset is iOS-only; Android gets its start position on first layout.
      contentOffset={{ x: 0, y: value * ROW }}
      onLayout={() => ref.current?.scrollTo({ y: settled.current * ROW, animated: false })}
      onScroll={(event) => {
        const index = Math.max(
          0,
          Math.min(count - 1, Math.round(event.nativeEvent.contentOffset.y / ROW)),
        );
        if (index !== live) setLive(index);
      }}
      scrollEventThrottle={32}
      showsVerticalScrollIndicator={false}
      snapToInterval={ROW}
      decelerationRate="fast"
      nestedScrollEnabled
      onMomentumScrollEnd={settle}
      onScrollEndDrag={(event) => {
        // A slow drag that ends without momentum still has to land on a value.
        if (Math.abs(event.nativeEvent.velocity?.y ?? 0) < 0.05) settle(event);
      }}
    >
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <Text
            style={[
              styles.digit,
              { color: item === live ? colors.ink : colors.muted },
              item === live && styles.digitActive,
            ]}
          >
            {pad2(item)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

type TimeWheelProps = {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  hourLabel: string;
  minuteLabel: string;
};

/** Any time of day, picked on two scroll drums (hours · minutes) like the phone's own clock. */
export function TimeWheel({ hour, minute, onChange, hourLabel, minuteLabel }: TimeWheelProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wheel, { backgroundColor: `${colors.bg}8c`, borderColor: colors.line }]}>
      <View
        pointerEvents="none"
        style={[
          styles.band,
          { backgroundColor: `${colors.brand}1a`, borderColor: `${colors.brand}55` },
        ]}
      />
      <Column
        count={24}
        value={hour}
        label={hourLabel}
        onChange={(next) => onChange(next, minute)}
      />
      <Text style={[styles.colon, { color: colors.ink }]}>:</Text>
      <Column
        count={60}
        value={minute}
        label={minuteLabel}
        onChange={(next) => onChange(hour, next)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: ROW * VISIBLE,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 8,
    width: 128,
  },
  band: {
    borderRadius: 10,
    borderWidth: 1,
    height: ROW,
    left: 6,
    position: 'absolute',
    right: 6,
    top: PAD,
  },
  column: { height: ROW * VISIBLE, width: 44 },
  columnContent: { paddingVertical: PAD },
  row: { alignItems: 'center', height: ROW, justifyContent: 'center' },
  digit: { fontFamily: fonts.medium, fontSize: 14 },
  digitActive: { fontFamily: fonts.display, fontSize: 17 },
  colon: { fontFamily: fonts.display, fontSize: 17, marginHorizontal: 2 },
});
