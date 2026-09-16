import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import { MonthPlanScreen } from '../screens/tasks/MonthPlanScreen';
import { ForestScreen } from '../screens/tasks/ForestScreen';
import { TasksScreen } from '../screens/TasksScreen';
import type { TasksStackParamList } from './types';

const Stack = createNativeStackNavigator<TasksStackParamList>();

export function TasksNavigator() {
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
      <Stack.Screen name="TasksHome" component={TasksScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MonthPlan" component={MonthPlanScreen} options={{ title: t('tasks.planTitle') }} />
      <Stack.Screen name="Forest" component={ForestScreen} options={{ title: t('forest.pageTitle') }} />
    </Stack.Navigator>
  );
}
