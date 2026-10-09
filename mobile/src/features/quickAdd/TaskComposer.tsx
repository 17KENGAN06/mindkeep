import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../components/AppIcon';
import { CardSheen } from '../../components/CardSheen';
import { GradientIcon } from '../../components/GradientIcon';
import { fonts } from '../../config/fonts';
import { useTheme } from '../theme/useTheme';

const DURATIONS = [15, 30, 45, 60, 90];
const RADIUS = 20;

type TaskComposerProps = {
  title: string;
  onTitle: (value: string) => void;
  minutes: string;
  onMinutes: (value: string) => void;
  /** Today's date, already formatted for the header. */
  dateLabel: string;
  pending: boolean;
  onSubmit: () => void;
  onTool: (tool: 'import' | 'copy') => void;
};

/** Quick add's task form: a title, a duration picked with one tap, and the bulk tools. */
export function TaskComposer(props: TaskComposerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 320,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [appear]);

  const canSubmit = props.title.trim().length > 0 && !props.pending;

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.panel },
        {
          opacity: appear,
          transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      <CardSheen glow={0.16} radius={RADIUS} />

      <View style={styles.head}>
        <GradientIcon name="checkbox-outline" size={34} />
        <View style={styles.headCopy}>
          <Text style={[styles.headTitle, { color: colors.ink }]} numberOfLines={1}>
            {t('quickAdd.task')}
          </Text>
          <Text style={[styles.headDate, { color: colors.muted }]} numberOfLines={1}>
            {props.dateLabel}
          </Text>
        </View>
      </View>

      <TextInput
        autoFocus
        value={props.title}
        onChangeText={props.onTitle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={t('tasks.fields.titlePlaceholder')}
        placeholderTextColor={`${colors.muted}b3`}
        returnKeyType="done"
        onSubmitEditing={() => canSubmit && props.onSubmit()}
        style={[styles.title, { color: colors.ink, borderBottomColor: focused ? colors.brand : colors.line }]}
      />

      <View style={styles.durationRow}>
        <Text style={[styles.durationLabel, { color: colors.muted }]}>{t('tasks.fields.minutes')}</Text>
        <View style={styles.durations}>
          {DURATIONS.map((value) => {
            const active = Number(props.minutes) === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => props.onMinutes(String(value))}
                style={[
                  styles.duration,
                  active
                    ? { backgroundColor: colors.brand, borderColor: colors.brand }
                    : { backgroundColor: `${colors.bg}99`, borderColor: colors.line },
                ]}
              >
                <Text style={[styles.durationText, { color: active ? colors.onBrand : colors.ink }, active && styles.durationActive]}>
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!canSubmit}
        onPress={props.onSubmit}
        style={({ pressed }) => [
          styles.submit,
          { backgroundColor: colors.brand, shadowColor: colors.brand },
          !canSubmit && styles.submitIdle,
          pressed && styles.submitPressed,
        ]}
      >
        {props.pending ? (
          <ActivityIndicator color={colors.onBrand} />
        ) : (
          <>
            <Text style={[styles.submitText, { color: colors.onBrand }]}>{t('quickAdd.add')}</Text>
            <AppIcon name="arrow-forward" color={colors.onBrand} size={17} />
          </>
        )}
      </Pressable>

      <View style={[styles.tools, { borderTopColor: colors.line }]}>
        {(
          [
            { tool: 'import', icon: 'list-outline', label: t('tasks.import') },
            { tool: 'copy', icon: 'copy-outline', label: t('tasks.copy') },
          ] as const
        ).map((item, index) => (
          <Pressable
            key={item.tool}
            accessibilityRole="button"
            onPress={() => props.onTool(item.tool)}
            style={({ pressed }) => [
              styles.tool,
              index > 0 && { borderLeftColor: colors.line, borderLeftWidth: StyleSheet.hairlineWidth },
              pressed && { backgroundColor: `${colors.brand}12` },
            ]}
          >
            <AppIcon name={item.icon} color={colors.brand} size={16} />
            <Text style={[styles.toolText, { color: colors.ink }]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

/** "Task added" style confirmation that fades in under the tiles. */
export function QuickAddToast({ text, tone }: { text: string; tone: 'ok' | 'error' }) {
  const { colors } = useTheme();
  const appear = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    appear.setValue(0);
    Animated.spring(appear, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }).start();
  }, [appear, text]);
  const color = tone === 'ok' ? colors.brand : colors.danger;
  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: `${color}1a`, borderColor: `${color}55` },
        { opacity: appear, transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] },
      ]}
    >
      <View style={[styles.toastIcon, { backgroundColor: color }]}>
        <AppIcon name={tone === 'ok' ? 'checkmark' : 'close'} color={colors.onBrand} size={13} />
      </View>
      <Text style={[styles.toastText, { color: colors.ink }]}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS, gap: 16, overflow: 'hidden', paddingHorizontal: 16, paddingTop: 16 },
  head: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  headCopy: { flex: 1 },
  headTitle: { fontFamily: fonts.display, fontSize: 14, letterSpacing: -0.2 },
  headDate: { fontFamily: fonts.regular, fontSize: 12.5, marginTop: 2 },
  title: {
    borderBottomWidth: 1.5,
    fontFamily: fonts.semibold,
    fontSize: 19,
    paddingBottom: 10,
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  durationRow: { gap: 8 },
  durationLabel: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' },
  durations: { flexDirection: 'row', gap: 8 },
  duration: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 40 },
  durationText: { fontFamily: fonts.medium, fontSize: 14.5 },
  durationActive: { fontFamily: fonts.bold },
  submit: {
    alignItems: 'center',
    borderRadius: 14,
    elevation: 6,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  submitIdle: { elevation: 0, opacity: 0.45, shadowOpacity: 0 },
  submitPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  submitText: { fontFamily: fonts.semibold, fontSize: 16 },
  tools: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginHorizontal: -16 },
  tool: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 50 },
  toolText: { fontFamily: fonts.semibold, fontSize: 13.5 },
  toast: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toastIcon: { alignItems: 'center', borderRadius: 999, height: 22, justifyContent: 'center', width: 22 },
  toastText: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 14 },
});
