import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';

type PlaceholderScreenProps = {
  titleKey: string;
};

export function PlaceholderScreen({ titleKey }: PlaceholderScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.ink }]}>{t(titleKey)}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{t('common.comingNext')}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 28, fontWeight: '700' },
  body: { fontSize: 16, marginTop: 12 },
});
