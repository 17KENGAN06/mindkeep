import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import { CategoriesScreen } from '../screens/review/CategoriesScreen';
import { MaterialFormScreen } from '../screens/review/MaterialFormScreen';
import { MaterialDetailScreen } from '../screens/review/MaterialDetailScreen';
import { MaterialsScreen } from '../screens/review/MaterialsScreen';
import { ReviewCalendarScreen } from '../screens/review/ReviewCalendarScreen';
import { ReviewInboxScreen } from '../screens/review/ReviewInboxScreen';
import type { ReviewStackParamList } from './types';

const Stack = createNativeStackNavigator<ReviewStackParamList>();

export function ReviewNavigator() {
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
      <Stack.Screen name="ReviewInbox" component={ReviewInboxScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ReviewCalendar"
        component={ReviewCalendarScreen}
        options={{ title: t('calendar.title') }}
      />
      <Stack.Screen name="Materials" component={MaterialsScreen} options={{ title: t('materials.title') }} />
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
        options={{ title: t('materials.title') }}
      />
      <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: t('categories.title') }} />
    </Stack.Navigator>
  );
}
