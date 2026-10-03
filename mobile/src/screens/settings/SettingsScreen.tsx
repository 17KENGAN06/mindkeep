import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { AppIcon } from '../../components/AppIcon';
import { detectDeviceTimezone } from '../../config/timezones';
import { APP_MODULES, selectedModules, type AppModule } from '../../config/appModules';
import { mapAuthError } from '../../features/auth/mapAuthError';
import { useAuth } from '../../features/auth/useAuth';
import { useTheme } from '../../features/theme/useTheme';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, theme, setTheme } = useTheme();
  const { user, updateWorkspace } = useAuth();
  const [modules, setModules] = useState<AppModule[]>(() => selectedModules(user));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const timezone = user?.timezone || detectDeviceTimezone();

  const toggle = (module: AppModule) => {
    setSaved(false);
    setModules((current) =>
      current.includes(module) ? current.filter((item) => item !== module) : [...current, module],
    );
  };

  const onSave = async () => {
    if (modules.length === 0) {
      setError(t('settings.needOne'));
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateWorkspace({ enabledModules: modules });
      setSaved(true);
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.lead, { color: colors.muted }]}>{t('settings.subtitle')}</Text>
        <Text style={[styles.section, { color: colors.ink }]}>{t('settings.modulesTitle')}</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>{t('settings.modulesHint')}</Text>
        {APP_MODULES.map((module) => {
          const on = modules.includes(module);
          return (
            <Pressable
              key={module}
              onPress={() => toggle(module)}
              style={[
                styles.card,
                { borderColor: on ? colors.brand : colors.line, backgroundColor: colors.panel },
              ]}
            >
              <View
                style={[
                  styles.check,
                  { borderColor: on ? colors.brand : colors.line, backgroundColor: on ? colors.brand : 'transparent' },
                ]}
              >
                {on ? <AppIcon name="checkmark" color={colors.onBrand} size={14} /> : null}
              </View>
              <View style={styles.copy}>
                <Text style={[styles.cardTitle, { color: colors.ink }]}>
                  {t(`onboarding.modules.${module}.title`)}
                </Text>
                <Text style={[styles.cardHint, { color: colors.muted }]}>
                  {t(`onboarding.modules.${module}.text`)}
                </Text>
              </View>
            </Pressable>
          );
        })}

        <Pressable
          disabled={busy}
          onPress={() => void onSave()}
          style={[styles.save, { backgroundColor: colors.brand, opacity: busy ? 0.7 : 1 }]}
        >
          <Text style={[styles.saveText, { color: colors.onBrand }]}>{t('common.save')}</Text>
        </Pressable>
        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
        {saved ? <Text style={[styles.ok, { color: colors.brand }]}>{t('settings.saved')}</Text> : null}

        <Text style={[styles.section, { color: colors.ink }]}>{t('settings.appearanceTitle')}</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>{t('common.theme')}</Text>
        <View style={styles.row}>
          {(
            [
              { mode: 'light' as const, label: t('common.themeLight'), icon: 'sunny-outline' as const },
              { mode: 'dark' as const, label: t('common.themeDark'), icon: 'moon-outline' as const },
            ]
          ).map((option) => {
            const active = theme === option.mode;
            return (
              <Pressable
                key={option.mode}
                onPress={() => setTheme(option.mode)}
                style={[
                  styles.chip,
                  { borderColor: colors.line },
                  active && { backgroundColor: colors.brand, borderColor: colors.brand },
                ]}
              >
                <AppIcon name={option.icon} color={active ? colors.onBrand : colors.ink} size={16} />
                <Text style={[{ color: colors.ink, fontSize: 14 }, active && { color: colors.onBrand, fontWeight: '700' }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.hint, { color: colors.muted }]}>{t('common.language')}</Text>
        <LanguageSwitcher />
        <Text style={[styles.section, { color: colors.ink }]}>{t('common.timezone')}</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>{t('common.timezoneHint')}</Text>
        <Text style={[styles.zone, { color: colors.ink }]}>{t('common.timezoneCurrent', { timezone })}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  lead: { fontSize: 15, marginBottom: 20 },
  section: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  hint: { fontSize: 13, marginBottom: 12 },
  card: { borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, marginBottom: 10, padding: 14 },
  check: { alignItems: 'center', borderRadius: 6, borderWidth: 1, height: 22, justifyContent: 'center', marginTop: 2, width: 22 },
  copy: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardHint: { fontSize: 13, marginTop: 4 },
  save: { alignItems: 'center', borderRadius: 14, marginTop: 8, paddingVertical: 14 },
  saveText: { fontSize: 16, fontWeight: '700' },
  error: { marginTop: 10 },
  ok: { marginTop: 10, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  zone: { fontSize: 14, fontWeight: '600' },
});
