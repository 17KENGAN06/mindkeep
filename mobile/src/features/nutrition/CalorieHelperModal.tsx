import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SheetModal } from '../../components/SheetModal';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../components/ui';
import { mapAuthError } from '../auth/mapAuthError';
import { useTheme } from '../theme/useTheme';
import { useEstimateCalories } from './useNutrition';
import type {
  BodyActivity,
  BodySex,
  CalorieEstimate,
  NutritionSettings,
} from '../../types/nutrition';
import { fonts } from '../../config/fonts';

const ACTIVITIES: BodyActivity[] = ['sedentary', 'light', 'moderate', 'high', 'athlete'];

type Draft = {
  sex: BodySex | '';
  age: string;
  heightCm: string;
  weightKg: string;
  activity: BodyActivity | '';
  targetWeightKg: string;
};

type CalorieHelperModalProps = {
  visible: boolean;
  settings: NutritionSettings | undefined;
  currentWeightKg: number | null;
  applying: boolean;
  onClose: () => void;
  onApply: (calories: number, targetWeightKg: number) => void;
};

function emptyDraft(
  settings: NutritionSettings | undefined,
  currentWeightKg: number | null,
): Draft {
  return {
    sex: settings?.bodySex ?? '',
    age: settings?.bodyAge == null ? '' : String(settings.bodyAge),
    heightCm: settings?.bodyHeightCm == null ? '' : String(settings.bodyHeightCm),
    weightKg: currentWeightKg == null ? '' : String(currentWeightKg),
    activity: settings?.bodyActivity ?? '',
    targetWeightKg: settings?.weightGoal == null ? '' : String(settings.weightGoal),
  };
}

