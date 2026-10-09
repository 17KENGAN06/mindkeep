import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/client';
import { AppButton } from '../../components/ui';
import { mapAuthError } from '../../features/auth/mapAuthError';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../../features/categories/useCategories';
import { usePullToRefresh } from '../../features/sync/usePullToRefresh';
import { useRefreshOnFocus } from '../../features/sync/useRefreshOnFocus';
import { useTheme } from '../../features/theme/useTheme';
import type { Category } from '../../types/category';
import { fonts } from '../../config/fonts';

export function CategoriesScreen() {
  const { t } = useTranslation();
  useRefreshOnFocus('categories');
  const { colors } = useTheme();
  const categoriesQuery = useCategories();
  const pull = usePullToRefresh(categoriesQuery);
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
          : mapAuthError(caught, t),
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
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.brand} />}
      >
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
          // "No categories" only after a successful load, not when the request failed.
          categoriesQuery.isError ? null : (
            <Text style={[styles.empty, { color: colors.muted }]}>{t('categories.emptyDescription')}</Text>
          )
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
  subtitle: { fontFamily: fonts.regular, fontSize: 14 },
  label: { fontSize: 15, fontFamily: fonts.bold },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empty: { fontFamily: fonts.regular, fontSize: 14 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardText: { gap: 4 },
  cardTitle: { fontSize: 16, fontFamily: fonts.bold },
  meta: { fontFamily: fonts.regular, fontSize: 13 },
});
