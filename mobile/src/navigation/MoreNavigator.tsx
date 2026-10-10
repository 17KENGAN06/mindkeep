// Comes with the navigators (one shared copy); not a separate dependency on purpose.
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, BackHandler, Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { AmbientGlow } from '../components/AmbientGlow';
import { AppIcon } from '../components/AppIcon';
import { GlassBackground } from '../components/GlassBackground';
import { SectionScrollContext } from '../components/SectionScrollView';
import { returnHome } from './openSection';
import { HeaderBackButton } from '../components/HeaderBackButton';
import { NotificationBell } from '../features/notifications/NotificationBell';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { RhythmScreen } from '../screens/RhythmScreen';
import { NoteDetailScreen } from '../screens/notes/NoteDetailScreen';
import { NoteEditorScreen } from '../screens/notes/NoteEditorScreen';
import { NotesScreen } from '../screens/notes/NotesScreen';
import { FinanceScreen } from '../screens/finance/FinanceScreen';
import { ContactScreen } from '../screens/contact/ContactScreen';
import { AccountScreen } from '../screens/auth/AccountScreen';
import { GuideScreen } from '../screens/guide/GuideScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { StatisticsScreen } from '../screens/statistics/StatisticsScreen';
import { AdminScreen } from '../screens/admin/AdminScreen';
import { AdminUserScreen } from '../screens/admin/AdminUserScreen';
import { FuelScreen } from '../screens/FuelScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { MonthPlanScreen } from '../screens/tasks/MonthPlanScreen';
import { ForestScreen } from '../screens/tasks/ForestScreen';
import { CategoriesScreen } from '../screens/review/CategoriesScreen';
import { MaterialFormScreen } from '../screens/review/MaterialFormScreen';
import { MaterialDetailScreen } from '../screens/review/MaterialDetailScreen';
import { MaterialsScreen } from '../screens/review/MaterialsScreen';
import { ReviewCalendarScreen } from '../screens/review/ReviewCalendarScreen';
import { ReviewInboxScreen } from '../screens/review/ReviewInboxScreen';
import type { MoreStackParamList } from './types';
import { fonts } from '../config/fonts';

const Stack = createNativeStackNavigator<MoreStackParamList>();

/**
 * A section opened from Home sits alone at the bottom of this stack (openSectionFromHome);
 * its back arrow then returns Home instead of to the hub.
 */
function openedFromHome(
  navigation: { getState: () => { routes: { key: string }[] } },
  routeKey: string,
  routeName: keyof MoreStackParamList,
): boolean {
  return routeName !== 'MoreHome' && navigation.getState().routes[0]?.key === routeKey;
}

/** iOS 26+ softens content scrolling under a transparent header by itself ("liquid glass"). */
const IOS_SCROLL_EDGE =
  Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;

/**
 * Every section screen: the site's soft light runs the full height, under the transparent
 * header too. On iOS the content scrolls under the header (each screen's scroll view uses
 * contentInsetAdjustmentBehavior="automatic"); Android starts the screen below it.
 */
