import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../components/ui';
import { useCreateNote, useNote, useUpdateNote } from '../../features/notes/useNotes';
import { useTheme } from '../../features/theme/useTheme';
import type { MoreStackParamList } from '../../navigation/types';

const MAX_TITLE = 200;
const MAX_CONTENT = 50000;

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function NoteEditorScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const route = useRoute();
  const id = route.name === 'NoteEdit' ? (route.params as { id: string }).id : undefined;
  const isEdit = Boolean(id);
  const noteQuery = useNote(id);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!noteQuery.data) return;
    setTitle(noteQuery.data.title);
    setContent(noteQuery.data.content);
    setSourceUrl(noteQuery.data.sourceUrl ?? '');
  }, [noteQuery.data]);

  const onSubmit = async () => {
    setError(null);
    if (!title.trim()) {
      setError(t('notes.errors.titleRequired'));
      return;
    }
    if (title.trim().length > MAX_TITLE) {
      setError(t('notes.errors.titleMax'));
      return;
    }
    if (!content.trim()) {
      setError(t('notes.errors.contentRequired'));
      return;
    }
    if (content.length > MAX_CONTENT) {
      setError(t('notes.errors.contentMax'));
      return;
    }
    const url = sourceUrl.trim();
    if (url && !isHttpUrl(url)) {
      setError(t('notes.errors.url'));
      return;
    }

    const payload = {
      title: title.trim(),
      content: content.replace(/^\uFEFF/, ''),
      sourceUrl: url || null,
    };

    try {
      if (isEdit && id) {
        await updateNote.mutateAsync({ id, payload });
        navigation.navigate('NoteDetail', { id });
        return;
      }
      const result = await createNote.mutateAsync(payload);
      navigation.replace('NoteDetail', { id: result.note.id });
    } catch {
      setError(t('auth.errors.generic'));
    }
  };

  if (isEdit && noteQuery.isLoading && !noteQuery.data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (isEdit && (noteQuery.isError || !noteQuery.data)) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.danger }}>{t('notes.notFound')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {isEdit ? t('notes.editTitle') : t('notes.createSubtitle')}
        </Text>

        <Text style={[styles.label, { color: colors.muted }]}>{t('notes.fields.title')}</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder={t('notes.placeholders.title')}
          placeholderTextColor={colors.muted}
        />

        <Text style={[styles.label, { color: colors.muted }]}>{t('notes.fields.content')}</Text>
        <TextInput
          multiline
          style={[
            styles.input,
            styles.area,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={content}
          onChangeText={setContent}
          placeholder={t('notes.placeholders.content')}
          placeholderTextColor={colors.muted}
          textAlignVertical="top"
        />

        <Text style={[styles.label, { color: colors.muted }]}>{t('notes.fields.sourceUrl')}</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>{t('notes.fields.sourceHint')}</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="url"
          style={[
            styles.input,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={sourceUrl}
          onChangeText={setSourceUrl}
          placeholder={t('notes.placeholders.sourceUrl')}
          placeholderTextColor={colors.muted}
        />

        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

        <AppButton
          label={isEdit ? t('notes.saveChanges') : t('notes.save')}
          loading={createNote.isPending || updateNote.isPending}
          onPress={() => void onSubmit()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 10, padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  hint: { fontSize: 12 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  area: { minHeight: 180 },
});
