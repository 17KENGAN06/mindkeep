import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { billingApi, type BillingStatus } from '../../api/billing';
import { AppButton } from '../../components/ui';
import { mapAuthError } from '../auth/mapAuthError';
import { useAuth } from '../auth/useAuth';
import { useTheme } from '../theme/useTheme';

const USAGE_KEYS = [
  'materials',
  'reviewCategories',
  'habits',
  'notes',
  'tasks',
  'financeOperations',
  'financeCategories',
  'sessions',
] as const;

async function refreshPlan(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  await queryClient.invalidateQueries({ queryKey: ['billing'] });
}

export function BillingCard() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'month' | 'year' | 'portal' | null>(null);

  const statusQuery = useQuery({
    queryKey: ['billing', 'status'],
    queryFn: () => billingApi.status(),
  });

  const openCheckout = async (interval: 'month' | 'year') => {
    setError(null);
    setNotice(null);
    setBusy(interval);
    try {
      const result = await billingApi.checkout(interval);
      await WebBrowser.openBrowserAsync(result.url);
      await refreshPlan(queryClient);
      setNotice(t('billing.success'));
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(null);
    }
  };

  const openPortal = async () => {
    setError(null);
    setNotice(null);
    setBusy('portal');
    try {
      const result = await billingApi.portal();
      await WebBrowser.openBrowserAsync(result.url);
      await refreshPlan(queryClient);
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(null);
    }
  };

  const status = statusQuery.data;
  const billed = Boolean(status?.hasStripeCustomer);
  const subscribed = Boolean(status?.subscribed);
  const isAdmin = user?.role === 'ADMIN';
  const isBeta = Boolean((user?.betaTester || status?.betaTester) && !isAdmin);
  const isPro = status?.plan === 'PRO' || status?.plan === 'PLUS';
  const showSubscribe = Boolean(status?.configured && !subscribed && !isBeta);
  const showManage = Boolean(status?.configured && billed);
  const expires = status?.planExpiresAt
    ? new Date(status.planExpiresAt).toLocaleDateString(i18n.language, { dateStyle: 'medium' })
    : null;

  const planName = isAdmin
    ? t('billing.adminUnlimited')
    : subscribed
      ? t('billing.proLabel')
      : isBeta
        ? t('billing.betaLabel')
        : t('billing.freeLabel');
  const planCaption =
    subscribed && expires
      ? t(status?.cancelAtPeriodEnd ? 'billing.ends' : 'billing.renews', { date: expires })
      : isBeta
        ? t('billing.betaHint')
        : isAdmin
          ? t('billing.adminHint')
          : t('billing.subtitle');

  return (
    <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.brand }]}>
      <View style={styles.head}>
        <View style={styles.headCopy}>
          <Text style={[styles.kicker, { color: colors.brand }]}>{t('billing.title')}</Text>
          {showSubscribe ? (
            <>
              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: colors.ink }]}>{t('home.pricing.yearPerMonth')}</Text>
                <Text style={[styles.per, { color: colors.muted }]}>{t('home.pricing.perMonth')}</Text>
              </View>
              <Text style={[styles.accent, { color: colors.brand }]}>{t('home.pricing.onlyIfYearly')}</Text>
              <Text style={[styles.caption, { color: colors.muted }]}>{t('home.pricing.yearCharged')}</Text>
            </>
          ) : (
            <Text style={[styles.price, { color: colors.ink }]}>{status ? planName : '…'}</Text>
          )}
          <Text style={[styles.caption, { color: colors.muted }]}>{planCaption}</Text>
        </View>
        {status ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: isPro ? colors.brand : `${colors.muted}29` },
            ]}
          >
            <Text style={[styles.badgeText, { color: isPro ? colors.onBrand : colors.ink }]}>
              {planName}
            </Text>
          </View>
        ) : null}
      </View>

      {notice ? <Text style={[styles.notice, { color: colors.brand }]}>{notice}</Text> : null}
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      {statusQuery.isError ? (
        <Text style={[styles.error, { color: colors.danger }]}>{t('auth.errors.generic')}</Text>
      ) : null}
      {status?.cancelAtPeriodEnd ? (
        <Text style={[styles.caption, { color: colors.ink }]}>{t('billing.cancelScheduled')}</Text>
      ) : null}
      {status && !status.configured ? (
        <Text style={[styles.caption, { color: colors.muted }]}>{t('billing.unavailable')}</Text>
      ) : null}

      {showSubscribe ? (
        <View style={styles.plans}>
          <View style={[styles.plan, { borderColor: colors.brand, backgroundColor: `${colors.brand}14` }]}>
            <View style={styles.planHead}>
              <Text style={[styles.planLabel, { color: colors.brand }]}>{t('billing.yearCard')}</Text>
              <Text style={[styles.rec, { color: colors.onBrand, backgroundColor: colors.brand }]}>
                {t('home.pricing.recommended')}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.planPrice, { color: colors.ink }]}>{t('home.pricing.yearPerMonth')}</Text>
              <Text style={[styles.per, { color: colors.muted }]}>{t('home.pricing.perMonth')}</Text>
            </View>
            <Text style={[styles.accent, { color: colors.brand }]}>{t('home.pricing.onlyIfYearly')}</Text>
            <Text style={[styles.hint, { color: colors.muted }]}>{t('home.pricing.yearCharged')}</Text>
            <AppButton
              label={t('billing.ctaYear')}
              loading={busy === 'year'}
              disabled={busy !== null}
              onPress={() => void openCheckout('year')}
            />
          </View>
          <View style={[styles.plan, { borderColor: colors.line }]}>
            <Text style={[styles.planLabel, { color: colors.muted }]}>{t('home.pricing.orMonthly')}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.planPrice, { color: colors.ink }]}>{t('home.pricing.monthPrice')}</Text>
              <Text style={[styles.per, { color: colors.muted }]}>{t('home.pricing.perMonth')}</Text>
            </View>
            <Text style={[styles.hint, { color: colors.muted }]}>{t('home.pricing.monthBilled')}</Text>
            <AppButton
              label={t('billing.ctaMonth')}
              variant="secondary"
              loading={busy === 'month'}
              disabled={busy !== null}
              onPress={() => void openCheckout('month')}
            />
          </View>
        </View>
      ) : null}

      {showSubscribe ? (
        <Text style={[styles.hint, { color: colors.muted }]}>{t('billing.paidInBrowser')}</Text>
      ) : null}

      {showManage ? (
        <AppButton
          label={t('billing.manage')}
          variant="secondary"
          loading={busy === 'portal'}
          disabled={busy !== null}
          onPress={() => void openPortal()}
        />
      ) : null}

      {status && subscribed ? (
        <Text style={[styles.notice, { color: colors.ink }]}>{t('billing.proUnlocked')}</Text>
      ) : null}

      {status && !subscribed && !isBeta ? <UsageGrid usage={status.usage} /> : null}
    </View>
  );
}

