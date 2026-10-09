import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AmbientGlow } from '../../components/AmbientGlow';
import { AppIcon } from '../../components/AppIcon';
import { GradientIcon } from '../../components/GradientIcon';
import { fonts } from '../../config/fonts';
import { useTheme } from '../theme/useTheme';
import { requestPermission } from './localReminders';
import { updateReminderSettings, useReminderSettings } from './useLocalReminders';

/**
 * Asked once after sign-in: explains the reminders first, and only "Turn on" triggers the
 * system permission dialog (Apple's recommended pattern; a refusal there is final on iOS).
 */
export function ReminderPrompt() {
  const settings = useReminderSettings();
  const [dismissed, setDismissed] = useState(false);
  const visible = settings !== null && !settings.asked && !dismissed;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent>
      <SafeAreaProvider>
        <PromptBody onDone={() => setDismissed(true)} />
      </SafeAreaProvider>
    </Modal>
  );
}

function PromptBody({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rise, {
      toValue: 1,
      duration: 420,
      delay: 250,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [rise]);

  const finish = async (enable: boolean) => {
    setBusy(true);
    try {
      const state = enable ? await requestPermission(t('notifications.push.channel')) : null;
      await updateReminderSettings({ asked: true, enabled: state === 'granted' });
    } finally {
      setBusy(false);
      onDone();
    }
  };

  return (
    <View style={styles.backdrop}>
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.bg, borderColor: colors.line, paddingBottom: Math.max(insets.bottom, 12) + 10 },
          {
            opacity: rise,
            transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [360, 0] }) }],
          },
        ]}
      >
        <AmbientGlow />
        <View style={styles.hero}>
          <GradientIcon name="notifications-outline" size={64} />
        </View>
        <Text style={[styles.eyebrow, { color: colors.brand }]}>Mindkeep</Text>
        <Text style={[styles.title, { color: colors.ink }]}>{t('notifications.push.promptTitle')}</Text>
        <Text style={[styles.body, { color: colors.muted }]}>{t('notifications.push.promptBody')}</Text>

        <View style={styles.points}>
          {(
            [
              { icon: 'school-outline', text: t('notifications.bellToday') },
              { icon: 'flag', text: t('notifications.bellImportant') },
              { icon: 'calendar-outline', text: '09:00' },
            ] as const
          ).map((point) => (
            <View key={point.text} style={[styles.point, { backgroundColor: `${colors.panel}e6`, borderColor: colors.line }]}>
              <AppIcon name={point.icon} color={colors.brand} size={16} />
              <Text style={[styles.pointText, { color: colors.ink }]} numberOfLines={1}>
                {point.text}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void finish(true)}
          style={({ pressed }) => [styles.primary, { backgroundColor: colors.brand }, (pressed || busy) && styles.pressed]}
        >
          <Text style={[styles.primaryText, { color: colors.onBrand }]}>{t('notifications.push.enable')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void finish(false)}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Text style={[styles.secondaryText, { color: colors.muted }]}>{t('notifications.push.later')}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(3,8,6,0.72)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  hero: { alignItems: 'center', marginBottom: 20 },
  eyebrow: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 2.6, textAlign: 'center', textTransform: 'uppercase' },
  title: { fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.4, lineHeight: 30, marginTop: 8, textAlign: 'center' },
  body: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 21, marginTop: 10, textAlign: 'center' },
  points: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 22, marginTop: 20 },
  point: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    flexShrink: 1,
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  pointText: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 12.5 },
  primary: { alignItems: 'center', borderRadius: 18, justifyContent: 'center', minHeight: 56 },
  primaryText: { fontFamily: fonts.semibold, fontSize: 16 },
  secondary: { alignItems: 'center', justifyContent: 'center', marginTop: 6, minHeight: 48 },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 15 },
  pressed: { opacity: 0.85 },
});
