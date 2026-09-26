import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import { MoreScreen } from '../screens/MoreScreen';
import { RhythmScreen } from '../screens/RhythmScreen';
import { NoteDetailScreen } from '../screens/notes/NoteDetailScreen';
import { NoteEditorScreen } from '../screens/notes/NoteEditorScreen';
import { NotesScreen } from '../screens/notes/NotesScreen';
import { FinanceScreen } from '../screens/finance/FinanceScreen';
import { ContactScreen } from '../screens/contact/ContactScreen';
import { GuideScreen } from '../screens/guide/GuideScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { StatisticsScreen } from '../screens/statistics/StatisticsScreen';
import { BlogScreen } from '../screens/blog/BlogScreen';
import { BlogArticleScreen } from '../screens/blog/BlogArticleScreen';
import { AdminScreen } from '../screens/admin/AdminScreen';
import { AdminUserScreen } from '../screens/admin/AdminUserScreen';
import type { MoreStackParamList } from './types';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.panel },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="MoreHome" component={MoreScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Rhythm" component={RhythmScreen} options={{ title: t('rhythm.title') }} />
      <Stack.Screen name="Notes" component={NotesScreen} options={{ title: t('notes.title') }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: t('notifications.title') }}
      />
      <Stack.Screen name="Finance" component={FinanceScreen} options={{ title: t('finance.title') }} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ title: t('contact.title') }} />
      <Stack.Screen name="Guide" component={GuideScreen} options={{ title: t('common.guide') }} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} options={{ title: t('statistics.title') }} />
      <Stack.Screen name="Blog" component={BlogScreen} options={{ title: t('blog.title') }} />
      <Stack.Screen name="BlogArticle" component={BlogArticleScreen} options={{ title: t('blog.eyebrow') }} />
      <Stack.Screen name="Admin" component={AdminScreen} options={{ title: t('admin.title') }} />
      <Stack.Screen name="AdminUser" component={AdminUserScreen} options={{ title: t('admin.openStats') }} />
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
