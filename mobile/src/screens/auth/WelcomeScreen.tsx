import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AmbientGlow } from '../../components/AmbientGlow';
import { AppIcon, type AppIconName } from '../../components/AppIcon';
import { AUTH_HEADER_HEIGHT, AuthHeader } from '../../components/AuthHeader';
import { BlurTargetView } from 'expo-blur';
import { fonts } from '../../config/fonts';
import { useTheme } from '../../features/theme/useTheme';

/** Space above the hero: the floating header plus breathing room. */
const CONTENT_TOP = AUTH_HEADER_HEIGHT + 28;

type WelcomeScreenProps = {
  onStart: () => void;
  onLogin: () => void;
};

/** Fades and lifts its children in, a little after the previous block (the site's SnapReveal). */
function Reveal({ delay, children }: { delay: number; children: ReactNode }) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(value, {
      toValue: 1,
      duration: 600,
      delay,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [delay, value]);
  return (
    <Animated.View
      style={{
        opacity: value,
        transform: [
          { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** First screen for signed-out users — the website's mobile hero: headline, actions, product cards. */
export function WelcomeScreen({ onStart, onLogin }: WelcomeScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [raised, setRaised] = useState(false);
  const blurTarget = useRef<View>(null);

  const cardStyle = [
    styles.card,
    { backgroundColor: `${colors.panel}cc`, borderColor: `${colors.line}cc` },
  ];
  const cardHead = (icon: AppIconName, title: string) => (
    <View style={styles.cardHead}>
      <AppIcon name={icon} color={colors.brand} size={16} />
      <Text style={[styles.cardTitle, { color: colors.brand }]}>{title}</Text>
    </View>
  );

  return (
    // Top and bottom edges handled by hand: the page scrolls under the clock and the home bar.
    <SafeAreaView edges={['left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* The floating header blurs this content as it scrolls underneath. */}
      <BlurTargetView ref={blurTarget} style={styles.root}>
        <AmbientGlow />
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + CONTENT_TOP, paddingBottom: insets.bottom + 24 },
          ]}
          onScroll={(event) => setRaised(event.nativeEvent.contentOffset.y > 4)}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={false}
        >
          <Reveal delay={40}>
            <Text style={[styles.eyebrow, { color: colors.brand }]}>{t('welcome.eyebrow')}</Text>
          </Reveal>
          <Reveal delay={140}>
            <Text style={[styles.title, { color: colors.ink }]}>{t('welcome.title')}</Text>
          </Reveal>
          <Reveal delay={240}>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{t('welcome.subtitle')}</Text>
          </Reveal>

          <Reveal delay={340}>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={onStart}
                style={({ pressed }) => [
                  styles.primary,
                  { backgroundColor: colors.brand },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.primaryText, { color: colors.onBrand }]}>
                  {t('welcome.start')}
                </Text>
                <AppIcon name="arrow-forward" color={colors.onBrand} size={18} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onLogin}
                style={({ pressed }) => [
                  styles.secondary,
                  { borderColor: colors.line, backgroundColor: `${colors.bg}99` },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.secondaryText, { color: colors.ink }]}>
                  {t('welcome.login')}
                </Text>
              </Pressable>
            </View>
          </Reveal>

          <Reveal delay={460}>
            <View style={styles.cards}>
              <View style={cardStyle}>
                {cardHead('checkbox-outline', t('welcome.heroVisual.tasksTitle'))}
                {[t('welcome.heroVisual.tasksItem1'), t('welcome.heroVisual.tasksItem2')].map(
                  (item) => (
                    <View key={item} style={styles.taskRow}>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: `${colors.brand}80`,
                            backgroundColor: `${colors.brand}26`,
                          },
                        ]}
                      />
                      <Text style={[styles.taskText, { color: colors.ink }]}>{item}</Text>
                    </View>
                  ),
                )}
              </View>

              <View style={cardStyle}>
                {cardHead('school-outline', t('welcome.heroVisual.reviewTitle'))}
                <Text style={[styles.reviewQuestion, { color: colors.ink }]}>
                  {t('welcome.heroVisual.reviewQuestion')}
                </Text>
                <View
                  style={[
                    styles.reviewHint,
                    { borderColor: `${colors.brand}66`, backgroundColor: `${colors.brand}0d` },
                  ]}
                >
                  <Text style={[styles.reviewHintText, { color: colors.muted }]}>
                    {t('welcome.heroVisual.reviewHint')}
                  </Text>
                </View>
              </View>

              <View style={cardStyle}>
                {cardHead('wallet-outline', t('welcome.heroVisual.financeTitle'))}
                <Text style={[styles.financeLabel, { color: colors.muted }]}>
                  {t('welcome.heroVisual.financeLabel')}
                </Text>
                <Text style={[styles.financeValue, { color: colors.ink }]}>
                  {t('welcome.heroVisual.financeValue')}
                </Text>
              </View>
            </View>
          </Reveal>
        </ScrollView>
      </BlurTargetView>
      <AuthHeader raised={raised} blurTarget={blurTarget} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  eyebrow: {
    fontFamily: fonts.display,
    fontSize: 12,
    letterSpacing: 3,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 38,
    letterSpacing: -0.8,
    lineHeight: 42,
    marginTop: 14,
  },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, marginTop: 18 },
  actions: { gap: 12, marginTop: 28 },
  primary: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryText: { fontFamily: fonts.semibold, fontSize: 16 },
  secondary: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
  },
  secondaryText: { fontFamily: fonts.bold, fontSize: 16 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  cards: { gap: 12, marginTop: 32 },
  card: { borderRadius: 20, borderWidth: 1, padding: 18 },
  cardHead: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  taskRow: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 12 },
  checkbox: { borderRadius: 4, borderWidth: 1, height: 17, width: 17 },
  taskText: { flex: 1, fontFamily: fonts.medium, fontSize: 14 },
  reviewQuestion: { fontFamily: fonts.semibold, fontSize: 14, marginTop: 12 },
  reviewHint: {
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  reviewHintText: { fontFamily: fonts.regular, fontSize: 12 },
  financeLabel: { fontFamily: fonts.regular, fontSize: 12, marginTop: 12 },
  financeValue: { fontFamily: fonts.display, fontSize: 26, marginTop: 4 },
});
