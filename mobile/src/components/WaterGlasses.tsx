import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { useTheme } from '../features/theme/useTheme';
import { glow } from '../utils/glow';

type WaterGlassesProps = {
  glasses: number;
  goal: number;
  disabled?: boolean;
  onChange: (glasses: number) => void;
};

const BASE_SLOTS = 8;

function visibleSlots(glasses: number): number {
  if (glasses < BASE_SLOTS) return BASE_SLOTS;
  return Math.min(30, glasses + 1);
}

export function WaterGlasses({ glasses, goal, disabled = false, onChange }: WaterGlassesProps) {
  const { colors } = useTheme();
  const slots = visibleSlots(glasses);
  const rows = Math.ceil(slots / BASE_SLOTS);

  const renderSlot = (index: number) => {
    const filled = index < glasses;
    const next = index + 1;
    const isGoal = next === goal;
    return (
      <Pressable
        key={index}
        accessibilityLabel={`${next}`}
        accessibilityRole="button"
        accessibilityState={{ checked: filled }}
        disabled={disabled}
        onPress={() => onChange(filled ? index : next)}
        style={({ pressed }) => [
          styles.slot,
          // Filled glasses match the marked days of the steps calendar: solid brand with a glow.
          filled
            ? [
                {
                  backgroundColor: colors.brand,
                  borderColor: colors.brand,
                  ...glow(colors.brand, { y: 3, blur: 10, opacity: 0.4, spread: -2 }),
                },
              ]
            : isGoal
              ? {
                  backgroundColor: `${colors.panel}e6`,
                  borderColor: `${colors.brand}8c`,
                  borderStyle: 'dashed',
                }
              : { backgroundColor: `${colors.panel}e6`, borderColor: colors.line },
          pressed && styles.slotPressed,
          disabled && styles.slotDisabled,
        ]}
      >
        <AppIcon
          name={filled ? 'water' : 'water-outline'}
          color={filled ? colors.onBrand : colors.muted}
          size={20}
        />
      </Pressable>
    );
  };

  const padRow = (count: number, start: number) => (
    <View key={`row-${start}`} style={styles.row}>
      {Array.from({ length: count }, (_, index) => renderSlot(start + index))}
      {Array.from({ length: Math.max(0, BASE_SLOTS - count) }, (_, index) => (
        <View key={`pad-${start}-${index}`} style={styles.pad} />
      ))}
    </View>
  );

  return (
    <View style={styles.wrap}>
      {Array.from({ length: rows }, (_, row) => {
        const start = row * BASE_SLOTS;
        const count = Math.min(BASE_SLOTS, slots - start);
        return padRow(count, start);
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  slot: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    maxHeight: 48,
  },
  slotPressed: { transform: [{ scale: 0.94 }] },
  pad: { flex: 1 },
  slotDisabled: { opacity: 0.5 },
});
