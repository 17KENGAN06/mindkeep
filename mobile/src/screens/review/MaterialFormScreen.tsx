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
import { AppButton } from '../../components/ui';
import { useCategories } from '../../features/categories/useCategories';
import {
  useCreateMaterial,
  useMaterial,
  useUpdateMaterial,
} from '../../features/materials/useMaterials';
import { useTheme } from '../../features/theme/useTheme';
import type { ReviewStackParamList } from '../../navigation/types';
import { dateInputToIso, isoToDateKey, todayDateKey } from '../../utils/date';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [learnedAt, setLearnedAt] = useState(todayDateKey());
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(!isEdit);

  useEffect(() => {
    if (!isEdit || !materialQuery.data || hydrated) return;
    const material = materialQuery.data;
    setTitle(material.title);
    setContent(material.content ?? '');
    setQuestion(material.question ?? '');
    setAnswer(material.answer ?? '');
    setSourceUrl(material.sourceUrl ?? '');
    setLearnedAt(isoToDateKey(material.learnedAt));
    setCategoryId(material.categoryId ?? '');
    setHydrated(true);
  }, [hydrated, isEdit, materialQuery.data]);

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

    const payload = {
      title: title.trim(),
      description: '',
      content: content.trim(),
      question: question.trim() ? question.trim() : null,
      answer: answer.trim() ? answer.trim() : null,
      sourceUrl: sourceUrl.trim() ? sourceUrl.trim() : null,
      learnedAt: dateInputToIso(learnedAt),
      categoryId: categoryId || null,
    };

    try {
      if (isEdit && materialId) {
        await updateMaterial.mutateAsync({ id: materialId, payload });
        navigation.goBack();
        return;
      }
      const result = await createMaterial.mutateAsync(payload);
      navigation.replace('MaterialDetail', { id: result.material.id });
    } catch {
      setError(t('auth.errors.generic'));
    }
  };

  if (isEdit && materialQuery.isLoading && !hydrated) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (isEdit && (materialQuery.isError || (!materialQuery.isLoading && !materialQuery.data))) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{t('auth.errors.generic')}</Text>
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
          {isEdit ? t('materials.editSubtitle') : t('materials.createSubtitle')}
        </Text>

        <Text style={[styles.label, { color: colors.muted }]}>{t('materials.fields.title')}</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.muted }]}>{t('materials.fields.content')}</Text>
        <TextInput
          multiline
          style={[
            styles.input,
            styles.area,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={content}
          onChangeText={setContent}
        />

        <Text style={[styles.label, { color: colors.muted }]}>{t('materials.fields.question')}</Text>
        <TextInput
          multiline
          style={[
            styles.input,
            styles.areaShort,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={question}
          onChangeText={setQuestion}
        />

        <Text style={[styles.label, { color: colors.muted }]}>{t('materials.fields.answer')}</Text>
        <TextInput
          multiline
          style={[
            styles.input,
            styles.areaShort,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={answer}
          onChangeText={setAnswer}
        />

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
  area: { minHeight: 120, textAlignVertical: 'top' },
  areaShort: { minHeight: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  error: { marginVertical: 8 },
});
