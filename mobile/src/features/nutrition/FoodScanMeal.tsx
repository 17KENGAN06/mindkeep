import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ApiError, NetworkError } from '../../api/client';
import { nutritionApi } from '../../api/nutrition';
import { AppIcon } from '../../components/AppIcon';
import { SheetModal } from '../../components/SheetModal';
import { AppButton, Badge } from '../../components/ui';
import { mapAuthError } from '../auth/mapAuthError';
import { useTheme } from '../theme/useTheme';
import { compressMealPhoto, MealPhotoError, type PickedPhoto } from './compressMealPhoto';
import { macroDraftFrom, parseMacroDraft, type MacroDraft } from './macros';
import { MealKindPicker } from './MealKindPicker';
import type { MealKind } from './mealKinds';
import { useCreateMeal } from './useNutrition';

const MAX_PHOTOS = 3;

type ReviewState = {
  mealName: string;
  totalCalories: string;
  kind: MealKind | null;
  macros: MacroDraft;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Same error mapping as the site (features/nutrition/FoodScanMeal). */
function scanErrorMessage(error: unknown, t: Translate): string {
  const code =
    error instanceof MealPhotoError ? error.code : error instanceof ApiError ? error.code : null;
  switch (code) {
    case 'FOOD_SCAN_UNAVAILABLE':
      return t('fuel.scan.errors.unavailable');
    case 'FOOD_SCAN_PRO_REQUIRED':
      return t('fuel.scan.errors.proRequired');
    case 'FOOD_NOT_RECOGNIZED':
      return t('fuel.scan.errors.notRecognized');
    case 'FOOD_SCAN_TOO_LARGE':
      return t('fuel.scan.errors.tooLarge');
    case 'FOOD_SCAN_BAD_TYPE':
      return t('fuel.scan.errors.badType');
    case 'FOOD_SCAN_INVALID':
      return t('fuel.scan.errors.invalid');
    case 'FOOD_SCAN_FAILED':
      return t('fuel.scan.errors.failed');
    default:
      if (error instanceof NetworkError) return t('fuel.scan.errors.failed');
      return mapAuthError(error, t);
  }
}

type FoodScanMealProps = {
  date: string;
  /** Pro (or admin / beta): the server only scans for these accounts. */
  canScan: boolean;
  macrosEnabled?: boolean;
  onNeedPro?: () => void;
};

/** Photo (or text) → calorie estimate → review → meal (site: features/nutrition/FoodScanMeal). */
export function FoodScanMeal({ date, canScan, macrosEnabled = false, onNeedPro }: FoodScanMealProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const createMeal = useCreateMeal();
  const [preparing, setPreparing] = useState(false);
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<(PickedPhoto & { id: string })[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewState | null>(null);

  const closePrepare = () => {
    setPhotos([]);
    setNote('');
    setPreparing(false);
  };

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    if (assets.length === 0) return;
    setError(null);
    setPhotos((current) => {
      const room = MAX_PHOTOS - current.length;
      const added = assets.slice(0, room).map((asset, index) => ({
        id: `${asset.uri}-${Date.now()}-${index}`,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      }));
      return [...current, ...added];
    });
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError(t('fuel.scan.cameraDenied'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled) addAssets(result.assets);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 1,
    });
    if (!result.canceled) addAssets(result.assets);
  };

  const canEstimate = photos.length > 0 || note.trim().length >= 2;

  const onEstimate = async () => {
    if (!canEstimate) {
      setError(t('fuel.scan.prepareNeedPhoto'));
      return;
    }
    setError(null);
    setAnalyzing(true);
    try {
      const images = await Promise.all(photos.map((photo) => compressMealPhoto(photo)));
      const trimmed = note.trim();
      const estimate = await nutritionApi.scanFood({
        ...(images.length > 0 ? { images } : {}),
        ...(trimmed ? { note: trimmed.slice(0, 240) } : {}),
      });
      setReview({
        mealName: estimate.mealName,
        totalCalories: String(estimate.totalCalories),
        kind: null,
        macros: macroDraftFrom({
          protein: estimate.protein ?? null,
          fat: estimate.fat ?? null,
          carbs: estimate.carbs ?? null,
        }),
      });
      closePrepare();
    } catch (caught) {
      setError(scanErrorMessage(caught, t));
    } finally {
      setAnalyzing(false);
    }
  };

  const onConfirm = async () => {
    if (!review) return;
    const calories = Number(review.totalCalories);
    if (!review.mealName.trim()) {
      setError(t('fuel.errors.title'));
      return;
    }
    if (!Number.isFinite(calories) || calories < 1 || calories > 10000) {
      setError(t('fuel.errors.calories'));
      return;
    }
    if (!review.kind) {
      setError(t('fuel.errors.kind'));
      return;
    }
    const macros = macrosEnabled ? parseMacroDraft(review.macros) : { protein: null, fat: null, carbs: null };
    if (!macros) {
      setError(t('fuel.macros.invalid'));
      return;
    }
    setError(null);
    try {
      await createMeal.mutateAsync({
        title: review.mealName.trim(),
        calories: Math.round(calories),
        date,
        kind: review.kind,
        ...(macros.protein == null ? {} : { protein: macros.protein }),
        ...(macros.fat == null ? {} : { fat: macros.fat }),
        ...(macros.carbs == null ? {} : { carbs: macros.carbs }),
      });
      setReview(null);
    } catch (caught) {
      setError(scanErrorMessage(caught, t));
    }
  };

  const inputStyle = [styles.input, { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink }];

  const sourceButton = (icon: 'camera-outline' | 'images-outline', label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      disabled={analyzing}
      onPress={onPress}
      style={[styles.sourceBtn, { backgroundColor: colors.panel, borderColor: colors.line }, analyzing && styles.disabled]}
    >
      <AppIcon name={icon} color={colors.ink} size={18} />
      <Text style={[styles.sourceText, { color: colors.ink }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      {canScan ? (
        <View style={styles.row}>
          {sourceButton('camera-outline', t('fuel.scan.buttonShort'), () => {
            setError(null);
            setPreparing(true);
          })}
          {sourceButton('images-outline', t('fuel.scan.gallery'), () => {
            setError(null);
            setPreparing(true);
          })}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onNeedPro}
          style={[styles.sourceBtn, styles.locked, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <AppIcon name="camera-outline" color={colors.ink} size={18} />
          <Text style={[styles.sourceText, { color: colors.ink }]}>{t('fuel.scan.button')}</Text>
          <Badge tone="neutral" label="Pro" />
        </Pressable>
      )}
      <Text style={[styles.hint, { color: colors.muted }]}>
        {canScan ? t('fuel.scan.hint') : t('fuel.scan.proOnly')}
      </Text>
      {!preparing && !review && error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : null}

      <SheetModal
        visible={preparing}
        title={t('fuel.scan.prepareTitle')}
        subtitle={t('fuel.scan.prepareLead')}
        onClose={() => {
          if (!analyzing) closePrepare();
        }}
        footer={
          <>
            <AppButton
              label={t('fuel.scan.prepareSubmit')}
              loading={analyzing}
              disabled={!canEstimate}
              onPress={() => void onEstimate()}
            />
            <AppButton variant="secondary" label={t('fuel.scan.cancel')} disabled={analyzing} onPress={closePrepare} />
          </>
        }
      >
        <Text style={[styles.label, { color: colors.ink }]}>{t('fuel.scan.prepareLabel')}</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>{t('fuel.scan.prepareOptional')}</Text>
        <TextInput
          multiline
          maxLength={240}
          value={note}
          onChangeText={setNote}
          placeholder={t('fuel.scan.preparePlaceholder')}
          placeholderTextColor={colors.muted}
          style={[inputStyle, styles.textarea]}
        />

        <Text style={[styles.label, { color: colors.ink }]}>{t('fuel.scan.preparePhotos')}</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>{t('fuel.scan.preparePhotosHint')}</Text>
        {photos.length > 0 ? (
          <View style={styles.thumbs}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.thumbWrap}>
                <Image source={{ uri: photo.uri }} style={[styles.thumb, { borderColor: colors.line }]} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('fuel.scan.removePhoto')}
                  disabled={analyzing}
                  onPress={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))}
                  style={styles.thumbRemove}
                >
                  <AppIcon name="close" color="#ffffff" size={14} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        {photos.length < MAX_PHOTOS ? (
          <View style={styles.row}>
            {sourceButton('camera-outline', t('fuel.scan.prepareCamera'), () => void pickFromCamera())}
            {sourceButton('images-outline', t('fuel.scan.prepareGallery'), () => void pickFromGallery())}
          </View>
        ) : (
          <Text style={[styles.hint, { color: colors.muted }]}>
            {t('fuel.scan.prepareCount', { count: photos.length })}
          </Text>
        )}
        {analyzing ? (
          <View style={styles.analyzing}>
            <ActivityIndicator color={colors.brand} />
            <Text style={[styles.hint, { color: colors.muted }]}>{t('fuel.scan.analyzing')}</Text>
          </View>
        ) : null}
        <Text style={[styles.hint, { color: colors.muted }]}>{t('fuel.scan.privacy')}</Text>
        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      </SheetModal>

      <SheetModal
        visible={review !== null}
        title={t('fuel.scan.reviewTitle')}
        subtitle={t('fuel.scan.reviewHint')}
        onClose={() => {
          if (!createMeal.isPending) setReview(null);
        }}
        footer={
          <>
            <AppButton label={t('fuel.scan.add')} loading={createMeal.isPending} onPress={() => void onConfirm()} />
            <AppButton
              variant="secondary"
              label={t('fuel.scan.cancel')}
              disabled={createMeal.isPending}
              onPress={() => setReview(null)}
            />
          </>
        }
      >
        {review ? (
          <>
            <MealKindPicker value={review.kind} pro onChange={(kind) => setReview({ ...review, kind })} />
            <Text style={[styles.label, { color: colors.ink }]}>{t('fuel.mealTitle')}</Text>
            <TextInput
              value={review.mealName}
              onChangeText={(mealName) => setReview({ ...review, mealName })}
              style={inputStyle}
            />
            <Text style={[styles.label, { color: colors.ink }]}>{t('fuel.mealCalories')}</Text>
            <TextInput
              keyboardType="number-pad"
              value={review.totalCalories}
              onChangeText={(totalCalories) => setReview({ ...review, totalCalories })}
              style={inputStyle}
            />
            {macrosEnabled
              ? (['protein', 'fat', 'carbs'] as const).map((key) => (
                  <View key={key} style={styles.field}>
                    <Text style={[styles.label, { color: colors.ink }]}>{t(`fuel.macros.${key}`)}</Text>
                    <TextInput
                      keyboardType="decimal-pad"
                      value={review.macros[key]}
                      onChangeText={(next) => setReview({ ...review, macros: { ...review.macros, [key]: next } })}
                      placeholder={t('fuel.macros.gramsShort')}
                      placeholderTextColor={colors.muted}
                      style={inputStyle}
                    />
                  </View>
                ))
              : null}
            {macrosEnabled ? <Text style={[styles.hint, { color: colors.muted }]}>{t('fuel.macros.scanHint')}</Text> : null}
            <Text style={[styles.hint, { color: colors.muted }]}>{t('fuel.scan.privacy')}</Text>
            {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          </>
        ) : null}
      </SheetModal>
    </View>
  );
}


const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
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
  disabled: { opacity: 0.5 },
  hint: { fontSize: 12, lineHeight: 17 },
  error: { fontSize: 14 },
  label: { fontSize: 14, fontWeight: '600' },
  field: { gap: 6 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  thumbs: { flexDirection: 'row', gap: 8 },
  thumbWrap: { flex: 1, maxWidth: '33%' },
  thumb: { aspectRatio: 1, borderRadius: 12, borderWidth: 1, width: '100%' },
  thumbRemove: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,17,13,0.7)',
    borderRadius: 999,
    height: 26,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    top: 4,
    width: 26,
  },
  analyzing: { alignItems: 'center', flexDirection: 'row', gap: 8 },
});
