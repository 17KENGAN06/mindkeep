import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/client';
import { AppButton, Badge } from '../../components/ui';
import { formatMoney, formatSignedMoney } from '../../features/finance/financeUtils';
import {
  useCreateFinanceCategory,
  useCreateFinanceOperation,
  useDeleteFinanceOperation,
  useFinanceCategories,
  useFinanceSummary,
  useUpdateFinanceSettings,
} from '../../features/finance/useFinance';
import type { AppLanguage } from '../../i18n';
import { colors } from '../../theme';
import type { FinanceMoneyKind, FinanceOperation, FinanceOperationType } from '../../types/finance';
import { formatDate, formatMonthTitle, todayDateKey } from '../../utils/date';

function Chip({
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

export function FinanceScreen() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [type, setType] = useState<FinanceOperationType>('EXPENSE');
  const [moneyKind, setMoneyKind] = useState<FinanceMoneyKind>('ELECTRONIC');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayDateKey());
  const [comment, setComment] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [openingInput, setOpeningInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const summaryQuery = useFinanceSummary({ view: 'month', year, month });
  const categoriesQuery = useFinanceCategories();
  const updateSettings = useUpdateFinanceSettings();
  const createCategory = useCreateFinanceCategory();
  const createOperation = useCreateFinanceOperation();
  const deleteOperation = useDeleteFinanceOperation();

  const summary = summaryQuery.data;
  const categories = categoriesQuery.data ?? [];
  const operations = summary?.operations ?? [];

  useEffect(() => {
    if (summary?.totals.openingBalance == null) return;
    setOpeningInput(String(summary.totals.openingBalance));
  }, [summary?.totals.openingBalance]);

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  };

  const onSaveOpening = async () => {
    setFormError(null);
    const next = Number(openingInput.replace(',', '.'));
    if (!Number.isFinite(next)) {
      setFormError(t('finance.errors.opening'));
      return;
    }
    try {
      await updateSettings.mutateAsync({ openingBalance: Math.round(next * 100) / 100 });
    } catch {
      setFormError(t('auth.errors.generic'));
    }
  };

  const onCreateCategory = async () => {
    setFormError(null);
    const name = categoryName.trim();
    if (!name) return;
    try {
      const { category } = await createCategory.mutateAsync({ name });
      setCategoryName('');
      setCategoryId(category.id);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'FINANCE_CATEGORY_NAME_TAKEN') {
        setFormError(t('finance.errors.categoryTaken'));
        return;
      }
      setFormError(t('auth.errors.generic'));
    }
  };

  const onCreateOperation = async () => {
    setFormError(null);
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError(t('finance.errors.amount'));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setFormError(t('finance.errors.date'));
      return;
    }
    try {
      await createOperation.mutateAsync({
        type,
        moneyKind,
        amount: Math.round(parsedAmount * 100) / 100,
        date,
        comment: comment.trim(),
        categoryId: categoryId || null,
      });
      setAmount('');
      setComment('');
    } catch {
      setFormError(t('auth.errors.generic'));
    }
  };

  const onDeleteOperation = (operation: FinanceOperation) => {
    Alert.alert(t('finance.deleteOperationTitle'), t('finance.deleteOperationDescription'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setFormError(null);
          void deleteOperation.mutateAsync(operation.id).catch(() => {
            setFormError(t('auth.errors.generic'));
          });
        },
      },
    ]);
  };

  if ((summaryQuery.isLoading || categoriesQuery.isLoading) && !summary) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  const cash = summary?.totalsByKind.CASH ?? { income: 0, expense: 0, balance: 0 };
  const electronic = summary?.totalsByKind.ELECTRONIC ?? { income: 0, expense: 0, balance: 0 };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={summaryQuery.isRefetching && !summaryQuery.isLoading}
            onRefresh={() => {
              void summaryQuery.refetch();
              void categoriesQuery.refetch();
            }}
            tintColor={colors.brand}
          />
        }
      >
        <Text style={styles.subtitle}>{t('finance.subtitle')}</Text>

        <View style={styles.monthRow}>
          <Pressable onPress={() => shiftMonth(-1)} style={styles.navBtn}>
            <Text style={styles.navText}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{formatMonthTitle(year, month, language)}</Text>
          <Pressable onPress={() => shiftMonth(1)} style={styles.navBtn}>
            <Text style={styles.navText}>›</Text>
          </Pressable>
        </View>

        {summaryQuery.isError ? <Text style={styles.error}>{t('auth.errors.generic')}</Text> : null}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t('finance.totalIncome')}</Text>
            <Text style={styles.statValue}>{formatMoney(summary?.totals.income ?? 0, language)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t('finance.totalExpense')}</Text>
            <Text style={styles.statValue}>{formatMoney(summary?.totals.expense ?? 0, language)}</Text>
          </View>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t('finance.balance')}</Text>
            <Text style={styles.statValue}>
              {formatSignedMoney(summary?.totals.balance ?? 0, language)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t('finance.netWithOpening')}</Text>
            <Text style={styles.statValue}>
              {formatSignedMoney(summary?.totals.netWithOpening ?? 0, language)}
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t('finance.moneyKind.cash')}</Text>
            <Text style={styles.statValue}>{formatSignedMoney(cash.balance, language)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t('finance.moneyKind.electronic')}</Text>
            <Text style={styles.statValue}>{formatSignedMoney(electronic.balance, language)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('finance.openingBalance')}</Text>
          <TextInput
            keyboardType="decimal-pad"
            style={styles.input}
            value={openingInput}
            onChangeText={setOpeningInput}
          />
          <AppButton
            label={t('common.save')}
            loading={updateSettings.isPending}
            onPress={() => void onSaveOpening()}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('finance.addOperation')}</Text>
          <Text style={styles.label}>{t('finance.type')}</Text>
          <View style={styles.row}>
            <Chip
              label={t('finance.expense')}
              active={type === 'EXPENSE'}
              onPress={() => setType('EXPENSE')}
            />
            <Chip
              label={t('finance.income')}
              active={type === 'INCOME'}
              onPress={() => setType('INCOME')}
            />
          </View>
          <Text style={styles.label}>{t('finance.moneyKind.label')}</Text>
          <View style={styles.row}>
            <Chip
              label={t('finance.moneyKind.electronic')}
              active={moneyKind === 'ELECTRONIC'}
              onPress={() => setMoneyKind('ELECTRONIC')}
            />
            <Chip
              label={t('finance.moneyKind.cash')}
              active={moneyKind === 'CASH'}
              onPress={() => setMoneyKind('CASH')}
            />
          </View>
          <Text style={styles.label}>{t('finance.amount')}</Text>
          <TextInput
            keyboardType="decimal-pad"
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.label}>{t('finance.date')}</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            autoCapitalize="none"
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.label}>{t('finance.category')}</Text>
          <View style={styles.row}>
            <Chip
              label={t('finance.noCategory')}
              active={categoryId === ''}
              onPress={() => setCategoryId('')}
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                active={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder={t('finance.categoryName')}
            placeholderTextColor={colors.muted}
          />
          <AppButton
            variant="secondary"
            label={t('finance.createCategory')}
            disabled={!categoryName.trim()}
            loading={createCategory.isPending}
            onPress={() => void onCreateCategory()}
          />
          <Text style={styles.label}>{t('finance.comment')}</Text>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder={t('finance.commentPlaceholder')}
            placeholderTextColor={colors.muted}
          />
          <AppButton
            label={t('finance.saveOperation')}
            loading={createOperation.isPending}
            onPress={() => void onCreateOperation()}
          />
        </View>

        {formError ? <Text style={styles.error}>{formError}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('finance.operationsTitle')}</Text>
          {operations.length === 0 ? (
            <Text style={styles.empty}>{t('finance.emptyOperations')}</Text>
          ) : (
            operations.map((operation) => {
              const signed = operation.type === 'INCOME' ? operation.amount : -operation.amount;
              return (
                <View key={operation.id} style={styles.opRow}>
                  <View style={styles.opBody}>
                    <View style={styles.row}>
                      <Badge
                        tone={operation.type === 'INCOME' ? 'brand' : 'danger'}
                        label={
                          operation.type === 'INCOME' ? t('finance.income') : t('finance.expense')
                        }
                      />
                      <Badge
                        tone="neutral"
                        label={
                          operation.moneyKind === 'CASH'
                            ? t('finance.moneyKind.cash')
                            : t('finance.moneyKind.electronic')
                        }
                      />
                    </View>
                    <Text style={styles.opMeta}>
                      {formatDate(operation.date, language)}
                      {operation.category?.name ? ` · ${operation.category.name}` : ''}
                    </Text>
                    <Text style={styles.opComment}>
                      {operation.comment.trim() || t('finance.noComment')}
                    </Text>
                    <Text
                      style={[
                        styles.opAmount,
                        operation.type === 'INCOME' ? styles.income : styles.expense,
                      ]}
                    >
                      {formatSignedMoney(signed, language)}
                    </Text>
                  </View>
                  <AppButton
                    variant="ghost"
                    label={t('common.delete')}
                    disabled={deleteOperation.isPending}
                    onPress={() => onDeleteOperation(operation)}
                  />
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { backgroundColor: colors.bg, flex: 1 },
  centered: { alignItems: 'center', backgroundColor: colors.bg, flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  subtitle: { color: colors.muted, fontSize: 14 },
  monthRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  monthTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  navBtn: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  navText: { color: colors.ink, fontSize: 22, lineHeight: 24 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  statValue: { color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 4 },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.ink, fontSize: 13 },
  chipTextActive: { color: '#07110d', fontWeight: '700' },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  empty: { color: colors.muted, fontSize: 14, paddingVertical: 8 },
  error: { color: colors.danger, fontSize: 14 },
  opRow: {
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  opBody: { gap: 6 },
  opMeta: { color: colors.muted, fontSize: 12 },
  opComment: { color: colors.ink, fontSize: 14 },
  opAmount: { fontSize: 16, fontWeight: '700' },
  income: { color: colors.brand },
  expense: { color: colors.danger },
});
