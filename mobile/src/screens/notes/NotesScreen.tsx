import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../components/ui';
import { useNotes } from '../../features/notes/useNotes';
import type { AppLanguage } from '../../i18n';
import type { MoreStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import type { NotesQuery } from '../../types/note';
import { formatDate } from '../../utils/date';

export function NotesScreen() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sort, setSort] = useState<NonNullable<NotesQuery['sort']>>('newest');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useMemo(
    () => ({
      search: debounced || undefined,
      sort,
    }),
    [debounced, sort],
  );

  const notesQuery = useNotes(query);
  const notes = notesQuery.data ?? [];
  const empty = !notesQuery.isLoading && !notesQuery.isError && notes.length === 0;
  const noMatches = empty && Boolean(query.search);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={notesQuery.isRefetching && !notesQuery.isLoading}
          onRefresh={() => void notesQuery.refetch()}
          tintColor={colors.brand}
        />
      }
    >
      <Text style={styles.subtitle}>{t('notes.subtitle')}</Text>
      <AppButton label={t('notes.create')} onPress={() => navigation.navigate('NoteCreate')} />

      <TextInput
        style={styles.input}
        value={search}
        onChangeText={setSearch}
        placeholder={t('notes.searchPlaceholder')}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />

      <View style={styles.sortRow}>
        {(['newest', 'oldest'] as const).map((option) => {
          const active = sort === option;
          return (
            <Pressable
              key={option}
              onPress={() => setSort(option)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option === 'newest' ? t('notes.sortNewest') : t('notes.sortOldest')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {notesQuery.isLoading && !notesQuery.data ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : null}
      {notesQuery.isError ? <Text style={styles.error}>{t('auth.errors.generic')}</Text> : null}

      {empty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {noMatches ? t('notes.emptySearchTitle') : t('notes.emptyTitle')}
          </Text>
          <Text style={styles.emptyBody}>
            {noMatches ? t('notes.emptySearchDescription') : t('notes.emptyDescription')}
          </Text>
        </View>
      ) : null}

      {notes.map((note) => (
        <Pressable
          key={note.id}
          onPress={() => navigation.navigate('NoteDetail', { id: note.id })}
          style={styles.card}
        >
          <Text style={styles.cardTitle} numberOfLines={1}>
            {note.title}
          </Text>
          <Text style={styles.cardBody} numberOfLines={3}>
            {note.content}
          </Text>
          <Text style={styles.meta}>{formatDate(note.updatedAt, language)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  subtitle: { color: colors.muted, fontSize: 14 },
  input: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.ink, fontSize: 14 },
  chipTextActive: { color: '#07110d', fontWeight: '700' },
  loader: { marginTop: 16 },
  error: { color: colors.danger },
  empty: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  emptyBody: { color: colors.muted, fontSize: 14, marginTop: 6 },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  cardBody: { color: colors.muted, fontSize: 14, marginTop: 6 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 10 },
});
