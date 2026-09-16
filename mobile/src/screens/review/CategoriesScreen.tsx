import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/client';
import { AppButton } from '../../components/ui';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../../features/categories/useCategories';
import { useTheme } from '../../features/theme/useTheme';
import type { Category } from '../../types/category';

export function CategoriesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const categoriesQuery = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('categories.errors.required'));
      return;
    }
    setError(null);
    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, payload: { name: trimmed } });
        setEditing(null);
      } else {
        await createCategory.mutateAsync({ name: trimmed });
      }
      setName('');
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.code === 'CATEGORY_NAME_TAKEN'
          ? t('categories.errors.nameTaken')
          : t('auth.errors.generic'),
      );
    }
  };

  const confirmDelete = (category: Category) => {
    Alert.alert(t('categories.deleteTitle'), t('categories.deleteDescription', { name: category.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void deleteCategory.mutateAsync(category.id).catch(() => {
            setError(t('auth.errors.generic'));
          });
        },
      },
    ]);
  };

  const categories = categoriesQuery.data ?? [];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t('categories.subtitle')}</Text>
        <Text style={[styles.label, { color: colors.ink }]}>
          {editing ? t('categories.editTitle') : t('categories.createTitle')}
        </Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={name}
          onChangeText={setName}
          placeholder={t('categories.name')}
          placeholderTextColor={colors.muted}
        />
        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
        <View style={styles.row}>
          {editing ? (
            <AppButton
              variant="secondary"
              label={t('common.cancel')}
              onPress={() => {
                setEditing(null);
                setName('');
                setError(null);
              }}
            />
          ) : null}
          <AppButton
            label={editing ? t('common.save') : t('categories.create')}
            loading={createCategory.isPending || updateCategory.isPending}
            onPress={() => void submit()}
          />
        </View>

        {categoriesQuery.isError ? (
          <Text style={{ color: colors.danger }}>{t('auth.errors.generic')}</Text>
        ) : null}
        {categories.length === 0 ? (
          <Text style={[styles.empty, { color: colors.muted }]}>{t('categories.emptyDescription')}</Text>
        ) : (
          categories.map((category) => (
            <View
              key={category.id}
              style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}
            >
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.ink }]}>{category.name}</Text>
                <Text style={[styles.meta, { color: colors.muted }]}>
                  {t('categories.materialsCount', { count: category._count.materials })}
                </Text>
              </View>
              <View style={styles.row}>
                <AppButton
                  variant="secondary"
                  label={t('common.edit')}
                  onPress={() => {
                    setEditing(category);
                    setName(category.name);
                    setError(null);
                  }}
                />
                <AppButton variant="danger" label={t('common.delete')} onPress={() => confirmDelete(category)} />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14 },
  label: { fontSize: 15, fontWeight: '700' },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empty: { fontSize: 14 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardText: { gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13 },
});
