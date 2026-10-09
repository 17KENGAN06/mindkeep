import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../components/AppIcon';
import { CardSheen } from '../../components/CardSheen';
import { GradientIcon } from '../../components/GradientIcon';
import { fonts } from '../../config/fonts';
import { useTheme } from '../theme/useTheme';

const HIDDEN_KEY = 'mk_home_starter_hidden';
const CARD_RADIUS = 24;

export type StarterStep = { key: string; label: string; done: boolean; onPress: () => void };

/**
 * First days: a short "get started" checklist instead of empty blocks. Disappears once every
 * step is done, or when the user hides it.
 */
export function StarterCard({ steps }: { steps: StarterStep[] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [hidden, setHidden] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(HIDDEN_KEY)
      .then((stored) => setHidden(stored === 'true'))
      .catch(() => setHidden(false));
  }, []);

  const doneCount = steps.filter((step) => step.done).length;
  if (hidden !== false || steps.length === 0 || doneCount === steps.length) return null;

  const hide = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(240, 'easeInEaseOut', 'opacity'));
    setHidden(true);
    void AsyncStorage.setItem(HIDDEN_KEY, 'true').catch(() => undefined);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.panel }]}>
      <CardSheen glow={0.22} radius={CARD_RADIUS} />
      <View style={styles.head}>
        <GradientIcon name="flag" size={38} />
        <View style={styles.headCopy}>
          <Text style={[styles.title, { color: colors.ink }]}>{t('todayHub.start.title')}</Text>
          <Text style={[styles.hint, { color: colors.muted }]}>{t('todayHub.start.hint')}</Text>
        </View>
        <Text style={[styles.progress, { color: colors.brand }]}>
          {doneCount}/{steps.length}
        </Text>
      </View>

      {steps.map((step) => (
        <Pressable
          key={step.key}
          accessibilityRole="button"
          accessibilityState={{ checked: step.done }}
          disabled={step.done}
          onPress={step.onPress}
          style={({ pressed }) => [
            styles.step,
            pressed && { backgroundColor: `${colors.brand}0f` },
          ]}
        >
          <View
            style={[
              styles.mark,
              step.done
                ? { backgroundColor: colors.brand, borderColor: colors.brand }
                : { borderColor: colors.line },
            ]}
          >
            {step.done ? <AppIcon name="checkmark" color={colors.onBrand} size={13} /> : null}
          </View>
          <Text
            style={[
              styles.stepText,
              { color: step.done ? colors.muted : colors.ink },
              step.done && styles.stepDone,
            ]}
          >
            {step.label}
          </Text>
          {step.done ? null : <AppIcon name="chevron-forward" color={colors.muted} size={15} />}
        </Pressable>
      ))}

      <Pressable accessibilityRole="button" onPress={hide} hitSlop={6} style={styles.hide}>
        <Text style={[styles.hideText, { color: colors.muted }]}>{t('todayHub.start.hide')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: CARD_RADIUS, gap: 4, marginBottom: 14, overflow: 'hidden', padding: 16 },
  head: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 8 },
  headCopy: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.display, fontSize: 15, letterSpacing: -0.2 },
  hint: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17 },
  progress: { fontFamily: fonts.bold, fontSize: 13 },
  step: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    minHeight: 46,
    paddingHorizontal: 4,
  },
  mark: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  stepText: { flex: 1, fontFamily: fonts.medium, fontSize: 14.5 },
  stepDone: { textDecorationLine: 'line-through' },
  hide: { alignSelf: 'flex-end', marginTop: 4, paddingHorizontal: 4 },
  hideText: { fontFamily: fonts.medium, fontSize: 12.5 },
});
