import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import { fonts } from '../config/fonts';
import { AmbientGlow } from '../components/AmbientGlow';

type PlaceholderScreenProps = {
  titleKey: string;
};

export function PlaceholderScreen({ titleKey }: PlaceholderScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <AmbientGlow />
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
  title: { fontSize: 24, fontFamily: fonts.display },
  body: { fontFamily: fonts.regular, fontSize: 16, marginTop: 12 },
});
