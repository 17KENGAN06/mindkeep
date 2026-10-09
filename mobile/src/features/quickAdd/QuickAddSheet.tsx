import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AmbientGlow } from '../../components/AmbientGlow';
import { AppIcon, type AppIconName } from '../../components/AppIcon';
import { CardSheen } from '../../components/CardSheen';
import { GradientIcon } from '../../components/GradientIcon';
import { formatDateLong } from '../../utils/date';
import type { AppLanguage } from '../../i18n';
import { QuickAddToast, TaskComposer } from './TaskComposer';

const TILE_RADIUS = 18;
const SHEET_RADIUS = 30;
import { userHasModule } from '../../config/appModules';
import { useAuth } from '../auth/useAuth';
import { mapAuthError } from '../auth/mapAuthError';
import { hasAutomation } from '../billing/planLimit';
import { useNutritionPeriod, useSetWater } from '../nutrition/useNutrition';
import { useCreateTask } from '../tasks/useDailyTasks';
import { useTheme } from '../theme/useTheme';
import { useAccountToday } from '../time/useAccountToday';
import type { MoreStackParamList } from '../../navigation/types';
import { fonts } from '../../config/fonts';

/** Where an action sends the user inside the Sections stack. */
export type QuickAddTarget =
  | { screen: 'Fuel'; params?: MoreStackParamList['Fuel'] }
  | { screen: 'TasksHome'; params?: MoreStackParamList['TasksHome'] }
  | { screen: 'NoteCreate' | 'MaterialCreate' | 'Finance' };

type QuickAddSheetProps = {
  visible: boolean;
  onClose: () => void;
  onOpen: (target: QuickAddTarget) => void;
};

type Action = {
  key: string;
  icon: AppIconName;
  title: string;
  hint?: string;
  onPress: () => void;
};

/**
 * Center "+" of the bottom bar: the things people add most, one tap away. Only actions for
 * enabled modules are shown. A task is added right here; water is logged instantly; the rest
 * open their form.
 */
