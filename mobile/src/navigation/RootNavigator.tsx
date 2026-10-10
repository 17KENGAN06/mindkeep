import { createBottomTabNavigator, type BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DarkTheme, DefaultTheme, NavigationContainer, useNavigation } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { needsOnboarding } from '../config/appModules';
import { mapAuthError } from '../features/auth/mapAuthError';
import { useAuth } from '../features/auth/useAuth';
import { useUnreadNotificationsCount } from '../features/notifications/useNotifications';
import { useTheme } from '../features/theme/useTheme';
import { BrandMark } from '../components/BrandMark';
import { AppButton } from '../components/ui';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { QuickAddSheet } from '../features/quickAdd/QuickAddSheet';
import { QuickAddContext, type OpenQuickAdd } from '../features/quickAdd/quickAddContext';
import { ReminderPrompt } from '../features/notifications/ReminderPrompt';
import { useLocalReminderSync } from '../features/notifications/useLocalReminders';
import { AmbientGlow } from '../components/AmbientGlow';
import { AppTabBar } from './AppTabBar';
import { isOnHome, openSectionFromHome } from './openSection';
import { MoreNavigator } from './MoreNavigator';
import type { AppTabParamList, AuthStackParamList } from './types';
import { fonts } from '../config/fonts';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<AppTabParamList>();

/** The Add tab never shows a screen: its button opens the quick-add sheet. */
function EmptyScreen() {
  return null;
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome">
        {(props) => (
          <WelcomeScreen
            onStart={() => props.navigation.navigate('Register')}
            onLogin={() => props.navigation.navigate('Login')}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="Login">
        {(props) => (
          <LoginScreen
            onGoRegister={() => props.navigation.navigate('Register')}
            onGoForgot={() => props.navigation.navigate('ForgotPassword')}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="Register">
        {(props) => <RegisterScreen onGoLogin={() => props.navigation.navigate('Login')} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="ForgotPassword">
        {(props) => <ForgotPasswordScreen onGoLogin={() => props.navigation.navigate('Login')} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function AppTabs() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const unreadQuery = useUnreadNotificationsCount();
  const unread = unreadQuery.data ?? 0;
  const badge = unread > 0 ? (unread > 99 ? '99+' : unread) : undefined;
  // null = closed; task = opened from a shortcut that goes straight to the task form.
  const [quickAdd, setQuickAdd] = useState<{ task: boolean } | null>(null);
  const openQuickAdd = useCallback<OpenQuickAdd>(
    (options) => setQuickAdd({ task: Boolean(options?.task) }),
    [],
  );

  return (
    <View style={[styles.tabsRoot, { backgroundColor: colors.bg }]}>
      <AmbientGlow />
      <QuickAddContext.Provider value={openQuickAdd}>
      <Tabs.Navigator
        tabBar={(props) => <AppTabBar {...props} badge={badge} onAdd={() => openQuickAdd()} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="Today" component={TodayScreen} options={{ tabBarLabel: t('tabs.home') }} />
        {/* Never shown: the bar's "+" opens the quick-add sheet instead. */}
        <Tabs.Screen name="Add" component={EmptyScreen} options={{ tabBarLabel: t('tabs.add') }} />
        <Tabs.Screen name="More" component={MoreNavigator} options={{ tabBarLabel: t('tabs.sections') }} />
      </Tabs.Navigator>
      </QuickAddContext.Provider>
      <QuickAddRoot
        open={quickAdd !== null}
        startWithTask={quickAdd?.task ?? false}
        onClose={() => setQuickAdd(null)}
      />
      <RemindersRoot />
    </View>
  );
}

/** Phone reminders: keeps the schedule fresh, opens the tapped section, asks once to turn them on. */
function RemindersRoot() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  // A tapped reminder opens its section on its own, so back leads Home.
  useLocalReminderSync((target) => openSectionFromHome(navigation, target));
  return <ReminderPrompt />;
}

/** Lives inside the tabs so it can navigate into the Sections stack. */
function QuickAddRoot({
  open,
  startWithTask,
  onClose,
}: {
  open: boolean;
  startWithTask: boolean;
  onClose: () => void;
}) {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  return (
    <QuickAddSheet
      visible={open}
      startWithTask={startWithTask}
      onClose={onClose}
      onOpen={(target) => {
        const params = 'params' in target ? target.params : undefined;
        // From Home: back returns Home. From inside Sections: the section opens on top as before.
        if (isOnHome(navigation)) {
          openSectionFromHome(navigation, target.screen, params as never);
        } else {
          navigation.navigate('More', { screen: target.screen, params, initial: false } as never);
        }
      }}
    />
  );
}

export function RootNavigator() {
  const { connectionError, isAuthenticated, isLoading, isRetrying, logout, retrySession, user } = useAuth();
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const navTheme = useMemo(
    () => ({
      ...(theme === 'dark' ? DarkTheme : DefaultTheme),
      colors: {
        ...(theme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
        background: colors.bg,
        card: colors.panel,
        border: colors.line,
        primary: colors.brand,
        text: colors.ink,
      },
    }),
    [colors, theme],
  );

  if (isLoading) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.bg }]}>
        <BrandMark size={72} />
        <ActivityIndicator color={colors.brand} size="large" style={styles.bootSpinner} />
      </View>
    );
  }

  // Stored session could not be checked (offline, timeout, server error): keep it and offer Retry.
  if (connectionError && !isAuthenticated) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.bg }]}>
        <BrandMark size={72} />
        <Text style={[styles.bootMessage, { color: colors.ink }]}>{mapAuthError(connectionError, t)}</Text>
        <View style={styles.bootActions}>
          <AppButton label={t('common.retry')} loading={isRetrying} onPress={() => void retrySession()} />
          <AppButton
            label={t('common.logout')}
            variant="secondary"
            disabled={isRetrying}
            onPress={() => void logout()}
          />
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? (
        needsOnboarding(user) ? <OnboardingScreen /> : <AppTabs />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabsRoot: { flex: 1 },
  boot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  bootSpinner: { marginTop: 4 },
  bootMessage: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, paddingHorizontal: 32, textAlign: 'center' },
  bootActions: { alignSelf: 'stretch', gap: 12, paddingHorizontal: 32 },
});