function parseNumber(value: string): number | null {
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function CalorieHelperModal({
  visible,
  settings,
  currentWeightKg,
  applying,
  onClose,
  onApply,
}: CalorieHelperModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const estimateCalories = useEstimateCalories();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(settings, currentWeightKg));
  const [estimate, setEstimate] = useState<CalorieEstimate | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setDraft(emptyDraft(settings, currentWeightKg));
    setEstimate(null);
    setAcknowledged(false);
    setError(null);
  }, [visible, settings, currentWeightKg]);

  // A result must never outlive the numbers it came from.
  const edit = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setEstimate(null);
    setAcknowledged(false);
    setError(null);
  };

  const onCalculate = async () => {
    const age = parseNumber(draft.age);
    const heightCm = parseNumber(draft.heightCm);
    const weightKg = parseNumber(draft.weightKg);
    const targetWeightKg = parseNumber(draft.targetWeightKg);

    if (
      !draft.sex ||
      !draft.activity ||
      age == null ||
      age < 10 ||
      age > 120 ||
      heightCm == null ||
      heightCm < 80 ||
      heightCm > 250 ||
      weightKg == null ||
      weightKg < 20 ||
      weightKg > 400 ||
      targetWeightKg == null ||
      targetWeightKg < 20 ||
      targetWeightKg > 400
    ) {
      setError(t('fuel.helper.errors.invalid'));
      return;
    }

    setError(null);
    try {
      const result = await estimateCalories.mutateAsync({
        sex: draft.sex,
        activity: draft.activity,
        age: Math.round(age),
        heightCm: Math.round(heightCm),
        weightKg,
        targetWeightKg,
      });
      setEstimate(result.estimate);
      setAcknowledged(false);
    } catch (caught) {
      setError(mapAuthError(caught, t));
    }
  };

  const field = (
    label: string,
    value: string,
    onChangeText: (next: string) => void,
    numeric: boolean,
  ) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        keyboardType={numeric ? 'number-pad' : 'decimal-pad'}
        style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink }]}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );

  const pill = (active: boolean, label: string, onPress: () => void) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.pill,
        { borderColor: active ? colors.brand : colors.line },
        active && { backgroundColor: colors.brand },
      ]}
    >
      <Text style={[styles.pillText, { color: active ? colors.onBrand : colors.ink }]}>{label}</Text>
    </Pressable>
  );

  const modeLabel = estimate
    ? t(
        estimate.mode === 'lose'
          ? 'fuel.helper.modeLose'
          : estimate.mode === 'gain'
            ? 'fuel.helper.modeGain'
            : 'fuel.helper.modeHold',
      )
    : '';

  return (
    <SheetModal
      visible={visible}
      title={t('fuel.helper.title')}
      subtitle={t('fuel.helper.lead')}
      onClose={onClose}
    >

            <Text style={[styles.label, { color: colors.muted }]}>{t('fuel.helper.sex')}</Text>
            <View style={styles.pillRow}>
              {pill(draft.sex === 'female', t('fuel.helper.sexFemale'), () =>
                edit({ sex: 'female' }),
              )}
              {pill(draft.sex === 'male', t('fuel.helper.sexMale'), () => edit({ sex: 'male' }))}
            </View>

            {field(t('fuel.helper.age'), draft.age, (next) => edit({ age: next }), true)}
            {field(t('fuel.helper.height'), draft.heightCm, (next) => edit({ heightCm: next }), true)}
            {field(t('fuel.helper.weight'), draft.weightKg, (next) => edit({ weightKg: next }), false)}
            {field(
              t('fuel.helper.target'),
              draft.targetWeightKg,
              (next) => edit({ targetWeightKg: next }),
              false,
            )}

            <Text style={[styles.label, { color: colors.muted }]}>{t('fuel.helper.activity')}</Text>
            <View style={styles.pillRow}>
              {ACTIVITIES.map((activity) =>
                pill(draft.activity === activity, t(`fuel.helper.activityLevels.${activity}`), () =>
                  edit({ activity }),
                ),
              )}
            </View>

            {estimate ? (
              <View style={[styles.result, { backgroundColor: colors.bg, borderColor: colors.line }]}>
                <Text style={[styles.resultKicker, { color: colors.muted }]}>
                  {t('fuel.helper.result')}
                </Text>
                <Text style={[styles.resultValue, { color: colors.ink }]}>
                  {estimate.calories} {t('fuel.kcal')}
                </Text>
                <Text style={[styles.lead, { color: colors.muted }]}>{modeLabel}</Text>
                <Text style={[styles.lead, { color: colors.muted }]}>
                  {t('fuel.helper.maintenance')}: {estimate.maintenance} {t('fuel.kcal')}
                </Text>
                <Text style={[styles.lead, { color: colors.muted }]}>
                  {t('fuel.helper.bmi')}: {estimate.targetBmi}
                </Text>
                {estimate.notes.map((note) => (
                  <Text key={note} style={[styles.note, { color: colors.expense }]}>
                    {t(`fuel.helper.notes.${note}`)}
                  </Text>
                ))}
                <Text style={[styles.disclaimer, { color: colors.muted }]}>
                  {t('fuel.helper.disclaimer')}
                </Text>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acknowledged }}
                  style={styles.ackRow}
                  onPress={() => setAcknowledged((value) => !value)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: acknowledged ? colors.brand : colors.line },
                      acknowledged && { backgroundColor: colors.brand },
                    ]}
                  />
                  <Text style={[styles.ackText, { color: colors.ink }]}>{t('fuel.helper.ack')}</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[styles.disclaimer, { color: colors.muted }]}>
                {t('fuel.helper.disclaimer')}
              </Text>
            )}

            {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

            <AppButton
              variant="secondary"
              label={estimate ? t('fuel.helper.recalculate') : t('fuel.helper.calculate')}
              loading={estimateCalories.isPending}
              onPress={() => void onCalculate()}
            />
            {estimate ? (
              <AppButton
                label={t('fuel.helper.apply')}
                loading={applying}
                disabled={!acknowledged}
                onPress={() => onApply(estimate.calories, estimate.targetWeightKg)}
              />
            ) : null}
            <AppButton variant="ghost" label={t('common.cancel')} onPress={onClose} />
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontSize: 13, fontFamily: fonts.semibold },
  field: { gap: 6 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  pillText: { fontSize: 13, fontFamily: fonts.bold },
  result: { borderRadius: 18, borderWidth: 1, gap: 6, padding: 14 },
  resultKicker: { fontSize: 11, fontFamily: fonts.semibold, textTransform: 'uppercase' },
  resultValue: { fontSize: 26, fontFamily: fonts.display },
  note: { fontSize: 13, fontFamily: fonts.semibold },
  disclaimer: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  ackRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, paddingTop: 4 },
  checkbox: { borderRadius: 6, borderWidth: 1, height: 20, marginTop: 1, width: 20 },
  ackText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  error: { fontFamily: fonts.regular, fontSize: 13 },
});
