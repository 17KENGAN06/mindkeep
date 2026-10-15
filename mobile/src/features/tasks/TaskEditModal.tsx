import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SheetModal } from '../../components/SheetModal';
import { AppButton } from '../../components/ui';
import { useTheme } from '../theme/useTheme';
import type { DailyTask } from '../../types/dailyTask';
import { fonts } from '../../config/fonts';

type TaskEditModalProps = {
  /** The task being edited; null keeps the sheet closed. */
  task: DailyTask | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (values: { title: string; minutes: number }) => void;
};

/** Rename a task or change its minutes in a sheet over the list, instead of the add form far below. */
export function TaskEditModal({ task, loading = false, error, onClose, onSave }: TaskEditModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Load the task's values each time a (different) task is opened (adjusted during render).
  const [openedId, setOpenedId] = useState<string | null>(null);
  const taskId = task?.id ?? null;
  if (taskId !== openedId) {
    setOpenedId(taskId);
    if (task) {
      setTitle(task.title);
      setMinutes(String(task.minutes));
      setLocalError(null);
    }
  }

  const submit = () => {
    const mins = Number(minutes);
    if (!title.trim()) {
      setLocalError(t('tasks.errors.title'));
      return;
    }
    if (!Number.isFinite(mins) || mins < 1) {
      setLocalError(t('tasks.errors.minutes'));
      return;
    }
    setLocalError(null);
    onSave({ title: title.trim(), minutes: Math.round(mins) });
  };

  const inputStyle = [styles.input, { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink }];
  const shownError = localError ?? error;

  return (
    <SheetModal
      visible={task !== null}
      title={t('tasks.edit')}
      onClose={onClose}
      footer={
        <>
          <AppButton label={t('common.save')} loading={loading} onPress={submit} />
          <AppButton variant="secondary" label={t('common.cancel')} disabled={loading} onPress={onClose} />
        </>
      }
    >
      <Text style={[styles.label, { color: colors.ink }]}>{t('tasks.fields.title')}</Text>
      <TextInput
        autoFocus
        value={title}
        onChangeText={setTitle}
        onSubmitEditing={submit}
        returnKeyType="done"
        placeholder={t('tasks.fields.titlePlaceholder')}
        placeholderTextColor={colors.muted}
        style={inputStyle}
      />
      <Text style={[styles.label, { color: colors.ink }]}>{t('tasks.fields.minutes')}</Text>
      <TextInput
        keyboardType="number-pad"
        value={minutes}
        onChangeText={setMinutes}
        style={inputStyle}
      />
      {shownError ? <Text style={[styles.error, { color: colors.danger }]}>{shownError}</Text> : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontFamily: fonts.semibold },
  error: { fontFamily: fonts.regular, fontSize: 14 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
