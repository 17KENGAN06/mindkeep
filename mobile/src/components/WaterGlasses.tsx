import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { useTheme } from '../features/theme/useTheme';

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
        style={[
          styles.slot,
          filled
            ? { backgroundColor: `${colors.brand}2E`, borderColor: `${colors.brand}73` }
            : isGoal
              ? { backgroundColor: colors.panel, borderColor: `${colors.brand}66` }
              : { backgroundColor: colors.panel, borderColor: colors.line },
          disabled && styles.slotDisabled,
        ]}
      >
        <AppIcon
          name={filled ? 'water' : 'water-outline'}
          color={filled ? colors.brand : colors.muted}
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
  pad: { flex: 1 },
  slotDisabled: { opacity: 0.5 },
});
