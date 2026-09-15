import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { AppButton } from '../../components/ui';
import { useCategories } from '../../features/categories/useCategories';
import { useCreateMaterial } from '../../features/materials/useMaterials';
import type { ReviewStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { dateInputToIso, todayDateKey } from '../../utils/date';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function MaterialCreateScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ReviewStackParamList>>();
  const { data: categories = [] } = useCategories();
  const createMaterial = useCreateMaterial();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [learnedAt, setLearnedAt] = useState(todayDateKey());
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);

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

    try {
      const result = await createMaterial.mutateAsync({
        title: title.trim(),
        description: '',
        content: content.trim(),
        question: question.trim() ? question.trim() : null,
        answer: answer.trim() ? answer.trim() : null,
        sourceUrl: sourceUrl.trim() ? sourceUrl.trim() : null,
        learnedAt: dateInputToIso(learnedAt),
        categoryId: categoryId || null,
      });
      navigation.replace('MaterialDetail', { id: result.material.id });
    } catch {
      setError(t('auth.errors.generic'));
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>{t('materials.createSubtitle')}</Text>

        <Text style={styles.label}>{t('materials.fields.title')}</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>{t('materials.fields.content')}</Text>
        <TextInput
          multiline
          style={[styles.input, styles.area]}
          value={content}
          onChangeText={setContent}
        />

        <Text style={styles.label}>{t('materials.fields.question')}</Text>
        <TextInput
          multiline
          style={[styles.input, styles.areaShort]}
          value={question}
          onChangeText={setQuestion}
        />

        <Text style={styles.label}>{t('materials.fields.answer')}</Text>
        <TextInput
          multiline
          style={[styles.input, styles.areaShort]}
          value={answer}
          onChangeText={setAnswer}
        />

        <Text style={styles.label}>{t('materials.fields.sourceUrl')}</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="url"
          style={styles.input}
          value={sourceUrl}
          onChangeText={setSourceUrl}
        />

        <Text style={styles.label}>{t('materials.fields.learnedAt')}</Text>
        <TextInput
          autoCapitalize="none"
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={learnedAt}
          onChangeText={setLearnedAt}
        />

        <Text style={styles.label}>{t('materials.fields.category')}</Text>
        <View style={styles.chips}>
          <Pressable
            onPress={() => setCategoryId('')}
            style={[styles.chip, !categoryId && styles.chipActive]}
          >
            <Text style={[styles.chipText, !categoryId && styles.chipTextActive]}>
              {t('materials.fields.noCategory')}
            </Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setCategoryId(category.id)}
              style={[styles.chip, categoryId === category.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, categoryId === category.id && styles.chipTextActive]}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton
          label={t('materials.create')}
          loading={createMaterial.isPending}
          onPress={() => void onSubmit()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: 8, padding: 20, paddingBottom: 40 },
  subtitle: { color: colors.muted, fontSize: 14, marginBottom: 8 },
  label: { color: colors.muted, fontSize: 13, marginTop: 8 },
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
  area: { minHeight: 120, textAlignVertical: 'top' },
  areaShort: { minHeight: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
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
  error: { color: colors.danger, marginVertical: 8 },
});
