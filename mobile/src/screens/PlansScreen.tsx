import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { SectionScrollView } from '../components/SectionScrollView';
import { AppButton, ChoiceChip } from '../components/ui';
import { fonts } from '../config/fonts';
import { mapAuthError } from '../features/auth/mapAuthError';
import { useAuth } from '../features/auth/useAuth';
import {
  PRIVACY_URL,
  TERMS_URL,
  buyStoreOffer,
  deviceStore,
  inAppPurchasesEnabled,
  isStoreError,
  loadStoreOffers,
  openStoreSubscriptions,
  restoreStorePurchases,
  storeTextSuffix,
  type StoreInterval,
  type StoreOffer,
  type StorePlanId,
} from '../features/billing/purchases';
import { useTheme } from '../features/theme/useTheme';
import type { User } from '../types/auth';

const PLANS: StorePlanId[] = ['plus', 'pro'];

/** In-app plans (App Store / Google Play): prices from the store, buy, restore, manage, legal links. */
export function PlansScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [interval, setPeriod] = useState<StoreInterval>('year');
  const [offers, setOffers] = useState<StoreOffer[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState<StorePlanId | 'restore' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadFailed(false);
    setOffers(null);
    try {
      setOffers(await loadStoreOffers());
    } catch {
      setLoadFailed(true);
      setOffers([]);
    }
  }, []);

  useEffect(() => {
    if (inAppPurchasesEnabled) void load();
  }, [load]);

  const applyUser = async (next: User) => {
    queryClient.setQueryData(['auth', 'me'], next);
    await queryClient.invalidateQueries({ queryKey: ['billing'] });
  };

  const errorText = (caught: unknown) =>
    isStoreError(caught) ? t('iap.failed') : mapAuthError(caught, t);

  const buy = async (offer: StoreOffer) => {
    if (!user) return;
    setError(null);
    setNotice(null);
    setBusy(offer.plan);
    try {
      const outcome = await buyStoreOffer(user.id, offer);
      if (outcome.status === 'done') {
        await applyUser(outcome.user);
        setNotice(t('iap.done', { plan: t(`iap.${offer.plan}.name`) }));
      }
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    if (!user) return;
    setError(null);
    setNotice(null);
    setBusy('restore');
    try {
      const next = await restoreStorePurchases(user.id);
      await applyUser(next);
      setNotice(next.planSource === deviceStore ? t('iap.restored') : t(`iap.nothingToRestore${storeTextSuffix}`));
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(null);
    }
  };

  const currentPlan = user?.plan === 'PRO' ? 'pro' : user?.plan === 'PLUS' ? 'plus' : null;
  const fromStore = user?.planSource === deviceStore;
  // Bought on the website, in the other store, or a beta / admin account: nothing to buy here.
  const managedElsewhere = Boolean(currentPlan && !fromStore);
  const otherStore = user?.planSource === 'app_store' || user?.planSource === 'play_store';
  const currentInterval = user?.planInterval === 'YEAR' ? 'year' : 'month';

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SectionScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={[styles.lead, { color: colors.muted }]}>{t('iap.lead')}</Text>

        {notice ? <Text style={[styles.notice, { color: colors.brand }]}>{notice}</Text> : null}
        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        {!inAppPurchasesEnabled ? (
          <Text style={[styles.lead, { color: colors.muted }]}>{t('iap.unavailable')}</Text>
        ) : managedElsewhere ? (
          <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>
              {t(`iap.${currentPlan ?? 'pro'}.name`)}
            </Text>
            <Text style={[styles.body, { color: colors.muted }]}>
              {otherStore
                ? t(user?.planSource === 'play_store' ? 'iap.storeManagedPlay' : 'iap.storeManaged')
                : t('iap.webManaged')}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.row}>
              <ChoiceChip label={t('iap.month')} selected={interval === 'month'} onPress={() => setPeriod('month')} />
              <ChoiceChip label={t('iap.year')} selected={interval === 'year'} onPress={() => setPeriod('year')} />
            </View>

            {offers === null ? (
              <ActivityIndicator color={colors.brand} style={styles.loader} />
            ) : loadFailed || offers.length === 0 ? (
              <View style={styles.block}>
                <Text style={[styles.error, { color: colors.danger }]}>{t('iap.loadFailed')}</Text>
                <AppButton variant="secondary" label={t('iap.retry')} onPress={() => void load()} />
              </View>
            ) : (
              PLANS.map((plan) => {
                const offer = offers.find((item) => item.plan === plan && item.interval === interval);
                const isCurrent = fromStore && currentPlan === plan && currentInterval === interval;
                const features = t(`iap.${plan}.features`, { returnObjects: true }) as unknown;
                return (
                  <View
                    key={plan}
                    style={[
                      styles.card,
                      { backgroundColor: colors.panel, borderColor: plan === 'pro' ? colors.brand : colors.line },
                    ]}
                  >
                    <Text style={[styles.cardTitle, { color: colors.ink }]}>{t(`iap.${plan}.name`)}</Text>
                    <Text style={[styles.body, { color: colors.muted }]}>{t(`iap.${plan}.tagline`)}</Text>
                    {Array.isArray(features)
                      ? features.map((line) => (
                          <Text key={String(line)} style={[styles.body, { color: colors.ink }]}>
                            • {String(line)}
                          </Text>
                        ))
                      : null}
                    {offer ? (
                      <Text style={[styles.price, { color: colors.ink }]}>
                        {t(interval === 'year' ? 'iap.perYear' : 'iap.perMonth', { price: offer.priceString })}
                      </Text>
                    ) : null}
                    {isCurrent ? (
                      <Text style={[styles.notice, { color: colors.brand }]}>{t('iap.current')}</Text>
                    ) : offer ? (
                      <AppButton
                        label={
                          fromStore && currentPlan
                            ? t('iap.switchTo', { plan: t(`iap.${plan}.name`) })
                            : t('iap.subscribe')
                        }
                        loading={busy === plan}
                        disabled={busy !== null}
                        onPress={() => void buy(offer)}
                      />
                    ) : null}
                  </View>
                );
              })
            )}

            {fromStore ? (
              <AppButton
                variant="secondary"
                label={t('iap.manage')}
                disabled={busy !== null}
                onPress={() => void openStoreSubscriptions()}
              />
            ) : null}
            <AppButton
              variant="ghost"
              label={t('iap.restore')}
              loading={busy === 'restore'}
              disabled={busy !== null}
              onPress={() => void restore()}
            />

            <Text style={[styles.legal, { color: colors.muted }]}>{t(`iap.legal${storeTextSuffix}`)}</Text>
          </>
        )}

        <View style={styles.links}>
          <Text
            accessibilityRole="link"
            style={[styles.link, { color: colors.brand }]}
            onPress={() => void Linking.openURL(TERMS_URL)}
          >
            {t(`iap.terms${storeTextSuffix}`)}
          </Text>
          <Text
            accessibilityRole="link"
            style={[styles.link, { color: colors.brand }]}
            onPress={() => void Linking.openURL(PRIVACY_URL)}
          >
            {t('iap.privacy')}
          </Text>
        </View>
      </SectionScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 14, padding: 16, paddingBottom: 48 },
  lead: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  loader: { marginVertical: 24 },
  block: { gap: 10 },
  card: { borderRadius: 16, borderWidth: 1, gap: 8, padding: 16 },
  cardTitle: { fontFamily: fonts.display, fontSize: 24 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  price: { fontFamily: fonts.bold, fontSize: 18, marginTop: 4 },
  notice: { fontFamily: fonts.semibold, fontSize: 14 },
  error: { fontFamily: fonts.regular, fontSize: 14 },
  legal: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  link: { fontFamily: fonts.semibold, fontSize: 14 },
});
