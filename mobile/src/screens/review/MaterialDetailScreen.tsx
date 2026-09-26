import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MaterialBody } from '../../components/MaterialBody';
import { SourceLink } from '../../components/SourceLink';
import { AppButton, Badge } from '../../components/ui';
import {
  useArchiveMaterial,
  useDeleteMaterial,
  useMaterial,
} from '../../features/materials/useMaterials';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import type { ReviewStackParamList } from '../../navigation/types';
import { formatDate } from '../../utils/date';

export function MaterialDetailScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const navigation = useNavigation<NativeStackNavigationProp<ReviewStackParamList>>();
  const route = useRoute<RouteProp<ReviewStackParamList, 'MaterialDetail'>>();
  const { data: material, isLoading, isError } = useMaterial(route.params.id);
  const archiveMaterial = useArchiveMaterial();
  const deleteMaterial = useDeleteMaterial();
  const [busy, setBusy] = useState(false);

  const confirmDelete = () => {
    if (!material) return;
    Alert.alert(t('materials.deleteTitle'), t('materials.deleteDescription', { title: material.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void deleteMaterial.mutateAsync(material.id).then(() => navigation.navigate('Materials'));
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (isError || !material) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.danger }}>{t('auth.errors.generic')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: colors.ink }]}>{material.title}</Text>
        <Badge
          tone={material.status === 'ARCHIVED' ? 'neutral' : 'brand'}
          label={t(`materials.status.${material.status}`)}
        />
      </View>
      <Text style={[styles.meta, { color: colors.muted }]}>
        {t('materials.learnedAt')}: {formatDate(material.learnedAt, language)}
      </Text>
      {material.category ? (
        <View style={[styles.labelChip, { backgroundColor: colors.bg, borderColor: colors.line }]}>
          <Text style={[styles.labelKey, { color: colors.muted }]}>{t('materials.fields.category')}</Text>
          <Text style={[styles.labelValue, { color: colors.ink }]}>{material.category.name}</Text>
        </View>
      ) : null}

      {material.content?.trim() ? (
        <View style={[styles.block, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <View style={[styles.sectionHead, { backgroundColor: colors.bg, borderColor: colors.line }]}>
            <Text style={[styles.blockTitle, { color: colors.ink }]}>{t('materials.fields.content')}</Text>
          </View>
          <MaterialBody content={material.content} />
        </View>
      ) : null}

      {material.sourceUrl ? (
        <View style={[styles.block, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={[styles.blockTitle, { color: colors.ink }]}>{t('materials.fields.sourceUrl')}</Text>
          <SourceLink href={material.sourceUrl} />
        </View>
      ) : null}

      <View style={[styles.block, { backgroundColor: colors.panel, borderColor: colors.line }]}>
        <Text style={[styles.blockTitle, { color: colors.ink }]}>{t('materials.remindersTitle')}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>{t('materials.remindersSubtitle')}</Text>
        {material.reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderRow}>
            <Text style={[styles.reminderText, { color: colors.ink }]}>
              #{reminder.sequenceNumber} · {t(`materials.intervals.${reminder.intervalType}`)}
            </Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{formatDate(reminder.scheduledAt, language)}</Text>
            <Badge
              tone={
                reminder.status === 'COMPLETED'
                  ? 'brand'
                  : reminder.status === 'OVERDUE'
                    ? 'danger'
                    : reminder.status === 'SKIPPED'
                      ? 'neutral'
                      : 'warn'
              }
              label={t(`materials.reminderStatus.${reminder.status}`)}
            />
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <AppButton
          variant="secondary"
          label={t('common.edit')}
          onPress={() => navigation.navigate('MaterialEdit', { id: material.id })}
        />
        {material.status !== 'ARCHIVED' ? (
          <AppButton
            variant="secondary"
            label={t('materials.archive')}
            loading={archiveMaterial.isPending || busy}
            onPress={() => {
              setBusy(true);
              void archiveMaterial.mutateAsync(material.id).finally(() => setBusy(false));
            }}
          />
        ) : null}
        <AppButton variant="danger" label={t('common.delete')} onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  head: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  title: { flex: 1, fontSize: 24, fontWeight: '700' },
  meta: { fontSize: 13 },
  labelChip: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  labelKey: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  labelValue: { fontSize: 14, fontWeight: '700' },
  sectionHead: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  block: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  blockTitle: { fontSize: 15, fontWeight: '700' },
  reminderRow: { gap: 6, marginTop: 8 },
  reminderText: { fontSize: 14, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
