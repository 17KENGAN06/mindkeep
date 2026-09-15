import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AnswerReveal } from '../../components/AnswerReveal';
import { AppButton, Badge } from '../../components/ui';
import {
  useArchiveMaterial,
  useDeleteMaterial,
  useMaterial,
} from '../../features/materials/useMaterials';
import type { AppLanguage } from '../../i18n';
import type { ReviewStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { formatDate } from '../../utils/date';

export function MaterialDetailScreen() {
  const { t, i18n } = useTranslation();
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
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (isError || !material) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{t('auth.errors.generic')}</Text>
      </View>
    );
  }

  const hasFlashcard = Boolean(material.question?.trim() && material.answer?.trim());

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.head}>
        <Text style={styles.title}>{material.title}</Text>
        <Badge
          tone={material.status === 'ARCHIVED' ? 'neutral' : 'brand'}
          label={t(`materials.status.${material.status}`)}
        />
      </View>
      <Text style={styles.meta}>
        {t('materials.learnedAt')}: {formatDate(material.learnedAt, language)}
      </Text>
      {material.category ? (
        <Text style={styles.meta}>
          {t('materials.fields.category')}: {material.category.name}
        </Text>
      ) : null}

      {hasFlashcard ? (
        <AnswerReveal question={material.question!} answer={material.answer!} />
      ) : null}

      {material.content?.trim() ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>{t('materials.fields.content')}</Text>
          <Text style={styles.body}>{material.content}</Text>
        </View>
      ) : null}

      {material.sourceUrl ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>{t('materials.fields.sourceUrl')}</Text>
          <Text style={styles.link} onPress={() => void Linking.openURL(material.sourceUrl!)}>
            {material.sourceUrl}
          </Text>
        </View>
      ) : null}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>{t('materials.remindersTitle')}</Text>
        <Text style={styles.meta}>{t('materials.remindersSubtitle')}</Text>
        {material.reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderRow}>
            <Text style={styles.reminderText}>
              #{reminder.sequenceNumber} · {t(`materials.intervals.${reminder.intervalType}`)}
            </Text>
            <Text style={styles.meta}>{formatDate(reminder.scheduledAt, language)}</Text>
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
  centered: { alignItems: 'center', backgroundColor: colors.bg, flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  head: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  title: { color: colors.ink, flex: 1, fontSize: 24, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 13 },
  error: { color: colors.danger },
  block: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  blockTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  link: { color: colors.brand, fontSize: 14 },
  reminderRow: { gap: 6, marginTop: 8 },
  reminderText: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
