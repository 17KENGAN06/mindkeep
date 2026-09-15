import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppButton, Badge } from '../../components/ui';
import { useCategories } from '../../features/categories/useCategories';
import { useMaterials } from '../../features/materials/useMaterials';
import type { AppLanguage } from '../../i18n';
import type { ReviewStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import type { MaterialStatus } from '../../types/material';
import { formatDate } from '../../utils/date';

export function MaterialsScreen() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const navigation = useNavigation<NativeStackNavigationProp<ReviewStackParamList>>();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<MaterialStatus | ''>('ACTIVE');
  const { data: categories = [] } = useCategories();
  const materialsQuery = useMaterials({
    search: debounced || undefined,
    categoryId: categoryId || undefined,
    status: status || undefined,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const materials = materialsQuery.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.subtitle}>{t('materials.subtitle')}</Text>
      <AppButton label={t('materials.create')} onPress={() => navigation.navigate('MaterialCreate')} />

      <TextInput
        placeholder={t('materials.filters.search')}
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <FilterChip
          label={t('materials.filters.allCategories')}
          active={!categoryId}
          onPress={() => setCategoryId('')}
        />
        {categories.map((category) => (
          <FilterChip
            key={category.id}
            label={category.name}
            active={categoryId === category.id}
            onPress={() => setCategoryId(category.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.chips}>
        <FilterChip
          label={t('materials.filters.allStatuses')}
          active={status === ''}
          onPress={() => setStatus('')}
        />
        <FilterChip
          label={t('materials.status.ACTIVE')}
          active={status === 'ACTIVE'}
          onPress={() => setStatus('ACTIVE')}
        />
        <FilterChip
          label={t('materials.status.ARCHIVED')}
          active={status === 'ARCHIVED'}
          onPress={() => setStatus('ARCHIVED')}
        />
      </View>

      {materialsQuery.isLoading ? <ActivityIndicator color={colors.brand} /> : null}
      {materialsQuery.isError ? <Text style={styles.error}>{t('auth.errors.generic')}</Text> : null}
      {!materialsQuery.isLoading && !materialsQuery.isError && materials.length === 0 ? (
        <Text style={styles.empty}>{t('materials.emptyDescription')}</Text>
      ) : null}

      {materials.map((material) => (
        <Pressable
          key={material.id}
          onPress={() => navigation.navigate('MaterialDetail', { id: material.id })}
          style={styles.card}
        >
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{material.title}</Text>
            <Badge
              tone={material.status === 'ARCHIVED' ? 'neutral' : 'brand'}
              label={t(`materials.status.${material.status}`)}
            />
          </View>
          {material.question?.trim() || material.content?.trim() ? (
            <Text style={styles.preview} numberOfLines={2}>
              {material.question?.trim() || material.content}
            </Text>
          ) : null}
          <Text style={styles.meta}>
            {material.category?.name ?? t('materials.fields.noCategory')} · {t('materials.learnedAt')}:{' '}
            {formatDate(material.learnedAt, language)}
          </Text>
          <Text style={styles.meta}>
            {t('materials.nextReview')}: {material.nextReviewAt ? formatDate(material.nextReviewAt, language) : '—'}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  subtitle: { color: colors.muted, fontSize: 14 },
  input: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#07110d' },
  error: { color: colors.danger },
  empty: { color: colors.muted, fontSize: 14 },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  cardHead: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  cardTitle: { color: colors.ink, flex: 1, fontSize: 16, fontWeight: '700' },
  preview: { color: colors.muted, fontSize: 14, marginTop: 8 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 6 },
});
