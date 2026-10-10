import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '../../components/BrandMark';
import { AppButton } from '../../components/ui';
import { APP_MODULES, type AppModule } from '../../config/appModules';
import { mapAuthError } from '../../features/auth/mapAuthError';
import { useAuth } from '../../features/auth/useAuth';
import { useTheme } from '../../features/theme/useTheme';
import { fonts } from '../../config/fonts';
import { AmbientGlow } from '../../components/AmbientGlow';

export function OnboardingScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { completeOnboarding, logout } = useAuth();
  const [step, setStep] = useState(-1);
  const [picked, setPicked] = useState<AppModule[]>([]);
  const [macros, setMacros] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const total = APP_MODULES.length;
  const intro = step < 0;
  const asking = step >= 0 && step < total;
  const module = asking ? APP_MODULES[step] : null;
  const selected = useMemo(() => new Set(picked), [picked]);

  const choose = (want: boolean) => {
    if (!module) return;
    setError(null);
    if (module === 'nutrition' && !want) setMacros(false);
    setPicked((current) => {
      const next = current.filter((item) => item !== module);
      return want ? [...next, module] : next;
    });
    setStep((value) => value + 1);
  };

  const onFinish = async () => {
    if (picked.length === 0) {
      setError(t('onboarding.needOne'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await completeOnboarding(picked, picked.includes('nutrition') ? macros : undefined);
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <AmbientGlow />
      <View style={styles.top}>
        <BrandMark size={40} />
        <Pressable onPress={() => void logout()}>
          <Text style={[styles.logout, { color: colors.muted }]}>{t('common.logout')}</Text>
        </Pressable>
      </View>
      <View style={styles.dots}>
        {APP_MODULES.map((item, index) => (
          <View
            key={item}
            style={[
              styles.dot,
              { backgroundColor: !intro && index <= step ? colors.brand : colors.line },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.progress, { color: colors.muted }]}>
        {intro
          ? t('onboarding.introProgress')
          : t('onboarding.progress', { current: Math.min(step + 1, total), total })}
      </Text>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      {intro ? (
        <View>
          <Text style={[styles.eyebrow, { color: colors.brand }]}>{t('onboarding.eyebrow')}</Text>
          <Text style={[styles.title, { color: colors.ink }]}>{t('onboarding.introTitle')}</Text>
          <Text style={[styles.text, { color: colors.muted }]}>{t('onboarding.introBody')}</Text>
          <AppButton
            size="large"
            label={t('onboarding.introStart')}
            trailingIcon="arrow-forward"
            onPress={() => setStep(0)}
          />
        </View>
      ) : asking && module ? (
        <View>
          <Text style={[styles.eyebrow, { color: colors.brand }]}>{t('onboarding.eyebrow')}</Text>
          <Text style={[styles.title, { color: colors.ink }]}>
            {t(`onboarding.modules.${module}.title`)}
          </Text>
          <Text style={[styles.text, { color: colors.muted }]}>
            {t(`onboarding.modules.${module}.text`)}
          </Text>
          {module === 'nutrition' ? (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: macros }}
              onPress={() => setMacros((value) => !value)}
              style={[styles.sub, { borderColor: macros ? colors.brand : colors.line }]}
            >
              <View
                style={[
                  styles.subCheck,
                  {
                    borderColor: macros ? colors.brand : colors.line,
                    backgroundColor: macros ? colors.brand : 'transparent',
                  },
                ]}
              />
              <View style={styles.subCopy}>
                <Text style={[styles.subTitle, { color: colors.ink }]}>
                  {t('onboarding.nutritionMacros.title')}
                </Text>
                <Text style={[styles.subText, { color: colors.muted }]}>
                  {t('onboarding.nutritionMacros.text')}
                </Text>
              </View>
            </Pressable>
          ) : null}
          <View style={styles.actions}>
            <AppButton size="large" label={t('onboarding.wantThis')} onPress={() => choose(true)} />
            <AppButton
              size="large"
              variant="secondary"
              label={t('onboarding.skipThis')}
              onPress={() => choose(false)}
            />
            <AppButton
              variant="link"
              icon="chevron-back"
              label={t('common.back')}
              onPress={() => setStep((value) => value - 1)}
            />
          </View>
        </View>
      ) : (
        <View>
          <Text style={[styles.title, { color: colors.ink }]}>{t('onboarding.finishTitle')}</Text>
          <Text style={[styles.text, { color: colors.muted }]}>{t('onboarding.finishBody')}</Text>
          {picked.length === 0 ? (
            <Text style={[styles.error, { color: colors.danger }]}>{t('onboarding.needOne')}</Text>
          ) : (
            APP_MODULES.filter((item) => selected.has(item)).map((item) => (
              <Text key={item} style={[styles.pick, { color: colors.ink, backgroundColor: colors.panel }]}>
                {t(`onboarding.modules.${item}.title`)}
              </Text>
            ))
          )}
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          <View style={styles.actions}>
            <AppButton
              size="large"
              label={t('onboarding.finish')}
              loading={busy}
              disabled={picked.length === 0}
              onPress={() => void onFinish()}
            />
            <AppButton
              variant="link"
              icon="chevron-back"
              label={t('common.back')}
              onPress={() => setStep(total - 1)}
            />
          </View>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logout: { fontSize: 14, fontFamily: fonts.semibold },
  dots: { flexDirection: 'row', gap: 6, marginTop: 24 },
  dot: { flex: 1, height: 6, borderRadius: 99 },
  progress: { marginTop: 12, fontFamily: fonts.regular, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  body: { flexGrow: 1, paddingTop: 28, paddingBottom: 32 },
  eyebrow: { fontSize: 12, fontFamily: fonts.bold, letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { fontSize: 28, fontFamily: fonts.display, marginTop: 16 },
  text: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, marginTop: 12, marginBottom: 28 },
  actions: { gap: 12 },
  error: { marginBottom: 16, fontFamily: fonts.regular, fontSize: 14 },
  pick: { borderRadius: 14, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: fonts.semibold },
  sub: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    padding: 14,
  },
  subCheck: { borderRadius: 6, borderWidth: 1, height: 20, marginTop: 2, width: 20 },
  subCopy: { flex: 1 },
  subTitle: { fontSize: 15, fontFamily: fonts.bold },
  subText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginTop: 4 },
});