function usagePercent(used: number, limit: number | null): number {
  if (limit == null || limit <= 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

function UsageGrid({ usage }: { usage: BillingStatus['usage'] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.usage, { backgroundColor: `${colors.brand}12` }]}>
      <Text style={[styles.usageTitle, { color: colors.ink }]}>{t('billing.usageTitle')}</Text>
      <Text style={[styles.hint, { color: colors.muted }]}>{t('billing.usageLead')}</Text>
      {USAGE_KEYS.map((key) => {
        const item = usage[key];
        const limit = item.limit;
        const unlimited = limit == null;
        const percent = usagePercent(item.used, limit);
        const full = limit != null && item.used >= limit;
        return (
          <View key={key} style={styles.usageRow}>
            <View style={styles.usageHead}>
              <Text style={[styles.usageLabel, { color: colors.ink }]}>{t(`billing.features.${key}`)}</Text>
              <Text style={[styles.usageCount, { color: full ? colors.danger : colors.brand }]}>
                {unlimited || limit == null
                  ? t('billing.unlimited')
                  : t('billing.of', { used: item.used, limit })}
              </Text>
            </View>
            <View style={[styles.bar, { backgroundColor: colors.line }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${unlimited ? 100 : percent}%`,
                    backgroundColor: full ? colors.danger : colors.brand,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
      <Text style={[styles.hint, { color: colors.ink }]}>{t('billing.mealsHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 28,
    padding: 16,
    gap: 12,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  headCopy: { flex: 1, gap: 6 },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 32, fontWeight: '700' },
  planPrice: { fontSize: 26, fontWeight: '700' },
  per: { fontSize: 13, marginBottom: 4 },
  accent: { fontSize: 14, fontWeight: '700' },
  caption: { fontSize: 14, lineHeight: 20 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 13, fontWeight: '800' },
  notice: { fontSize: 14, fontWeight: '600' },
  error: { fontSize: 14 },
  plans: { gap: 12 },
  plan: { borderRadius: 18, borderWidth: 1, gap: 10, padding: 14 },
  planHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  planLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  rec: { borderRadius: 999, fontSize: 10, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3 },
  hint: { fontSize: 13, lineHeight: 18 },
  usage: { borderRadius: 18, gap: 10, padding: 14 },
  usageTitle: { fontSize: 16, fontWeight: '700' },
  usageRow: { gap: 6 },
  usageHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  usageLabel: { flex: 1, fontSize: 14 },
  usageCount: { fontSize: 13, fontWeight: '700' },
  bar: { borderRadius: 999, height: 6, overflow: 'hidden' },
  barFill: { height: 6 },
});
