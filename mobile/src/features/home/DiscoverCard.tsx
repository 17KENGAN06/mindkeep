import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon, type AppIconName } from '../../components/AppIcon';
import { CardSheen } from '../../components/CardSheen';
import { fonts } from '../../config/fonts';
import type { AppModule } from '../../config/appModules';
import { useTheme } from '../theme/useTheme';

const HIDDEN_KEY = 'mk_home_discover_hidden';
const CARD_RADIUS = 24;

export const MODULE_ICONS: Record<AppModule, AppIconName> = {
  tasks: 'checkbox-outline',
  review: 'school-outline',
  notes: 'document-text-outline',
  habits: 'repeat-outline',
  finance: 'wallet-outline',
  nutrition: 'restaurant-outline',
};

type DiscoverCardProps = {
  /** Switched-off sections worth suggesting, best first (at most two are shown). */
  modules: AppModule[];
  onEnable: (module: AppModule) => Promise<void>;
  onOpenSettings: () => void;
};

/**
 * Only for a sparse Home (one or two sections on): a quiet offer to put one more section here.
 * One tap switches it on; "Hide" removes the card for good on this phone.
 */
export function DiscoverCard({ modules, onEnable, onOpenSettings }: DiscoverCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [hidden, setHidden] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<AppModule | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(HIDDEN_KEY)
      .then((stored) => setHidden(stored === 'true'))
      .catch(() => setHidden(false));
  }, []);

  // Wait for the stored flag so a hidden card never flashes in.
  if (hidden !== false || modules.length === 0) return null;

  const hide = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(240, 'easeInEaseOut', 'opacity'));
    setHidden(true);
    void AsyncStorage.setItem(HIDDEN_KEY, 'true').catch(() => undefined);
  };

  const enable = async (module: AppModule) => {
    setBusy(module);
    setFailed(false);
    try {
      LayoutAnimation.configureNext(LayoutAnimation.create(260, 'easeInEaseOut', 'opacity'));
      await onEnable(module);
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.panel }]}>
      <CardSheen glow={0.12} radius={CARD_RADIUS} />
      <Text style={[styles.eyebrow, { color: colors.brand }]}>{t('todayHub.discover.title')}</Text>
      <Text style={[styles.hint, { color: colors.muted }]}>{t('todayHub.discover.hint')}</Text>

      <View style={styles.rows}>
        {modules.slice(0, 2).map((module) => (
          <View
            key={module}
            style={[styles.row, { backgroundColor: `${colors.bg}8c`, borderColor: colors.line }]}
          >
            <View style={[styles.icon, { backgroundColor: `${colors.brand}1f` }]}>
              <AppIcon name={MODULE_ICONS[module]} color={colors.brand} size={18} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
                {t(`onboarding.modules.${module}.title`)}
              </Text>
              <Text style={[styles.text, { color: colors.muted }]} numberOfLines={2}>
                {t(`todayHub.discover.why.${module}`)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('todayHub.discover.enable')}: ${t(`onboarding.modules.${module}.title`)}`}
              disabled={busy !== null}
              onPress={() => void enable(module)}
              style={({ pressed }) => [
                styles.add,
                { backgroundColor: `${colors.brand}24`, borderColor: `${colors.brand}8c` },
                pressed && styles.pressed,
              ]}
            >
              {busy === module ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : (
                <AppIcon name="add" color={colors.brand} size={18} />
              )}
            </Pressable>
          </View>
        ))}
      </View>

      {failed ? (
        <Text style={[styles.error, { color: colors.danger }]}>
          {t('todayHub.discover.failed')}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={onOpenSettings} hitSlop={6}>
          <Text style={[styles.link, { color: colors.brand }]}>{t('todayHub.discover.all')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={hide} hitSlop={6}>
          <Text style={[styles.link, { color: colors.muted }]}>{t('todayHub.start.hide')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: CARD_RADIUS, marginBottom: 14, overflow: 'hidden', padding: 16 },
  eyebrow: {
    fontFamily: fonts.display,
    fontSize: 11,
    letterSpacing: 2.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  hint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  rows: { gap: 8 },
  row: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 10,
  },
  icon: { alignItems: 'center', borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  copy: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 14.5 },
  text: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17 },
  add: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pressed: { transform: [{ scale: 0.94 }] },
  error: { fontFamily: fonts.medium, fontSize: 12.5, marginTop: 10 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 2,
  },
  link: { fontFamily: fonts.semibold, fontSize: 13 },
});
