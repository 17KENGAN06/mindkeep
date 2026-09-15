import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MoreScreen } from '../screens/MoreScreen';
import { NoteDetailScreen } from '../screens/notes/NoteDetailScreen';
import { NoteEditorScreen } from '../screens/notes/NoteEditorScreen';
import { NotesScreen } from '../screens/notes/NotesScreen';
import { FinanceScreen } from '../screens/finance/FinanceScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { colors } from '../theme';
import type { MoreStackParamList } from './types';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreNavigator() {
  const { t } = useTranslation();

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
      <Stack.Screen name="Notes" component={NotesScreen} options={{ title: t('notes.title') }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: t('notifications.title') }}
      />
      <Stack.Screen name="Finance" component={FinanceScreen} options={{ title: t('finance.title') }} />
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
