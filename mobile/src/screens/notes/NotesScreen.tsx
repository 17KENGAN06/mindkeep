import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PullRefreshControl } from '../../components/PullRefreshControl';
import { SectionScrollView } from '../../components/SectionScrollView';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppButton, ChoiceChip } from '../../components/ui';
import { useNotes } from '../../features/notes/useNotes';
import { useRefreshOnFocus } from '../../features/sync/useRefreshOnFocus';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import type { MoreStackParamList } from '../../navigation/types';
import type { NotesQuery } from '../../types/note';
import { formatDate } from '../../utils/date';
import { fonts } from '../../config/fonts';

export function NotesScreen() {
  const { t, i18n } = useTranslation();
  useRefreshOnFocus('notes');
  const { colors } = useTheme();
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
    <SectionScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <PullRefreshControl
          busy={notesQuery.isRefetching && !notesQuery.isLoading}
          onRefresh={() => void notesQuery.refetch()}
          tintColor={colors.brand}
        />
      }
    >
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('notes.subtitle')}</Text>
      <AppButton label={t('notes.create')} onPress={() => navigation.navigate('NoteCreate')} />

      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
        ]}
        value={search}
        onChangeText={setSearch}
        placeholder={t('notes.searchPlaceholder')}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />

      <View style={styles.sortRow}>
        {(['newest', 'oldest'] as const).map((option) => {
          return (
            <ChoiceChip
              key={option}
              label={option === 'newest' ? t('notes.sortNewest') : t('notes.sortOldest')}
              selected={sort === option}
              onPress={() => setSort(option)}
            />
          );
        })}
      </View>

      {notesQuery.isLoading && !notesQuery.data ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : null}
      {notesQuery.isError ? (
        <Text style={{ color: colors.danger }}>{t('auth.errors.generic')}</Text>
      ) : null}

      {empty ? (
        <View style={[styles.empty, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>
            {noMatches ? t('notes.emptySearchTitle') : t('notes.emptyTitle')}
          </Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>
            {noMatches ? t('notes.emptySearchDescription') : t('notes.emptyDescription')}
          </Text>
        </View>
      ) : null}

      {notes.map((note) => (
        <Pressable
          key={note.id}
          onPress={() => navigation.navigate('NoteDetail', { id: note.id })}
          style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <Text style={[styles.cardTitle, { color: colors.ink }]} numberOfLines={1}>
            {note.title}
          </Text>
          <Text style={[styles.cardBody, { color: colors.muted }]} numberOfLines={3}>
            {note.content}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>{formatDate(note.updatedAt, language)}</Text>
        </Pressable>
      ))}
    </SectionScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  loader: { marginTop: 16 },
  empty: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bold },
  emptyBody: { fontFamily: fonts.regular, fontSize: 14, marginTop: 6 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  cardTitle: { fontSize: 16, fontFamily: fonts.bold },
  cardBody: { fontFamily: fonts.regular, fontSize: 14, marginTop: 6 },
  meta: { fontFamily: fonts.regular, fontSize: 12, marginTop: 10 },
});
