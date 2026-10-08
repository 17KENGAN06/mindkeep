import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { billingApi, type BillingStatus } from '../../api/billing';
import { AppButton } from '../../components/ui';
import { env } from '../../config/env';
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

const PLANS_URL = 'https://mindkeep.cloud/plans';

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
  const [busy, setBusy] = useState<'portal' | 'cancel' | 'resume' | null>(null);

  const statusQuery = useQuery({
    queryKey: ['billing', 'status'],
    queryFn: () => billingApi.status(),
  });

  // Prices, the paid-access consent and checkout live on the website's plans page (source of truth).
  const openPlans = async () => {
    setError(null);
    setNotice(null);
    await WebBrowser.openBrowserAsync(PLANS_URL);
    await refreshPlan(queryClient);
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

  const cancelSubscription = async () => {
    setError(null);
    setNotice(null);
    setBusy('cancel');
    try {
      await billingApi.cancel();
      await refreshPlan(queryClient);
      setNotice(t('billing.cancelDone'));
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(null);
    }
  };

  const resumeSubscription = async () => {
    setError(null);
    setNotice(null);
    setBusy('resume');
    try {
      await billingApi.resume();
      await refreshPlan(queryClient);
      setNotice(t('billing.resumeDone'));
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
  // Store builds: plan status only, no way out to buying or managing it (see config/env.ts).
  const showPlansLink = !env.storeBuild;
  const showManage = Boolean(!env.storeBuild && status?.configured && billed);
  const expires = status?.planExpiresAt
    ? new Date(status.planExpiresAt).toLocaleDateString(i18n.language, { dateStyle: 'medium' })
    : null;

  const planName = isAdmin
    ? t('billing.adminUnlimited')
    : status?.plan === 'PLUS'
      ? t('billing.plusLabel')
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
          : t(env.storeBuild ? 'billing.store.planLead' : 'billing.subtitle');

  return (
    <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.brand }]}>
      <View style={styles.head}>
        <View style={styles.headCopy}>
          <Text style={[styles.kicker, { color: colors.brand }]}>{t('billing.title')}</Text>
          {showSubscribe ? (
            <>
              <Text style={[styles.price, { color: colors.ink }]}>{t('billing.freeLabel')}</Text>
              <Text style={[styles.caption, { color: colors.muted }]}>{t(env.storeBuild ? 'billing.store.planLead' : 'plans.accountLead')}</Text>
            </>
          ) : (
            <>
              <Text style={[styles.price, { color: colors.ink }]}>{status ? planName : '…'}</Text>
              <Text style={[styles.caption, { color: colors.muted }]}>{planCaption}</Text>
            </>
          )}
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
      {status?.pendingPlan ? (
        <Text style={[styles.caption, { color: colors.ink }]}>
          {t('billing.pendingSwitch', {
            plan: status.pendingPlan === 'PLUS' ? t('billing.plusLabel') : t('billing.proLabel'),
            date: status.pendingChangeAt
              ? new Date(status.pendingChangeAt).toLocaleDateString(i18n.language, { dateStyle: 'medium' })
              : expires ?? t('plans.periodEnd'),
          })}
        </Text>
      ) : null}
      {status && !status.configured ? (
        <Text style={[styles.caption, { color: colors.muted }]}>{t('billing.unavailable')}</Text>
      ) : null}

      {showPlansLink ? (
        <AppButton label={t('plans.viewPlans')} disabled={busy !== null} onPress={() => void openPlans()} />
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

      {/* Cancel / resume like the site's Account page; hidden in store builds with the other payment controls. */}
      {showManage && subscribed && !status?.cancelAtPeriodEnd ? (
        <>
          <AppButton
            variant="ghost"
            label={t('billing.cancelCta')}
            loading={busy === 'cancel'}
            disabled={busy !== null}
            onPress={() =>
              Alert.alert(
                t('billing.cancelTitle'),
                t('billing.cancelConfirm', { date: expires ?? t('plans.periodEnd') }),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('billing.cancelConfirmCta'), style: 'destructive', onPress: () => void cancelSubscription() },
                ],
              )
            }
          />
          <Text style={[styles.hint, { color: colors.muted }]}>{t('billing.cancelHint')}</Text>
        </>
      ) : null}
      {showManage && subscribed && status?.cancelAtPeriodEnd ? (
        <AppButton
          variant="secondary"
          label={t('billing.resumeCta')}
          loading={busy === 'resume'}
          disabled={busy !== null}
          onPress={() => void resumeSubscription()}
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
      <Text style={[styles.hint, { color: colors.muted }]}>{t(env.storeBuild ? 'billing.store.usageLead' : 'billing.usageLead')}</Text>
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
  price: { fontSize: 32, fontWeight: '700' },
  caption: { fontSize: 14, lineHeight: 20 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 13, fontWeight: '800' },
  notice: { fontSize: 14, fontWeight: '600' },
  error: { fontSize: 14 },
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
