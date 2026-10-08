import { createBottomTabNavigator, type BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DarkTheme, DefaultTheme, NavigationContainer, useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { needsOnboarding } from '../config/appModules';
import { mapAuthError } from '../features/auth/mapAuthError';
import { useAuth } from '../features/auth/useAuth';
import { useUnreadNotificationsCount } from '../features/notifications/useNotifications';
import { useTheme } from '../features/theme/useTheme';
import { AppIcon, type AppIconName } from '../components/AppIcon';
import { BrandMark } from '../components/BrandMark';
import { AppButton } from '../components/ui';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { QuickAddSheet } from '../features/quickAdd/QuickAddSheet';
import { MoreNavigator } from './MoreNavigator';
import type { AppTabParamList, AuthStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<AppTabParamList>();

const TAB_ICONS: Record<'Today' | 'More', { idle: AppIconName; active: AppIconName }> = {
  Today: { idle: 'home-outline', active: 'home' },
  More: { idle: 'grid-outline', active: 'grid' },
};

/** The Add tab never shows a screen: its button opens the quick-add sheet. */
function EmptyScreen() {
  return null;
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
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
  const insets = useSafeAreaInsets();
  const unreadQuery = useUnreadNotificationsCount();
  const unread = unreadQuery.data ?? 0;
  const badge = unread > 0 ? (unread > 99 ? '99+' : unread) : undefined;
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  // Taller bar with bigger icons and labels; the system navigation bar stays below it.
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <>
      <Tabs.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.muted,
          tabBarBadgeStyle: { backgroundColor: colors.danger, color: '#fff' },
          tabBarStyle: {
            backgroundColor: colors.panel,
            borderTopColor: colors.line,
            height: 66 + bottomInset,
            paddingTop: 8,
            paddingBottom: bottomInset,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
          tabBarIcon: ({ color, focused }) => {
            const icons = route.name === 'Add' ? null : TAB_ICONS[route.name];
            return icons ? <AppIcon name={focused ? icons.active : icons.idle} color={color} size={26} /> : null;
          },
        })}
      >
        <Tabs.Screen name="Today" component={TodayScreen} options={{ tabBarLabel: t('tabs.home') }} />
        <Tabs.Screen
          name="Add"
          component={EmptyScreen}
          options={{
            tabBarLabel: t('tabs.add'),
            tabBarAccessibilityLabel: t('quickAdd.title'),
            tabBarButton: (props) => (
              <View style={styles.addSlot}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('quickAdd.title')}
                  onPress={() => setQuickAddOpen(true)}
                  style={({ pressed }) => [
                    styles.addButton,
                    { backgroundColor: colors.brand, borderColor: colors.panel },
                    pressed && styles.addPressed,
                  ]}
                  testID={props.testID}
                >
                  <AppIcon name="add" color={colors.onBrand} size={32} />
                </Pressable>
              </View>
            ),
          }}
          listeners={{
            tabPress: (event) => {
              event.preventDefault();
              setQuickAddOpen(true);
            },
          }}
        />
        <Tabs.Screen name="More" component={MoreNavigator} options={{ tabBarLabel: t('tabs.sections'), tabBarBadge: badge }} />
      </Tabs.Navigator>
      <QuickAddRoot open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  );
}

/** Lives inside the tabs so it can navigate into the Sections stack. */
function QuickAddRoot({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  return (
    <QuickAddSheet
      visible={open}
      onClose={onClose}
      onOpen={(target) =>
        navigation.navigate('More', {
          screen: target.screen,
          params: 'params' in target ? target.params : undefined,
          initial: false,
        } as never)
      }
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
  addSlot: { alignItems: 'center', flex: 1, justifyContent: 'flex-start' },
  addButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 4,
    elevation: 6,
    height: 62,
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    width: 62,
  },
  addPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  boot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  bootSpinner: { marginTop: 4 },
  bootMessage: { fontSize: 16, lineHeight: 22, paddingHorizontal: 32, textAlign: 'center' },
  bootActions: { alignSelf: 'stretch', gap: 12, paddingHorizontal: 32 },
});
