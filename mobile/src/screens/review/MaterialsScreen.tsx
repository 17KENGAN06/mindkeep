import { useEffect, useState } from 'react';
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
import { AppButton, Badge } from '../../components/ui';
import { useCategories } from '../../features/categories/useCategories';
import { useMaterials } from '../../features/materials/useMaterials';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import type { ReviewStackParamList } from '../../navigation/types';
import type { MaterialStatus } from '../../types/material';
import { previewContent } from '../../utils/contentBlocks';
import { formatDate } from '../../utils/date';

export function MaterialsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
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
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={materialsQuery.isRefetching && !materialsQuery.isLoading}
          onRefresh={() => void materialsQuery.refetch()}
          tintColor={colors.brand}
        />
      }
    >
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('materials.subtitle')}</Text>
      <AppButton label={t('materials.create')} onPress={() => navigation.navigate('MaterialCreate')} />

      <TextInput
        placeholder={t('materials.filters.search')}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
        ]}
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
      {materialsQuery.isError ? (
        <Text style={{ color: colors.danger }}>{t('auth.errors.generic')}</Text>
      ) : null}
      {!materialsQuery.isLoading && !materialsQuery.isError && materials.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>{t('materials.emptyDescription')}</Text>
      ) : null}

      {materials.map((material) => (
        <Pressable
          key={material.id}
          onPress={() => navigation.navigate('MaterialDetail', { id: material.id })}
          style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{material.title}</Text>
            <Badge
              tone={material.status === 'ARCHIVED' ? 'neutral' : 'brand'}
              label={t(`materials.status.${material.status}`)}
            />
          </View>
          {previewContent(material.content) ? (
            <Text style={[styles.preview, { color: colors.muted }]} numberOfLines={2}>
              {previewContent(material.content)}
            </Text>
          ) : material.content?.trim() ? (
            <Text style={[styles.preview, { color: colors.muted }]} numberOfLines={2}>
              {t('materials.fields.codeBlock')}
            </Text>
          ) : null}
          <Text style={[styles.meta, { color: colors.muted }]}>
            {material.category?.name ?? t('materials.fields.noCategory')} · {t('materials.learnedAt')}:{' '}
            {formatDate(material.learnedAt, language)}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
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
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: colors.panel, borderColor: colors.line },
        active && { backgroundColor: colors.brand, borderColor: colors.brand },
      ]}
    >
      <Text
        style={[
          { color: colors.ink, fontSize: 13, fontWeight: '600' },
          active && { color: colors.onBrand },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  empty: { fontSize: 14 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  cardHead: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  preview: { fontSize: 14, marginTop: 8 },
  meta: { fontSize: 12, marginTop: 6 },
});
