import { useEffect, useMemo, useState } from 'react';
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
import { mapAuthError } from '../../features/auth/mapAuthError';
import { useAuth } from '../../features/auth/useAuth';
import { hasAutomation } from '../../features/billing/planLimit';
import { FinanceScanReceipt } from '../../features/finance/FinanceScanReceipt';
import { env } from '../../config/env';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../../navigation/types';
import {
  currencyLabel,
  FINANCE_CURRENCIES,
  isFinanceCurrency,
  type FinanceCurrency,
} from '../../features/finance/currencies';
import {
  capsForView,
  expenseByCurrency,
  formatMoney,
  formatSignedMoney,
  periodBudgetTarget,
  summarizeByCurrency,
  withBudgetCurrencies,
} from '../../features/finance/financeUtils';
import {
  useBulkCreateFinanceOperations,
  useCreateFinanceCategory,
  useCreateFinanceOperation,
  useDeleteFinanceCategory,
  useDeleteFinanceOperation,
  useFinanceCategories,
  useFinanceSummary,
  useUpdateFinanceCategory,
  useUpdateFinanceSettings,
} from '../../features/finance/useFinance';
import { useRefreshOnFocus } from '../../features/sync/useRefreshOnFocus';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import type {
  FinanceMoneyKind,
  FinanceOperation,
  FinanceOperationType,
  FinanceView,
} from '../../types/finance';
import { useAccountToday } from '../../features/time/useAccountToday';
import { formatDate, formatMonthTitle } from '../../utils/date';

