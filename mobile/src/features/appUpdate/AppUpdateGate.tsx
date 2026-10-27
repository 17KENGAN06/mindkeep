import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useState, type ReactNode } from 'react';
import { Linking, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { appApi } from '../../api/app';
import { AppButton } from '../../components/ui';
import { fonts } from '../../config/fonts';
import { useTheme } from '../theme/useTheme';

/**
 * This build's store number (Android versionCode / iOS buildNumber), as baked into the app's
 * config at build time. null on web or when unknown: then no prompt is ever shown.
 */
function installedBuild(): number | null {
  const config = Constants.expoConfig;
  const raw =
    Platform.OS === 'android'
      ? config?.android?.versionCode
      : Platform.OS === 'ios'
        ? config?.ios?.buildNumber
        : undefined;
  const build = Number(raw);
  return Number.isInteger(build) && build > 0 ? build : null;
}

const BUILD = installedBuild();

/**
 * Asks the API which store builds are required / newest. Below the required build the app is
 * covered by an "update" screen that cannot be closed; below the newest one a dismissible
 * notice appears. If the check fails (offline, old API), the app just works as before.
 */
export function AppUpdateGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [dismissed, setDismissed] = useState<number | null>(null);
  const { data } = useQuery({
    queryKey: ['app', 'version'],
    queryFn: appApi.version,
    enabled: BUILD !== null,
    staleTime: 30 * 60_000,
    // Checked again whenever the app returns to the foreground.
    refetchOnWindowFocus: 'always',
  });

  const policy = Platform.OS === 'android' ? data?.android : Platform.OS === 'ios' ? data?.ios : undefined;
  const required = BUILD !== null && policy?.minBuild != null && BUILD < policy.minBuild;
  const newer =
    BUILD !== null && policy?.latestBuild != null && BUILD < policy.latestBuild && dismissed !== policy.latestBuild;
  const visible = Boolean(policy) && (required || newer);

  const openStore = () => {
    if (policy) void Linking.openURL(policy.storeUrl);
  };

  return (
    <>
      {children}
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        // The Android back button closes only the optional notice, never the required one.
        onRequestClose={() => {
          if (!required && policy?.latestBuild != null) setDismissed(policy.latestBuild);
        }}
      >
        <View style={[styles.backdrop, { backgroundColor: required ? colors.bg : 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <View style={[styles.badge, { backgroundColor: `${colors.brand}22` }]}>
              <Ionicons name="arrow-up-circle-outline" size={34} color={colors.brand} />
            </View>
            <Text style={[styles.title, { color: colors.ink }]}>
              {required ? t('appUpdate.requiredTitle') : t('appUpdate.availableTitle')}
            </Text>
            <Text style={[styles.body, { color: colors.muted }]}>
              {required ? t('appUpdate.requiredBody') : t('appUpdate.availableBody')}
            </Text>
            <View style={styles.actions}>
              <AppButton label={t('appUpdate.update')} onPress={openStore} />
              {required ? null : (
                <AppButton
                  variant="ghost"
                  label={t('appUpdate.later')}
                  onPress={() => setDismissed(policy?.latestBuild ?? null)}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  card: {
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    maxWidth: 420,
    padding: 24,
    width: '100%',
  },
  badge: { alignItems: 'center', borderRadius: 999, height: 64, justifyContent: 'center', width: 64 },
  title: { fontFamily: fonts.display, fontSize: 22, textAlign: 'center' },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 8, marginTop: 8 },
});
