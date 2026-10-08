import { useState } from 'react';
import { Modal, Platform, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppIcon, type AppIconName } from '../../components/AppIcon';
import { AppButton } from '../../components/ui';
import { userHasModule } from '../../config/appModules';
import { useAuth } from '../auth/useAuth';
import { mapAuthError } from '../auth/mapAuthError';
import { hasAutomation } from '../billing/planLimit';
import { useNutritionPeriod, useSetWater } from '../nutrition/useNutrition';
import { useCreateTask } from '../tasks/useDailyTasks';
import { useTheme } from '../theme/useTheme';
import { useAccountToday } from '../time/useAccountToday';
import type { MoreStackParamList } from '../../navigation/types';

/** Where an action sends the user inside the Sections stack. */
export type QuickAddTarget =
  | { screen: 'Fuel'; params?: MoreStackParamList['Fuel'] }
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
  const { t } = useTranslation();
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

  const go = (target: QuickAddTarget) => {
    onClose();
    onOpen(target);
  };

  const onAddWater = async () => {
    setError(null);
    try {
      await setWater.mutateAsync({ date: today, glasses: glasses + 1 });
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
      setTaskOpen(false);
      setMessage(t('quickAdd.taskDone'));
    } catch (caught) {
      setError(mapAuthError(caught, t));
    }
  };

  const actions: Action[] = [];
  if (showTasks) {
    actions.push({ key: 'task', icon: 'checkbox-outline', title: t('quickAdd.task'), onPress: () => setTaskOpen((open) => !open) });
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
    <View style={[styles.backdrop, { paddingTop: top }]}>
      <Pressable accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.bg, borderColor: colors.line, paddingBottom: bottom }]}>
        <View style={[styles.grabber, { backgroundColor: colors.line }]} />
        <View style={styles.head}>
          <Text style={[styles.title, { color: colors.ink }]}>{t('quickAdd.title')}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            hitSlop={8}
            onPress={onClose}
            style={[styles.close, { backgroundColor: colors.panel, borderColor: colors.line }]}
          >
            <AppIcon name="close" color={colors.ink} size={20} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {actions.map((action) => {
            const active = action.key === 'task' && taskOpen;
            return (
              <Pressable
                key={action.key}
                accessibilityRole="button"
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.tile,
                  { backgroundColor: colors.panel, borderColor: active ? colors.brand : colors.line },
                  pressed && { backgroundColor: `${colors.brand}14` },
                ]}
              >
                <View style={[styles.tileIcon, { backgroundColor: `${colors.brand}22` }]}>
                  <AppIcon name={action.icon} color={colors.brand} size={22} />
                </View>
                <Text style={[styles.tileTitle, { color: colors.ink }]} numberOfLines={2}>
                  {action.title}
                </Text>
                {action.hint ? <Text style={[styles.tileHint, { color: colors.muted }]}>{action.hint}</Text> : null}
              </Pressable>
            );
          })}
        </View>

        {taskOpen ? (
          <View style={[styles.taskForm, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <TextInput
              autoFocus
              value={title}
              onChangeText={setTitle}
              placeholder={t('tasks.fields.titlePlaceholder')}
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              onSubmitEditing={() => void onAddTask()}
              style={[styles.input, styles.taskTitle, { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink }]}
            />
            <TextInput
              keyboardType="number-pad"
              value={minutes}
              onChangeText={setMinutes}
              accessibilityLabel={t('tasks.fields.minutes')}
              style={[styles.input, styles.taskMinutes, { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink }]}
            />
            <View style={styles.taskSave}>
              <AppButton label={t('quickAdd.add')} loading={createTask.isPending} onPress={() => void onAddTask()} />
            </View>
          </View>
        ) : null}

        {message ? <Text style={[styles.message, { color: colors.brand }]}>{message}</Text> : null}
        {error ? <Text style={[styles.message, { color: colors.danger }]}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(7,17,13,0.55)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    gap: 14,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  grabber: { alignSelf: 'center', borderRadius: 999, height: 4, width: 40 },
  head: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 44 },
  title: { flex: 1, fontSize: 19, fontWeight: '700' },
  close: { alignItems: 'center', borderRadius: 999, borderWidth: 1, height: 38, justifyContent: 'center', width: 38 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: '30%',
    flexGrow: 1,
    gap: 8,
    minHeight: 100,
    padding: 12,
  },
  tileIcon: { alignItems: 'center', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  tileTitle: { fontSize: 14, fontWeight: '700' },
  tileHint: { fontSize: 12, fontWeight: '600' },
  taskForm: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 10 },
  input: { borderRadius: 12, borderWidth: 1, fontSize: 16, minHeight: 46, paddingHorizontal: 12 },
  taskTitle: { flexBasis: '60%', flexGrow: 1 },
  taskMinutes: { textAlign: 'center', width: 72 },
  taskSave: { flexBasis: '100%' },
  message: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
