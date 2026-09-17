import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { useTheme } from '../features/theme/useTheme';

type WaterGlassesProps = {
  glasses: number;
  goal: number;
  disabled?: boolean;
  onChange: (glasses: number) => void;
};

export function WaterGlasses({ glasses, goal, disabled = false, onChange }: WaterGlassesProps) {
  const { colors } = useTheme();
  const slots = Math.min(30, Math.max(goal + 2, glasses + 1, 8));

  return (
    <View style={styles.wrap}>
      {Array.from({ length: slots }, (_, index) => {
        const filled = index < glasses;
        const next = index + 1;
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
              filled ? styles.slotFilled : { backgroundColor: colors.panel, borderColor: colors.line },
              disabled && styles.slotDisabled,
            ]}
          >
            <AppIcon
              name={filled ? 'water' : 'water-outline'}
              color={filled ? '#38bdf8' : colors.muted}
              size={20}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  slotFilled: { backgroundColor: 'rgba(56, 189, 248, 0.18)', borderColor: 'rgba(56, 189, 248, 0.45)' },
  slotDisabled: { opacity: 0.5 },
});
