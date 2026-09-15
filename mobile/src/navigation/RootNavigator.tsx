import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/useAuth';
import { useUnreadNotificationsCount } from '../features/notifications/useNotifications';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { FuelScreen } from '../screens/FuelScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { colors } from '../theme';
import { MoreNavigator } from './MoreNavigator';
import { ReviewNavigator } from './ReviewNavigator';
import type { AppTabParamList, AuthStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<AppTabParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.panel,
    border: colors.line,
    primary: colors.brand,
    text: colors.ink,
  },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">
        {(props) => (
          <LoginScreen onGoRegister={() => props.navigation.navigate('Register')} />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="Register">
        {(props) => <RegisterScreen onGoLogin={() => props.navigation.navigate('Login')} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function AppTabs() {
  const { t } = useTranslation();
  const unreadQuery = useUnreadNotificationsCount();
  const unread = unreadQuery.data ?? 0;
  const badge = unread > 0 ? (unread > 99 ? '99+' : unread) : undefined;

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarBadgeStyle: { backgroundColor: colors.danger, color: '#fff' },
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.line,
        },
      }}
    >
      <Tabs.Screen
        name="Today"
        component={TodayScreen}
        options={{ tabBarLabel: t('tabs.today'), tabBarBadge: badge }}
      />
      <Tabs.Screen name="Review" component={ReviewNavigator} options={{ tabBarLabel: t('tabs.review') }} />
      <Tabs.Screen name="Tasks" component={TasksScreen} options={{ tabBarLabel: t('tabs.tasks') }} />
      <Tabs.Screen name="Fuel" component={FuelScreen} options={{ tabBarLabel: t('tabs.fuel') }} />
      <Tabs.Screen
        name="More"
        component={MoreNavigator}
        options={{ tabBarLabel: t('tabs.more'), tabBarBadge: badge }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <AppTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
  },
});
