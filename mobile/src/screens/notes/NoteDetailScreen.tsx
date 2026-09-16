import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../components/ui';
import { useDeleteNote, useNote } from '../../features/notes/useNotes';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import type { MoreStackParamList } from '../../navigation/types';
import { formatDate } from '../../utils/date';

export function NoteDetailScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const route = useRoute<RouteProp<MoreStackParamList, 'NoteDetail'>>();
  const noteQuery = useNote(route.params.id);
  const deleteNote = useDeleteNote();

  const confirmDelete = () => {
    const note = noteQuery.data;
    if (!note) return;
    Alert.alert(t('notes.deleteTitle'), t('notes.deleteDescription'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void deleteNote.mutateAsync(note.id).then(() => navigation.navigate('Notes'));
        },
      },
    ]);
  };

  if (noteQuery.isLoading && !noteQuery.data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (noteQuery.isError || !noteQuery.data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.danger }}>{t('notes.notFound')}</Text>
      </View>
    );
  }

  const note = noteQuery.data;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.ink }]}>{note.title}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>
        {t('notes.updated')}: {formatDate(note.updatedAt, language)}
      </Text>
      <Text style={[styles.body, { color: colors.ink }]}>{note.content}</Text>
      {note.sourceUrl ? (
        <Text style={[styles.link, { color: colors.brand }]} onPress={() => void Linking.openURL(note.sourceUrl!)}>
          {t('notes.source')}: {note.sourceUrl}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          variant="secondary"
          label={t('common.edit')}
          onPress={() => navigation.navigate('NoteEdit', { id: note.id })}
        />
        <AppButton
          variant="danger"
          label={t('common.delete')}
          loading={deleteNote.isPending}
          onPress={confirmDelete}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700' },
  meta: { fontSize: 13 },
  body: { fontSize: 16, lineHeight: 24 },
  link: { fontSize: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