export function QuickAddSheet(props: QuickAddSheetProps) {
  return (
    <Modal
      visible={props.visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={props.onClose}
    >
      <SafeAreaProvider>
        <QuickAddBody {...props} />
      </SafeAreaProvider>
    </Modal>
  );
}

function QuickAddBody({ visible, onClose, onOpen }: QuickAddSheetProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { today, year, month } = useAccountToday();
  const showTasks = userHasModule(user, 'tasks');
  const showNutrition = userHasModule(user, 'nutrition');
  const createTask = useCreateTask();
  const setWater = useSetWater();
  const nutrition = useNutritionPeriod(year, month, visible && showNutrition);
  const [taskOpen, setTaskOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The Modal mounts the body on open: slide the sheet up from below while the backdrop fades in.
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(rise, {
      toValue: 1,
      duration: 380,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [rise]);

  // Start clean each time the sheet opens (adjusted during render).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setTaskOpen(false);
      setTitle('');
      setMinutes('30');
      setMessage(null);
      setError(null);
    }
  }

  const glasses = nutrition.data?.water?.find((row) => row.date === today)?.glasses ?? 0;
  const waterGoal = nutrition.data?.settings.waterGoal ?? 8;
  const bottom = Math.max(insets.bottom, 12);
  const top = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0);

  // A transparent Modal is not resized for the keyboard (Android): lift the sheet by its height.
  const [keyboard, setKeyboard] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => {
      LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
      setKeyboard(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
      setKeyboard(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const go = (target: QuickAddTarget) => {
    onClose();
    onOpen(target);
  };

  const onAddWater = async () => {
    setError(null);
    try {
      await setWater.mutateAsync({ date: today, glasses: glasses + 1 });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessage(t('quickAdd.waterDone', { count: glasses + 1, goal: waterGoal }));
    } catch (caught) {
      setError(mapAuthError(caught, t));
    }
  };

  const onAddTask = async () => {
    setError(null);
    const value = Number(minutes);
    if (!title.trim()) {
      setError(t('tasks.errors.title'));
      return;
    }
    if (!Number.isFinite(value) || value < 1) {
      setError(t('tasks.errors.minutes'));
      return;
    }
    try {
      await createTask.mutateAsync({ title: title.trim(), minutes: Math.round(value), date: today });
      setTitle('');
      setMinutes('30');
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTaskOpen(false);
      setMessage(t('quickAdd.taskDone'));
    } catch (caught) {
      setError(mapAuthError(caught, t));
    }
  };

  const actions: Action[] = [];
  if (showTasks) {
    actions.push({
      key: 'task',
      icon: 'checkbox-outline',
      title: t('quickAdd.task'),
      onPress: () => {
        // The form unfolds smoothly instead of popping in.
        LayoutAnimation.configureNext(LayoutAnimation.create(260, 'easeInEaseOut', 'opacity'));
        setTaskOpen((open) => !open);
      },
    });
  }
  if (showNutrition) {
    actions.push(
      hasAutomation(user)
        ? { key: 'scan', icon: 'camera-outline', title: t('quickAdd.scan'), onPress: () => go({ screen: 'Fuel', params: { openScan: Date.now() } }) }
        : { key: 'meal', icon: 'restaurant-outline', title: t('quickAdd.meal'), onPress: () => go({ screen: 'Fuel' }) },
      {
        key: 'water',
        icon: 'water-outline',
        title: t('quickAdd.water'),
        hint: `${glasses} / ${waterGoal}`,
        onPress: () => void onAddWater(),
      },
    );
  }
  if (userHasModule(user, 'notes')) {
    actions.push({ key: 'note', icon: 'document-text-outline', title: t('quickAdd.note'), onPress: () => go({ screen: 'NoteCreate' }) });
  }
  if (userHasModule(user, 'review')) {
    actions.push({ key: 'material', icon: 'school-outline', title: t('quickAdd.material'), onPress: () => go({ screen: 'MaterialCreate' }) });
  }
  if (userHasModule(user, 'finance')) {
    actions.push({ key: 'expense', icon: 'wallet-outline', title: t('quickAdd.expense'), onPress: () => go({ screen: 'Finance' }) });
  }

  return (
    // A floating card: kept off the screen edges and above the system bar / keyboard.
    <View
      style={[
        styles.backdrop,
        { paddingTop: top + 12, paddingBottom: (keyboard > 0 ? keyboard : bottom) + 12 },
      ]}
    >
      <Pressable accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.bg, borderColor: colors.line, shadowColor: colors.brand },
          {
            opacity: rise,
            transform: [
              { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [360, 0] }) },
              { scale: rise.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            ],
          },
        ]}
      >
        <AmbientGlow />
        <CardSheen glow={0.1} radius={SHEET_RADIUS} />
        <View style={styles.head}>
          {taskOpen ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              hitSlop={8}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.create(260, 'easeInEaseOut', 'opacity'));
                setTaskOpen(false);
              }}
              style={[styles.close, { backgroundColor: `${colors.panel}e6`, borderColor: colors.line }]}
            >
              <AppIcon name="chevron-back" color={colors.ink} size={20} />
            </Pressable>
          ) : null}
          <View style={styles.headCopy}>
            <Text style={[styles.eyebrow, { color: colors.brand }]}>Mindkeep</Text>
            <Text style={[styles.title, { color: colors.ink }]}>{t('quickAdd.title')}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            hitSlop={8}
            onPress={onClose}
            style={[styles.close, { backgroundColor: `${colors.panel}e6`, borderColor: colors.line }]}
          >
            <AppIcon name="close" color={colors.ink} size={20} />
          </Pressable>
        </View>

        {/* The task form takes the tiles' place, so the card never grows past the keyboard. */}
        {taskOpen ? null : (
          <View style={styles.grid}>
            {actions.map((action) => (
              <Pressable
                key={action.key}
                accessibilityRole="button"
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.tile,
                  { backgroundColor: colors.panel },
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                {({ pressed }) => (
                  <>
                    <CardSheen glow={pressed ? 0.34 : 0.16} radius={TILE_RADIUS} />
                    <View style={styles.tileTop}>
                      <GradientIcon name={action.icon} size={40} />
                      <View style={[styles.tileArrow, { borderColor: colors.line }]}>
                        <View style={styles.tileArrowIcon}>
                          <AppIcon name="arrow-forward" color={pressed ? colors.brand : colors.muted} size={13} />
                        </View>
                      </View>
                    </View>
                    <View style={styles.tileCopy}>
                      <Text style={[styles.tileTitle, { color: colors.ink }]} numberOfLines={1}>
                        {action.title}
                      </Text>
                      <Text
                        style={[styles.tileHint, { color: action.key === 'water' ? colors.brand : colors.muted }]}
                        numberOfLines={1}
                      >
                        {action.hint ?? t(`quickAdd.hints.${action.key}`)}
                      </Text>
                    </View>
                  </>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {taskOpen ? (
          <TaskComposer
            title={title}
            onTitle={setTitle}
            minutes={minutes}
            onMinutes={setMinutes}
            dateLabel={formatDateLong(today, (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage)}
            pending={createTask.isPending}
            onSubmit={() => void onAddTask()}
            // The Tasks screen's bulk tools, one tap from here.
            onTool={(tool) => go({ screen: 'TasksHome', params: { open: tool, at: Date.now() } })}
          />
        ) : null}

        {message ? <QuickAddToast text={message} tone="ok" /> : null}
        {error ? <QuickAddToast text={error} tone="error" /> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(3,8,6,0.7)', flex: 1, justifyContent: 'flex-end', paddingHorizontal: 12 },
  sheet: {
    borderRadius: SHEET_RADIUS,
    borderWidth: 1,
    elevation: 24,
    gap: 16,
    overflow: 'hidden',
    padding: 18,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
  },
  head: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 48 },
  headCopy: { flex: 1 },
  eyebrow: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase' },
  title: { fontFamily: fonts.display, fontSize: 22, letterSpacing: -0.3, marginTop: 4 },
  close: { alignItems: 'center', borderRadius: 14, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    borderRadius: TILE_RADIUS,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 112,
    overflow: 'hidden',
    padding: 14,
  },
  tileTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  tileArrow: { alignItems: 'center', borderRadius: 999, borderWidth: 1, height: 26, justifyContent: 'center', width: 26 },
  // Diagonal "open" arrow, like the site's external-link hints.
  tileArrowIcon: { transform: [{ rotate: '-45deg' }] },
  tileCopy: { gap: 3, marginTop: 14 },
  tileTitle: { fontSize: 14, fontFamily: fonts.bold },
  tileHint: { fontSize: 12, fontFamily: fonts.medium },
});