function SectionLayout({
  children,
  headerShown,
  onBackHome,
}: {
  children: ReactNode;
  headerShown: boolean;
  /** Set when the section was opened from Home: Android's back button returns there too. */
  onBackHome?: () => void;
}) {
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const android = headerShown && Platform.OS === 'android';
  // Android: once the screen's SectionScrollView mounts, content runs under the header and a
  // frosted strip fades in behind it as the page scrolls (like iOS). Until then (or for a
  // screen without one) the screen simply starts below the header, as before.
  const [scrollUnder, setScrollUnder] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const blurTarget = useRef<View>(null);
  const sectionScroll = useMemo(
    () => ({
      // A little less than the full header: the section's own big title sits closer to the bar.
      topInset: android ? Math.max(headerHeight - 14, 0) : 0,
      reportScroll: (y: number) => scrollY.setValue(y),
      register: () => {
        setScrollUnder(true);
        return () => setScrollUnder(false);
      },
    }),
    [android, headerHeight, scrollY],
  );
  const offset = android && !scrollUnder ? headerHeight : 0;

  useFocusEffect(
    useCallback(() => {
      if (!onBackHome) return undefined;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        onBackHome();
        return true;
      });
      return () => subscription.remove();
    }, [onBackHome]),
  );

  return (
    <SectionScrollContext.Provider value={sectionScroll}>
      <View style={[styles.fill, { backgroundColor: colors.bg }]}>
        <BlurTargetView ref={blurTarget} style={styles.fill}>
          <AmbientGlow />
          <View style={[styles.fill, { paddingTop: offset }]}>{children}</View>
        </BlurTargetView>
        {android && scrollUnder ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.headerGlass,
              {
                height: headerHeight,
                opacity: scrollY.interpolate({
                  inputRange: [0, 16],
                  outputRange: [0, 1],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            <GlassBackground target={blurTarget} />
          </Animated.View>
        ) : null}
      </View>
    </SectionScrollContext.Provider>
  );
}

export function MoreNavigator() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();

  return (
    <Stack.Navigator
      screenLayout={({ children, options, navigation, route }) => (
        <SectionLayout
          headerShown={options.headerShown !== false}
          onBackHome={
            openedFromHome(navigation, route.key, route.name)
              ? () => returnHome(navigation)
              : undefined
          }
        >
          {children}
        </SectionLayout>
      )}
      screenOptions={({ navigation, route }) => {
        const fromHome = openedFromHome(navigation, route.key, route.name);
        return {
          // Transparent header: no dark band; the page's light shows behind the back button and title.
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          // Older iOS has no scroll-edge softening: give the bar its own frosted glass instead.
          ...(Platform.OS === 'ios' && !IOS_SCROLL_EDGE
            ? {
                headerBlurEffect:
                  theme === 'dark'
                    ? ('systemChromeMaterialDark' as const)
                    : ('systemChromeMaterialLight' as const),
              }
            : {}),
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
          // iOS wraps custom header buttons in its own glass capsule (a button inside a button),
          // so iPhone keeps the native back button, or a bare chevron when it must go Home;
          // Android gets the site-style button.
          ...(Platform.OS === 'ios'
            ? {
                headerBackButtonDisplayMode: 'minimal' as const,
                ...(fromHome
                  ? {
                      headerLeft: () => (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t('common.back')}
                          hitSlop={10}
                          onPress={() => returnHome(navigation)}
                          style={styles.iosBack}
                        >
                          <AppIcon name="chevron-back" color={colors.ink} size={24} />
                        </Pressable>
                      ),
                    }
                  : {}),
              }
            : {
                headerBackVisible: false,
                headerLeft: () =>
                  fromHome ? (
                    <HeaderBackButton onPress={() => returnHome(navigation)} />
                  ) : navigation.canGoBack() ? (
                    <HeaderBackButton onPress={() => navigation.goBack()} />
                  ) : null,
              }),
          // The bell from Home in every section header (not on the notifications page itself):
          // the header's right side is otherwise empty, and what is waiting is one tap away.
          ...(route.name === 'Notifications'
            ? {}
            : {
                headerRight: () => (
                  <NotificationBell
                    appearance={Platform.OS === 'ios' ? 'bare' : 'header'}
                    onOpen={(target) =>
                      'params' in target
                        ? navigation.navigate(target.screen, target.params)
                        : navigation.navigate(target.screen)
                    }
                  />
                ),
              }),
        };
      }}
    >
      <Stack.Screen name="MoreHome" component={MoreScreen} options={{ headerShown: false }} />
      {/* Section home screens keep their own big title; the header only carries the back button. */}
      <Stack.Screen name="TasksHome" component={TasksScreen} options={{ title: '' }} />
      <Stack.Screen
        name="MonthPlan"
        component={MonthPlanScreen}
        options={{ title: t('tasks.planTitle') }}
      />
      <Stack.Screen
        name="Forest"
        component={ForestScreen}
        options={{ title: t('forest.pageTitle') }}
      />
      <Stack.Screen name="ReviewInbox" component={ReviewInboxScreen} options={{ title: '' }} />
      <Stack.Screen
        name="ReviewCalendar"
        component={ReviewCalendarScreen}
        options={{ title: t('calendar.title') }}
      />
      <Stack.Screen
        name="Materials"
        component={MaterialsScreen}
        options={{ title: t('materials.title') }}
      />
      <Stack.Screen
        name="MaterialCreate"
        component={MaterialFormScreen}
        options={{ title: t('materials.createTitle') }}
      />
      <Stack.Screen
        name="MaterialEdit"
        component={MaterialFormScreen}
        options={{ title: t('materials.editTitle') }}
      />
      <Stack.Screen
        name="MaterialDetail"
        component={MaterialDetailScreen}
        options={{ title: t('materials.detailTitle') }}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: t('categories.title') }}
      />
      <Stack.Screen name="Fuel" component={FuelScreen} options={{ title: '' }} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('settings.title') }}
      />
      <Stack.Screen name="Rhythm" component={RhythmScreen} options={{ title: t('rhythm.title') }} />
      <Stack.Screen name="Notes" component={NotesScreen} options={{ title: t('notes.title') }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: t('notifications.title') }}
      />
      <Stack.Screen
        name="Finance"
        component={FinanceScreen}
        options={{ title: t('finance.title') }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{ title: t('contact.title') }}
      />
      <Stack.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: t('auth.accountTitle') }}
      />
      <Stack.Screen name="Guide" component={GuideScreen} options={{ title: t('common.guide') }} />
      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ title: t('statistics.title') }}
      />
      <Stack.Screen name="Admin" component={AdminScreen} options={{ title: t('admin.title') }} />
      <Stack.Screen
        name="AdminUser"
        component={AdminUserScreen}
        options={{ title: t('admin.openStats') }}
      />
      <Stack.Screen
        name="NoteCreate"
        component={NoteEditorScreen}
        options={{ title: t('notes.createTitle') }}
      />
      <Stack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{ title: t('notes.title') }}
      />
      <Stack.Screen
        name="NoteEdit"
        component={NoteEditorScreen}
        options={{ title: t('notes.editTitle') }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerGlass: { left: 0, position: 'absolute', right: 0, top: 0 },
  iosBack: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
});
