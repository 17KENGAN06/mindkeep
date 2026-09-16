import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ForestCard } from '../../components/forest/ForestCard';
import { useForestSummary } from '../../features/tasks/useDailyTasks';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import type { TasksStackParamList } from '../../navigation/types';
import { formatMonthTitle } from '../../utils/date';

export function ForestScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const route = useRoute<RouteProp<TasksStackParamList, 'Forest'>>();
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(route.params?.year ?? now.getFullYear());
  const [month, setMonth] = useState(route.params?.month ?? now.getMonth() + 1);
  const forestQuery = useForestSummary(year, month);

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  };

  if (forestQuery.isLoading && !forestQuery.data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={forestQuery.isRefetching && !forestQuery.isLoading}
          onRefresh={() => void forestQuery.refetch()}
          tintColor={colors.brand}
        />
      }
    >
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('forest.pageSubtitle')}</Text>

      <View style={styles.period}>
        <Pressable onPress={() => shiftMonth(-1)} style={[styles.periodBtn, { borderColor: colors.line }]}>
          <Text style={[styles.periodBtnText, { color: colors.ink }]}>‹</Text>
        </Pressable>
        <Text style={[styles.periodLabel, { color: colors.ink }]}>{formatMonthTitle(year, month, language)}</Text>
        <Pressable onPress={() => shiftMonth(1)} style={[styles.periodBtn, { borderColor: colors.line }]}>
          <Text style={[styles.periodBtnText, { color: colors.ink }]}>›</Text>
        </Pressable>
      </View>

      {forestQuery.isError || !forestQuery.data ? (
        <Text style={[styles.error, { color: colors.danger }]}>{t('auth.errors.generic')}</Text>
      ) : (
        <ForestCard
          totalCompleted={forestQuery.data.totalCompleted}
          completedToday={forestQuery.data.completedToday}
          layout="expanded"
          monthLabel={formatMonthTitle(year, month, language)}
        />
      )}

      <View style={[styles.rules, { backgroundColor: colors.panel, borderColor: colors.line }]}>
        <Text style={[styles.rulesTitle, { color: colors.ink }]}>{t('forest.rulesTitle')}</Text>
        <Text style={[styles.rule, { color: colors.muted }]}>{t('forest.ruleTrees')}</Text>
        <Text style={[styles.rule, { color: colors.muted }]}>{t('forest.ruleGrove')}</Text>
        <Text style={[styles.rule, { color: colors.muted }]}>{t('forest.rulePath')}</Text>
        <Text style={[styles.rule, { color: colors.muted }]}>{t('forest.ruleZone')}</Text>
        <Text style={[styles.rule, { color: colors.muted }]}>{t('forest.ruleMonth')}</Text>
        <Text style={[styles.rule, { color: colors.muted }]}>{t('forest.monthScope')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14 },
  period: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'center' },
  periodBtn: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  periodBtnText: { fontSize: 22, fontWeight: '700' },
  periodLabel: { flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  error: { fontSize: 14 },
  rules: { borderRadius: 20, borderWidth: 1, gap: 8, padding: 14 },
  rulesTitle: { fontSize: 16, fontWeight: '700' },
  rule: { fontSize: 14, lineHeight: 20 },
});