function Chip({
  label,
  active,
  onPress,
  fill = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  fill?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: colors.line },
        fill && styles.chipFill,
        active && { backgroundColor: colors.brand, borderColor: colors.brand },
      ]}
    >
      <Text
        numberOfLines={2}
        style={[
          { color: colors.ink, fontSize: 13, textAlign: 'center' },
          active && { color: colors.onBrand, fontWeight: '700' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CurrencyLimitEditor({
  currency,
  language,
  view,
  monthlyLimit,
  spent,
  isSaving,
  onSave,
  onClear,
}: {
  currency: string;
  language: AppLanguage;
  view: FinanceView;
  monthlyLimit?: number;
  spent: number;
  isSaving: boolean;
  onSave: (amount: number) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const canEdit = view === 'month';
  const [draft, setDraft] = useState(monthlyLimit ? String(monthlyLimit) : '');

  useEffect(() => {
    setDraft(monthlyLimit ? String(monthlyLimit) : '');
  }, [monthlyLimit]);

  const parsedDraft = Number(draft.replace(',', '.'));
  const previewMonthly =
    canEdit && Number.isFinite(parsedDraft) && parsedDraft > 0 ? parsedDraft : monthlyLimit;
  const target = periodBudgetTarget(previewMonthly);
  const remaining = target ? target - spent : 0;
  const over = Boolean(target) && remaining < 0;
  const ratio = target && target > 0 ? spent / target : 0;
  const percent = Math.min(100, Math.round(ratio * 100));
  const barColor = over || ratio >= 0.8 ? colors.expense : colors.brand;

  return (
    <View style={[styles.limitBox, { borderColor: colors.line, backgroundColor: colors.bg }]}>
      <Text style={[styles.statLabel, { color: colors.muted }]}>
        {view === 'year' ? t('finance.limits.yearTitle') : t('finance.limits.monthTitle')}
      </Text>
      <Text style={[styles.statValue, { color: colors.ink }]}>
        {target
          ? t('finance.limits.spentOf', {
              spent: formatMoney(spent, language, currency),
              budget: formatMoney(target, language, currency),
            })
          : t('finance.limits.noCap')}
      </Text>
      <View style={[styles.limitTrack, { backgroundColor: colors.line }]}>
        <View
          style={[
            styles.limitFill,
            { width: `${target ? percent : 0}%`, backgroundColor: target ? barColor : 'transparent' },
          ]}
        />
      </View>
      <Text style={[styles.opMeta, { color: over ? colors.expense : colors.muted }]}>
        {target
          ? over
            ? t('finance.limits.over', { amount: formatMoney(-remaining, language, currency) })
            : t('finance.limits.left', { amount: formatMoney(remaining, language, currency) })
          : canEdit
            ? t('finance.limits.unsetHint')
            : t('finance.limits.yearSetHint')}
      </Text>
      {canEdit ? (
      <>
      <TextInput
        keyboardType="decimal-pad"
        style={[styles.input, { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink }]}
        value={draft}
        onChangeText={setDraft}
        placeholder="0.00"
        placeholderTextColor={colors.muted}
      />
      <View style={styles.row}>
        <AppButton
          label={target ? t('common.save') : t('finance.limits.set')}
          loading={isSaving}
          onPress={() => {
            const parsed = Number(draft.replace(',', '.'));
            if (!Number.isFinite(parsed) || parsed <= 0) return;
            onSave(parsed);
          }}
        />
        {target ? (
          <AppButton variant="ghost" label={t('finance.limits.remove')} loading={isSaving} onPress={onClear} />
        ) : null}
      </View>
      </>
      ) : null}
    </View>
  );
}

export function FinanceScreen() {
  const { t, i18n } = useTranslation();
  useRefreshOnFocus('finance');
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const { today, year: todayYear, month: todayMonth } = useAccountToday();
  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [view, setView] = useState<FinanceView>('month');
  const [type, setType] = useState<FinanceOperationType>('EXPENSE');
  const [moneyKind, setMoneyKind] = useState<FinanceMoneyKind>('ELECTRONIC');
  const [currency, setCurrency] = useState<FinanceCurrency>('UAH');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [comment, setComment] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<'ALL' | FinanceMoneyKind>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');

  const summaryQuery = useFinanceSummary({
    view,
    year,
    ...(view === 'month' ? { month } : {}),
  });
  const categoriesQuery = useFinanceCategories();
  const createCategory = useCreateFinanceCategory();
  const updateCategory = useUpdateFinanceCategory();
  const deleteCategory = useDeleteFinanceCategory();
  const createOperation = useCreateFinanceOperation();
  const bulkCreate = useBulkCreateFinanceOperations();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  // Plans live on Account; store builds have no purchase path (see config/env.ts).
  const onNeedPro = env.storeBuild ? undefined : () => navigation.navigate('Account');
  const deleteOperation = useDeleteFinanceOperation();
  const updateSettings = useUpdateFinanceSettings();
  const [savingLimit, setSavingLimit] = useState<string | null>(null);
  const [addLimitCurrency, setAddLimitCurrency] = useState<FinanceCurrency>('UAH');
  const [addLimitAmount, setAddLimitAmount] = useState('');

  const summary = summaryQuery.data;
  const periodLimits = summary?.settings.periodLimits ?? {};
  const monthlyLimits = capsForView(periodLimits, view, year, month);
  const categories = categoriesQuery.data ?? [];
  const operations = summary?.operations ?? [];
  const availableCurrencies = useMemo(() => {
    const seen = new Set([
      ...operations.map((op) => op.currency || 'EUR'),
      ...Object.keys(monthlyLimits),
    ]);
    const ranked = FINANCE_CURRENCIES.filter((code) => seen.has(code));
    const extra = [...seen].filter((code) => !(FINANCE_CURRENCIES as readonly string[]).includes(code));
    return [...ranked, ...extra];
  }, [operations, monthlyLimits]);
  const activeCurrencyFilter =
    currencyFilter !== 'ALL' && availableCurrencies.includes(currencyFilter) ? currencyFilter : 'ALL';
  const filteredOperations = useMemo(
    () =>
      operations.filter((op) => {
        if (kindFilter !== 'ALL' && (op.moneyKind ?? 'ELECTRONIC') !== kindFilter) return false;
        if (activeCurrencyFilter !== 'ALL' && (op.currency || 'EUR') !== activeCurrencyFilter) {
          return false;
        }
        return true;
      }),
    [operations, kindFilter, activeCurrencyFilter],
  );
  const currencyBuckets = useMemo(() => {
    const spentBuckets = summarizeByCurrency(filteredOperations);
    const merged = withBudgetCurrencies(spentBuckets, monthlyLimits);
    if (activeCurrencyFilter === 'ALL') return merged;
    return merged.filter((bucket) => bucket.currency === activeCurrencyFilter);
  }, [filteredOperations, monthlyLimits, activeCurrencyFilter]);
  const periodExpense = useMemo(() => expenseByCurrency(operations), [operations]);
  const takenForNewBudget = useMemo(() => {
    const codes = new Set<string>(Object.keys(monthlyLimits));
    for (const op of operations) codes.add(op.currency || 'EUR');
    return codes;
  }, [monthlyLimits, operations]);
  const freeBudgetCurrencies = FINANCE_CURRENCIES.filter((code) => !takenForNewBudget.has(code));
  const addLimitSelected = freeBudgetCurrencies.includes(addLimitCurrency)
    ? addLimitCurrency
    : (freeBudgetCurrencies[0] ?? 'UAH');

  const shiftPeriod = (delta: number) => {
    if (view === 'year') {
      setYear((value) => value + delta);
      return;
    }
    const next = new Date(year, month - 1 + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
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
      setFormError(mapAuthError(error, t));
    }
  };

  const onUpdateCategory = async () => {
    if (!editingCategoryId) return;
    const name = editingCategoryName.trim();
    if (!name) return;
    setFormError(null);
    try {
      await updateCategory.mutateAsync({ id: editingCategoryId, name });
      setEditingCategoryId(null);
      setEditingCategoryName('');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'FINANCE_CATEGORY_NAME_TAKEN') {
        setFormError(t('finance.errors.categoryTaken'));
        return;
      }
      setFormError(mapAuthError(error, t));
    }
  };

  const onDeleteCategory = (id: string, name: string) => {
    Alert.alert(t('finance.deleteCategoryTitle'), t('finance.deleteCategoryDescription', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setFormError(null);
          void deleteCategory.mutateAsync(id).catch((caught) => {
            setFormError(mapAuthError(caught, t));
          });
          if (categoryId === id) setCategoryId('');
          if (editingCategoryId === id) {
            setEditingCategoryId(null);
            setEditingCategoryName('');
          }
        },
      },
    ]);
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
        currency,
        amount: Math.round(parsedAmount * 100) / 100,
        date,
        comment: comment.trim(),
        categoryId: categoryId || null,
      });
      setAmount('');
      setComment('');
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    }
  };

  const saveMonthlyLimit = async (code: FinanceCurrency, nextAmount: number | null) => {
    setSavingLimit(code);
    setFormError(null);
    try {
      await updateSettings.mutateAsync({
        monthlyLimit: { currency: code, amount: nextAmount, year, month },
      });
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    } finally {
      setSavingLimit(null);
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
          void deleteOperation.mutateAsync(operation.id).catch((caught) => {
            setFormError(mapAuthError(caught, t));
          });
        },
      },
    ]);
  };

  if ((summaryQuery.isLoading || categoriesQuery.isLoading) && !summary) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.bg }]}
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
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t('finance.subtitle')}</Text>

        <View style={styles.row}>
          <Chip
            label={t('finance.viewMonth')}
            active={view === 'month'}
            onPress={() => setView('month')}
          />
          <Chip
            label={t('finance.viewYear')}
            active={view === 'year'}
            onPress={() => setView('year')}
          />
        </View>

        <View style={styles.monthRow}>
          <Pressable onPress={() => shiftPeriod(-1)} style={[styles.navBtn, { borderColor: colors.line }]}>
            <Text style={[styles.navText, { color: colors.ink }]}>‹</Text>
          </Pressable>
          <Text style={[styles.monthTitle, { color: colors.ink }]}>
            {view === 'year' ? String(year) : formatMonthTitle(year, month, language)}
          </Text>
          <Pressable onPress={() => shiftPeriod(1)} style={[styles.navBtn, { borderColor: colors.line }]}>
            <Text style={[styles.navText, { color: colors.ink }]}>›</Text>
          </Pressable>
        </View>

        {summaryQuery.isError ? (
          <Text style={[styles.error, { color: colors.danger }]}>{t('auth.errors.generic')}</Text>
        ) : null}

        <View style={styles.row}>
          <Chip
            label={t('finance.moneyKind.all')}
            active={kindFilter === 'ALL'}
            onPress={() => setKindFilter('ALL')}
          />
          <Chip
            label={t('finance.moneyKind.electronic')}
            active={kindFilter === 'ELECTRONIC'}
            onPress={() => setKindFilter('ELECTRONIC')}
          />
          <Chip
            label={t('finance.moneyKind.cash')}
            active={kindFilter === 'CASH'}
            onPress={() => setKindFilter('CASH')}
          />
        </View>
        {availableCurrencies.length > 1 ? (
          <View style={styles.row}>
            <Chip
              label={t('finance.allCurrencies')}
              active={activeCurrencyFilter === 'ALL'}
              onPress={() => setCurrencyFilter('ALL')}
            />
            {availableCurrencies.map((code) => (
              <Chip
                key={`filter-${code}`}
                label={code}
                active={activeCurrencyFilter === code}
                onPress={() => setCurrencyFilter(code)}
              />
            ))}
          </View>
        ) : null}

        {view === 'month' && freeBudgetCurrencies.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('finance.limits.addTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{t('finance.limits.addHint')}</Text>
            <View style={styles.row}>
              {freeBudgetCurrencies.map((code) => (
                <Chip
                  key={`add-limit-${code}`}
                  label={code}
                  active={addLimitSelected === code}
                  onPress={() => setAddLimitCurrency(code)}
                />
              ))}
            </View>
            <TextInput
              keyboardType="decimal-pad"
              style={[
                styles.input,
                { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
              ]}
              value={addLimitAmount}
              onChangeText={setAddLimitAmount}
              placeholder="0.00"
              placeholderTextColor={colors.muted}
            />
            <AppButton
              label={t('finance.limits.set')}
              loading={savingLimit === addLimitSelected}
              onPress={() => {
                const parsed = Number(addLimitAmount.replace(',', '.'));
                if (!Number.isFinite(parsed) || parsed <= 0) {
                  setFormError(t('finance.limits.invalid'));
                  return;
                }
                setAddLimitAmount('');
                void saveMonthlyLimit(addLimitSelected, parsed);
              }}
            />
          </View>
        ) : null}

        {currencyBuckets.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.empty, { color: colors.muted }]}>{t('finance.emptyCurrencies')}</Text>
          </View>
        ) : (
          currencyBuckets.map((bucket) => {
            const months = bucket.byMonth.filter((item) => item.income !== 0 || item.expense !== 0);
            return (
              <View
                key={bucket.currency}
                style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}
              >
                <Text style={[styles.cardTitle, { color: colors.ink }]}>
                  {currencyLabel(bucket.currency, language)}
                </Text>
                <Text style={[styles.statValue, { color: colors.ink }]}>
                  {formatSignedMoney(bucket.balance, language, bucket.currency)}
                </Text>
                <View style={styles.stats}>
                  <View style={[styles.stat, { backgroundColor: colors.bg, borderColor: colors.line }]}>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>{t('finance.income')}</Text>
                    <Text style={[styles.statValue, { color: colors.brand }]}>
                      {formatSignedMoney(bucket.income, language, bucket.currency)}
                    </Text>
                  </View>
                  <View style={[styles.stat, { backgroundColor: colors.bg, borderColor: colors.line }]}>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>{t('finance.expense')}</Text>
                    <Text style={[styles.statValue, { color: colors.expense }]}>
                      {formatSignedMoney(-bucket.expense, language, bucket.currency)}
                    </Text>
                  </View>
                </View>
                <View style={styles.stats}>
                  <View style={[styles.stat, { backgroundColor: colors.bg, borderColor: colors.line }]}>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>
                      {t('finance.moneyKind.electronic')}
                    </Text>
                    <Text style={[styles.statValue, { color: colors.ink }]}>
                      {formatSignedMoney(bucket.byKind.ELECTRONIC.balance, language, bucket.currency)}
                    </Text>
                  </View>
                  <View style={[styles.stat, { backgroundColor: colors.bg, borderColor: colors.line }]}>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>
                      {t('finance.moneyKind.cash')}
                    </Text>
                    <Text style={[styles.statValue, { color: colors.ink }]}>
                      {formatSignedMoney(bucket.byKind.CASH.balance, language, bucket.currency)}
                    </Text>
                  </View>
                </View>
                {isFinanceCurrency(bucket.currency) ? (
                  <CurrencyLimitEditor
                    currency={bucket.currency}
                    language={language}
                    view={view}
                    monthlyLimit={monthlyLimits[bucket.currency]}
                    spent={periodExpense[bucket.currency] ?? 0}
                    isSaving={savingLimit === bucket.currency}
                    onSave={(nextAmount) => void saveMonthlyLimit(bucket.currency as FinanceCurrency, nextAmount)}
                    onClear={() => void saveMonthlyLimit(bucket.currency as FinanceCurrency, null)}
                  />
                ) : null}
                {view === 'year'
                  ? months.map((item) => (
                      <Pressable
                        key={`${bucket.currency}-${item.month}`}
                        onPress={() => {
                          setMonth(item.month);
                          setView('month');
                        }}
                        style={[styles.monthStat, { borderColor: colors.line }]}
                      >
                        <Text style={[styles.opComment, { color: colors.ink }]}>
                          {formatMonthTitle(year, item.month, language)}
                        </Text>
                        <Text style={[styles.opMeta, { color: colors.muted }]}>
                          {formatSignedMoney(item.income, language, bucket.currency)} ·{' '}
                          {formatSignedMoney(-item.expense, language, bucket.currency)}
                        </Text>
                      </Pressable>
                    ))
                  : null}
              </View>
            );
          })
        )}

        <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('finance.addOperation')}</Text>
          <FinanceScanReceipt
            canScan={hasAutomation(user)}
            fallbackCurrency={currency}
            defaultMoneyKind={moneyKind}
            categories={categories}
            saving={bulkCreate.isPending}
            onNeedPro={onNeedPro}
            onSave={async (operations) => {
              await bulkCreate.mutateAsync(operations);
            }}
          />
          <Text style={[styles.label, { color: colors.muted }]}>{t('finance.moneyKind.label')}</Text>
          <View style={styles.pair}>
            <View style={styles.pairSlot}>
              <Chip
                fill
                label={t('finance.moneyKind.electronic')}
                active={moneyKind === 'ELECTRONIC'}
                onPress={() => setMoneyKind('ELECTRONIC')}
              />
            </View>
            <View style={styles.pairSlot}>
              <Chip
                fill
                label={t('finance.moneyKind.cash')}
                active={moneyKind === 'CASH'}
                onPress={() => setMoneyKind('CASH')}
              />
            </View>
          </View>
          <Text style={[styles.label, { color: colors.muted }]}>{t('finance.currency')}</Text>
          <View style={styles.row}>
            {FINANCE_CURRENCIES.map((code) => (
              <Chip
                key={code}
                label={code}
                active={currency === code}
                onPress={() => setCurrency(code)}
              />
            ))}
          </View>
          <Text style={[styles.label, { color: colors.muted }]}>{t('finance.type')}</Text>
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
          <Text style={[styles.label, { color: colors.muted }]}>{t('finance.amount')}</Text>
          <TextInput
            keyboardType="decimal-pad"
            style={[
              styles.input,
              { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
            ]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
          />
          <Text style={[styles.label, { color: colors.muted }]}>{t('finance.date')}</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
            ]}
            value={date}
            onChangeText={setDate}
            autoCapitalize="none"
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
          />
          <Text style={[styles.label, { color: colors.muted }]}>{t('finance.category')}</Text>
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
          {categories.map((category) => (
            <View key={`edit-${category.id}`} style={styles.catRow}>
              {editingCategoryId === category.id ? (
                <TextInput
                  style={[
                    styles.input,
                    styles.catInput,
                    { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
                  ]}
                  value={editingCategoryName}
                  onChangeText={setEditingCategoryName}
                />
              ) : (
                <Text style={[styles.opComment, { color: colors.ink }]}>{category.name}</Text>
              )}
              {editingCategoryId === category.id ? (
                <AppButton
                  variant="secondary"
                  label={t('common.save')}
                  loading={updateCategory.isPending}
                  onPress={() => void onUpdateCategory()}
                />
              ) : (
                <AppButton
                  variant="ghost"
                  label={t('common.edit')}
                  onPress={() => {
                    setEditingCategoryId(category.id);
                    setEditingCategoryName(category.name);
                  }}
                />
              )}
              <AppButton
                variant="ghost"
                label={t('common.delete')}
                loading={deleteCategory.isPending}
                onPress={() => onDeleteCategory(category.id, category.name)}
              />
            </View>
          ))}
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
            ]}
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
          <Text style={[styles.label, { color: colors.muted }]}>{t('finance.comment')}</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
            ]}
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

        {formError ? <Text style={[styles.error, { color: colors.danger }]}>{formError}</Text> : null}

        <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('finance.operationsTitle')}</Text>
          {filteredOperations.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t('finance.emptyOperations')}</Text>
          ) : (
            filteredOperations.map((operation) => {
              const signed = operation.type === 'INCOME' ? operation.amount : -operation.amount;
              return (
                <View key={operation.id} style={[styles.opRow, { borderColor: colors.line }]}>
                  <View style={styles.opBody}>
                    <View style={styles.row}>
                      <Badge
                        tone={operation.type === 'INCOME' ? 'brand' : 'expense'}
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
                    <Text style={[styles.opMeta, { color: colors.muted }]}>
                      {formatDate(operation.date, language)}
                      {operation.category?.name ? ` · ${operation.category.name}` : ''}
                    </Text>
                    <Text style={[styles.opComment, { color: colors.ink }]}>
                      {operation.comment.trim() || t('finance.noComment')}
                    </Text>
                    <Text
                      style={[
                        styles.opAmount,
                        { color: operation.type === 'INCOME' ? colors.brand : colors.expense },
                      ]}
                    >
                      {formatSignedMoney(signed, language, operation.currency)}
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
  flex: { flex: 1 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14 },
  monthRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  monthTitle: { fontSize: 18, fontWeight: '700' },
  navBtn: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  navText: { fontSize: 22, lineHeight: 24 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statValue: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pair: { flexDirection: 'row', gap: 8 },
  pairSlot: { flex: 1 },
  chip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    maxWidth: '100%',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipFill: { alignSelf: 'stretch', width: '100%' },
  limitBox: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  limitTrack: { borderRadius: 999, height: 8, overflow: 'hidden' },
  limitFill: { borderRadius: 999, height: 8 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  empty: { fontSize: 14, paddingVertical: 8 },
  error: { fontSize: 14 },
  opRow: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  opBody: { gap: 6 },
  opMeta: { fontSize: 12 },
  opComment: { fontSize: 14 },
  opAmount: { fontSize: 16, fontWeight: '700' },
  monthStat: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  catRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catInput: { flex: 1, minWidth: 140 },
});
