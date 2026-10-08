import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../components/ui';
import { useTheme } from '../theme/useTheme';
import { MEAL_KINDS, type MealKind } from './mealKinds';

type MealKindPickerProps = {
  value: MealKind | null;
  onChange: (kind: MealKind) => void;
  /** Meal types are a Pro feature (site: features/nutrition/MealKindPicker). */
  pro: boolean;
  onNeedPro?: () => void;
};

export function MealKindPicker({ value, onChange, pro, onNeedPro }: MealKindPickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[styles.label, { color: colors.ink }]}>{t('fuel.kinds.label')}</Text>
        {!pro ? <Badge tone="neutral" label="Pro" /> : null}
      </View>
      <View style={styles.chips}>
        {MEAL_KINDS.map((kind) => {
          const selected = value === kind;
          return (
            <Pressable
              key={kind}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => (pro ? onChange(kind) : onNeedPro?.())}
              style={[
                styles.chip,
                selected
                  ? { backgroundColor: colors.brand, borderColor: colors.brand }
                  : { backgroundColor: colors.panel, borderColor: colors.line },
                !pro && styles.locked,
              ]}
            >
              <Text style={[styles.chipText, { color: selected ? colors.onBrand : colors.ink }]}>
                {t(`fuel.kinds.${kind}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!pro ? <Text style={[styles.hint, { color: colors.muted }]}>{t('fuel.kinds.proHint')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  head: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, justifyContent: 'center', minHeight: 40, paddingHorizontal: 14 },
  chipText: { fontSize: 14, fontWeight: '600' },
  locked: { opacity: 0.7 },
  hint: { fontSize: 12 },
});
