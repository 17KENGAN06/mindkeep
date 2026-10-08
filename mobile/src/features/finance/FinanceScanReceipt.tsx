import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ApiError, NetworkError } from '../../api/client';
import { financeApi, type CreateOperationPayload } from '../../api/finance';
import { AppIcon, type AppIconName } from '../../components/AppIcon';
import { SheetModal } from '../../components/SheetModal';
import { AppButton, Badge } from '../../components/ui';
import { mapAuthError } from '../auth/mapAuthError';
import { compressMealPhoto, MealPhotoError } from '../nutrition/compressMealPhoto';
import { useTheme } from '../theme/useTheme';
import { FINANCE_CURRENCIES, isFinanceCurrency, type FinanceCurrency } from './currencies';
import type { FinanceCategory, FinanceMoneyKind, FinanceOperationType } from '../../types/finance';

type ReviewRow = {
  date: string;
  amount: string;
  currency: FinanceCurrency;
  type: FinanceOperationType;
  comment: string;
  categoryId: string;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Same error mapping as the site (features/finance/FinanceScanReceipt). */
function scanErrorMessage(error: unknown, t: Translate): string {
  const code = error instanceof MealPhotoError ? error.code : error instanceof ApiError ? error.code : null;
  switch (code) {
    case 'FINANCE_SCAN_UNAVAILABLE':
    case 'FOOD_SCAN_UNAVAILABLE':
      return t('finance.scan.errors.unavailable');
    case 'FINANCE_IMPORT_PRO_REQUIRED':
    case 'FOOD_SCAN_PRO_REQUIRED':
      return t('finance.scan.errors.proRequired');
    case 'FINANCE_SCAN_EMPTY':
      return t('finance.scan.errors.notRecognized');
    case 'FOOD_SCAN_TOO_LARGE':
      return t('finance.scan.errors.tooLarge');
    case 'FOOD_SCAN_BAD_TYPE':
      return t('finance.scan.errors.badType');
    case 'FOOD_SCAN_INVALID':
      return t('finance.scan.errors.invalid');
    case 'FINANCE_SCAN_FAILED':
    case 'FOOD_SCAN_FAILED':
      return t('finance.scan.errors.failed');
    default:
      if (error instanceof NetworkError) return t('finance.scan.errors.failed');
      return mapAuthError(error, t);
  }
}

type FinanceScanReceiptProps = {
  canScan: boolean;
  fallbackCurrency: FinanceCurrency;
  defaultMoneyKind: FinanceMoneyKind;
  categories: FinanceCategory[];
  saving?: boolean;
  onNeedPro?: () => void;
  onSave: (operations: CreateOperationPayload[]) => Promise<void>;
};

/** Receipt photo → operations → review → bulk add (site: features/finance/FinanceScanReceipt). */
export function FinanceScanReceipt({
  canScan,
  fallbackCurrency,
  defaultMoneyKind,
  categories,
  saving = false,
  onNeedPro,
  onSave,
}: FinanceScanReceiptProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewRow[] | null>(null);
  const [batchCategory, setBatchCategory] = useState('');
  const [batchMoneyKind, setBatchMoneyKind] = useState<FinanceMoneyKind>(defaultMoneyKind);

  const analyze = async (asset: ImagePicker.ImagePickerAsset) => {
    setError(null);
    setAnalyzing(true);
    try {
      const payload = await compressMealPhoto({ uri: asset.uri, width: asset.width, height: asset.height });
      const result = await financeApi.scanStatement({ ...payload, fallbackCurrency });
      setBatchCategory('');
      setBatchMoneyKind(defaultMoneyKind);
      setReview(
        result.operations.map((row) => ({
          date: row.date,
          amount: String(row.amount),
          currency: row.currency && isFinanceCurrency(row.currency) ? row.currency : fallbackCurrency,
          type: row.type,
          comment: row.comment ?? '',
          categoryId: '',
        })),
      );
    } catch (caught) {
      setReview(null);
      setError(scanErrorMessage(caught, t));
    } finally {
      setAnalyzing(false);
    }
  };

  const fromCamera = async () => {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError(t('fuel.scan.cameraDenied'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled && result.assets[0]) void analyze(result.assets[0]);
  };

  const fromGallery = async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled && result.assets[0]) void analyze(result.assets[0]);
  };

  const patchRow = (index: number, patch: Partial<ReviewRow>) =>
    setReview((rows) => rows?.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)) ?? null);

  const onConfirm = async () => {
    if (!review || review.length === 0) return;
    const parsed = review.map((row) => ({ ...row, value: Number(row.amount.replace(',', '.')) }));
    if (parsed.some((row) => !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Number.isFinite(row.value) || row.value <= 0)) {
      setError(t('finance.errors.amount'));
      return;
    }
    setError(null);
    try {
      await onSave(
        parsed.map((row) => ({
          date: row.date,
          amount: Math.round(row.value * 100) / 100,
          currency: row.currency,
          type: row.type,
          moneyKind: batchMoneyKind,
          comment: row.comment.trim(),
          categoryId: row.categoryId || null,
        })),
      );
      setReview(null);
    } catch (caught) {
      setError(scanErrorMessage(caught, t));
    }
  };

  const chip = (key: string, label: string, active: boolean, onPress: () => void, icon?: AppIconName) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.chip,
        active ? { backgroundColor: colors.brand, borderColor: colors.brand } : { backgroundColor: colors.panel, borderColor: colors.line },
      ]}
    >
      {icon ? <AppIcon name={icon} color={active ? colors.onBrand : colors.ink} size={16} /> : null}
      <Text style={[styles.chipText, { color: active ? colors.onBrand : colors.ink }]}>{label}</Text>
    </Pressable>
  );

  const inputStyle = [styles.input, { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink }];

  const sourceButton = (icon: AppIconName, label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      disabled={analyzing}
      onPress={onPress}
      style={[styles.sourceBtn, { backgroundColor: colors.panel, borderColor: colors.line }, analyzing && styles.disabled]}
    >
      {analyzing ? <ActivityIndicator color={colors.brand} /> : <AppIcon name={icon} color={colors.ink} size={18} />}
      <Text style={[styles.sourceText, { color: colors.ink }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      {canScan ? (
        <View style={styles.rowWrap}>
          {sourceButton('camera-outline', t('finance.scan.buttonShort'), () => void fromCamera())}
          {sourceButton('images-outline', t('finance.scan.gallery'), () => void fromGallery())}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onNeedPro}
          style={[styles.sourceBtn, styles.locked, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <AppIcon name="camera-outline" color={colors.ink} size={18} />
          <Text style={[styles.sourceText, { color: colors.ink }]}>{t('finance.scan.button')}</Text>
          <Badge tone="neutral" label="Pro" />
        </Pressable>
      )}
      <Text style={[styles.hint, { color: colors.muted }]}>
        {analyzing ? t('finance.scan.analyzing') : canScan ? t('finance.scan.hint') : t('finance.scan.proOnly')}
      </Text>
      {!review && error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <SheetModal
        visible={review !== null}
        title={t('finance.scan.reviewTitle')}
        subtitle={t('finance.scan.reviewHint')}
        onClose={() => {
          if (!saving) {
            setReview(null);
            setError(null);
          }
        }}
        footer={
          <>
            <AppButton label={t('finance.scan.add')} loading={saving} onPress={() => void onConfirm()} />
            <AppButton
              variant="secondary"
              label={t('finance.scan.cancel')}
              disabled={saving}
              onPress={() => {
                setReview(null);
                setError(null);
              }}
            />
          </>
        }
      >
        <Text style={[styles.label, { color: colors.ink }]}>{t('finance.scan.moneyKind')}</Text>
        <View style={styles.pair}>
          {chip('cash', t('finance.moneyKind.cash'), batchMoneyKind === 'CASH', () => setBatchMoneyKind('CASH'), 'cash-outline')}
          {chip('card', t('finance.scan.card'), batchMoneyKind === 'ELECTRONIC', () => setBatchMoneyKind('ELECTRONIC'), 'card-outline')}
        </View>

        <Text style={[styles.label, { color: colors.ink }]}>{t('finance.scan.category')}</Text>
        <View style={styles.chips}>
          {chip('none', t('finance.noCategory'), batchCategory === '', () => {
            setBatchCategory('');
            setReview((rows) => rows?.map((row) => ({ ...row, categoryId: '' })) ?? null);
          })}
          {categories.map((category) =>
            chip(category.id, category.name, batchCategory === category.id, () => {
              setBatchCategory(category.id);
              setReview((rows) => rows?.map((row) => ({ ...row, categoryId: category.id })) ?? null);
            }),
          )}
        </View>

        {review?.map((row, index) => (
          <View key={`${row.date}-${index}`} style={[styles.item, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.label, { color: colors.ink }]}>{t('finance.scan.item')}</Text>
            <TextInput
              multiline
              maxLength={500}
              value={row.comment}
              onChangeText={(comment) => patchRow(index, { comment })}
              style={[inputStyle, styles.comment]}
            />
            <View style={styles.rowWrap}>
              <View style={styles.flex}>
                <Text style={[styles.label, { color: colors.ink }]}>{t('finance.amount')}</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  value={row.amount}
                  onChangeText={(amount) => patchRow(index, { amount })}
                  style={inputStyle}
                />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.label, { color: colors.ink }]}>{t('finance.date')}</Text>
                <TextInput
                  autoCapitalize="none"
                  value={row.date}
                  onChangeText={(date) => patchRow(index, { date })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  style={inputStyle}
                />
              </View>
            </View>
            <Text style={[styles.label, { color: colors.ink }]}>{t('finance.type')}</Text>
            <View style={styles.pair}>
              {chip('exp', t('finance.expense'), row.type === 'EXPENSE', () => patchRow(index, { type: 'EXPENSE' }))}
              {chip('inc', t('finance.income'), row.type === 'INCOME', () => patchRow(index, { type: 'INCOME' }))}
            </View>
            <Text style={[styles.label, { color: colors.ink }]}>{t('finance.currency')}</Text>
            <View style={styles.chips}>
              {FINANCE_CURRENCIES.map((code) => chip(code, code, row.currency === code, () => patchRow(index, { currency: code })))}
            </View>
            {review.length > 1 ? (
              <>
                <Text style={[styles.label, { color: colors.ink }]}>{t('finance.category')}</Text>
                <View style={styles.chips}>
                  {chip('none', t('finance.noCategory'), row.categoryId === '', () => patchRow(index, { categoryId: '' }))}
                  {categories.map((category) =>
                    chip(category.id, category.name, row.categoryId === category.id, () =>
                      patchRow(index, { categoryId: category.id }),
                    ),
                  )}
                </View>
              </>
            ) : null}
          </View>
        ))}
        <Text style={[styles.hint, { color: colors.muted }]}>{t('finance.scan.privacy')}</Text>
        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  rowWrap: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1, gap: 6 },
  sourceBtn: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 8,
  },
  sourceText: { flexShrink: 1, fontSize: 14, fontWeight: '600' },
  locked: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  hint: { fontSize: 12, lineHeight: 17 },
  error: { fontSize: 14 },
  label: { fontSize: 14, fontWeight: '600' },
  pair: { flexDirection: 'row', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  item: { borderRadius: 18, borderWidth: 1, gap: 8, padding: 12 },
  input: { borderRadius: 12, borderWidth: 1, fontSize: 16, minHeight: 46, paddingHorizontal: 12, paddingVertical: 10 },
  comment: { minHeight: 64, textAlignVertical: 'top' },
});
