import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge, ChoiceChip } from '../../components/ui';
import { useTheme } from '../theme/useTheme';
import { MEAL_KINDS, type MealKind } from './mealKinds';
import { fonts } from '../../config/fonts';

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
          return (
            // Locked for Free: still tappable, it explains Pro instead of choosing.
            <View key={kind} style={!pro ? styles.locked : undefined}>
              <ChoiceChip
                label={t(`fuel.kinds.${kind}`)}
                selected={value === kind}
                onPress={() => (pro ? onChange(kind) : onNeedPro?.())}
              />
            </View>
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
  label: { fontSize: 14, fontFamily: fonts.semibold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locked: { opacity: 0.7 },
  hint: { fontFamily: fonts.regular, fontSize: 12 },
});
