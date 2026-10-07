import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MaterialContentEditor } from '../../components/MaterialContentEditor';
import { InlineQueryError, QueryErrorView } from '../../components/QueryState';
import { AppButton } from '../../components/ui';
import { mapAuthError } from '../../features/auth/mapAuthError';
import { useCategories } from '../../features/categories/useCategories';
import { useUnsavedChangesGuard } from '../../features/forms/useUnsavedChangesGuard';
import {
  useCreateMaterial,
  useMaterial,
  useUpdateMaterial,
} from '../../features/materials/useMaterials';
import { useTheme } from '../../features/theme/useTheme';
import type { ReviewStackParamList } from '../../navigation/types';
import { dateInputToIso, isoToDateKey, todayDateKey } from '../../utils/date';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type MaterialDraft = {
  title: string;
  content: string;
  sourceUrl: string;
  learnedAt: string;
  categoryId: string;
};

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function MaterialFormScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ReviewStackParamList>>();
  const route = useRoute<RouteProp<ReviewStackParamList, 'MaterialCreate' | 'MaterialEdit'>>();
  const isEdit = route.name === 'MaterialEdit';
  const materialId = route.name === 'MaterialEdit' ? route.params?.id : undefined;
  const materialQuery = useMaterial(materialId);
  const { data: categories = [] } = useCategories();
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [learnedAt, setLearnedAt] = useState(todayDateKey());
  const [initialLearnedAt, setInitialLearnedAt] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(!isEdit);
  // What the form started from: the loaded material (edit) or the defaults (create). Null until loaded.
  const [initial, setInitial] = useState<MaterialDraft | null>(() =>
    isEdit ? null : { title: '', content: '', sourceUrl: '', learnedAt, categoryId: '' },
  );

  useEffect(() => {
    if (!isEdit || !materialQuery.data || hydrated) return;
    const material = materialQuery.data;
    setTitle(material.title);
    setContent(material.content ?? '');
    setSourceUrl(material.sourceUrl ?? '');
    setLearnedAt(isoToDateKey(material.learnedAt));
    setInitialLearnedAt(isoToDateKey(material.learnedAt));
    setCategoryId(material.categoryId ?? '');
    setInitial({
      title: material.title,
      content: material.content ?? '',
      sourceUrl: material.sourceUrl ?? '',
      learnedAt: isoToDateKey(material.learnedAt),
      categoryId: material.categoryId ?? '',
    });
    setHydrated(true);
  }, [hydrated, isEdit, materialQuery.data]);

  const dirty =
    initial !== null &&
    (title.trim() !== initial.title.trim() ||
      content.trim() !== initial.content.trim() ||
      sourceUrl.trim() !== initial.sourceUrl.trim() ||
      learnedAt !== initial.learnedAt ||
      categoryId !== initial.categoryId);
  const guard = useUnsavedChangesGuard(dirty);

  const onSubmit = async () => {
    setError(null);
    if (!title.trim()) {
      setError(t('materials.errors.titleRequired'));
      return;
    }
    if (!DATE_PATTERN.test(learnedAt)) {
      setError(t('materials.errors.learnedAtRequired'));
      return;
    }
    if (sourceUrl.trim() && !isValidUrl(sourceUrl.trim())) {
      setError(t('materials.errors.url'));
      return;
    }

    const base = {
      title: title.trim(),
      content: content.trim(),
      sourceUrl: sourceUrl.trim() ? sourceUrl.trim() : null,
      categoryId: categoryId || null,
    };

    try {
      if (isEdit && materialId) {
        // Edits send only what this form owns; the date only when the user changed it, so an
        // unchanged date never reschedules reviews or fails on a different-timezone timestamp.
        const payload = {
          ...base,
          ...(learnedAt !== initialLearnedAt ? { learnedAt: dateInputToIso(learnedAt) } : {}),
        };
        await updateMaterial.mutateAsync({ id: materialId, payload });
        guard.allowLeave();
        navigation.goBack();
        return;
      }
      const result = await createMaterial.mutateAsync({
        ...base,
        description: '',
        question: null,
        answer: null,
        learnedAt: dateInputToIso(learnedAt),
      });
      guard.allowLeave();
      navigation.replace('MaterialDetail', { id: result.material.id });
    } catch (caught) {
      setError(mapAuthError(caught, t));
    }
  };

  if (isEdit && materialQuery.isLoading && !hydrated) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  // Only when the material never loaded; a failed refresh keeps the form (and what was typed) on screen.
  if (isEdit && !materialQuery.isLoading && !materialQuery.data) {
    return (
      <QueryErrorView
        error={materialQuery.error}
        onRetry={() => void materialQuery.refetch()}
        retrying={materialQuery.isFetching}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {isEdit ? t('materials.editSubtitle') : t('materials.createSubtitle')}
        </Text>
        {isEdit && materialQuery.isError ? <InlineQueryError error={materialQuery.error} /> : null}

        <Text style={[styles.label, { color: colors.muted }]}>{t('materials.fields.title')}</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={title}
          onChangeText={setTitle}
        />

        <MaterialContentEditor value={content} onChange={setContent} />

        <Text style={[styles.label, { color: colors.muted }]}>{t('materials.fields.sourceUrl')}</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="url"
          style={[
            styles.input,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={sourceUrl}
          onChangeText={setSourceUrl}
        />

        <Text style={[styles.label, { color: colors.muted }]}>{t('materials.fields.learnedAt')}</Text>
        <TextInput
          autoCapitalize="none"
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={learnedAt}
          onChangeText={setLearnedAt}
        />

        <Text style={[styles.label, { color: colors.muted }]}>{t('materials.fields.category')}</Text>
        <View style={styles.chips}>
          <Pressable
            onPress={() => setCategoryId('')}
            style={[
              styles.chip,
              { backgroundColor: colors.panel, borderColor: colors.line },
              !categoryId && { backgroundColor: colors.brand, borderColor: colors.brand },
            ]}
          >
            <Text
              style={[
                { color: colors.ink, fontSize: 13, fontWeight: '600' },
                !categoryId && { color: colors.onBrand },
              ]}
            >
              {t('materials.fields.noCategory')}
            </Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setCategoryId(category.id)}
              style={[
                styles.chip,
                { backgroundColor: colors.panel, borderColor: colors.line },
                categoryId === category.id && { backgroundColor: colors.brand, borderColor: colors.brand },
              ]}
            >
              <Text
                style={[
                  { color: colors.ink, fontSize: 13, fontWeight: '600' },
                  categoryId === category.id && { color: colors.onBrand },
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
        <AppButton
          label={isEdit ? t('common.save') : t('materials.create')}
          loading={createMaterial.isPending || updateMaterial.isPending}
          onPress={() => void onSubmit()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 8, padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14, marginBottom: 8 },
  label: { fontSize: 13, marginTop: 8 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  error: { marginVertical: 8 },
});
