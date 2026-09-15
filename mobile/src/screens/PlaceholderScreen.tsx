import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';

type PlaceholderScreenProps = {
  titleKey: string;
};

export function PlaceholderScreen({ titleKey }: PlaceholderScreenProps) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>{t(titleKey)}</Text>
      <Text style={styles.body}>{t('common.comingNext')}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 16, marginTop: 12 },
});
