import * as WebBrowser from 'expo-web-browser';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts } from '../../config/fonts';
import { useTheme } from '../theme/useTheme';
import { nutritionSources, type NutritionSourceId } from './sources';

type NutritionSourcesProps = {
  /** Only these sources (the calculator shows the ones behind its formula). */
  only?: NutritionSourceId[];
};

async function openSource(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    await Linking.openURL(url);
  }
}

/** The list of sources: what each one backs, its title and citation, tap to open. */
export function NutritionSourcesList({ only }: NutritionSourcesProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const list = only ? nutritionSources.filter((source) => only.includes(source.id)) : nutritionSources;

  return (
    <View style={styles.list}>
      {list.map((source) => (
        <Pressable
          key={source.id}
          accessibilityRole="link"
          accessibilityHint={t('fuel.sources.open')}
          onPress={() => void openSource(source.url)}
          style={({ pressed }) => [
            styles.item,
            { backgroundColor: colors.bg, borderColor: colors.line },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.topic, { color: colors.brand }]}>{t(`fuel.sources.topics.${source.id}`)}</Text>
          <Text style={[styles.title, { color: colors.ink }]}>{source.title}</Text>
          <Text style={[styles.citation, { color: colors.muted }]}>{source.citation}</Text>
          <Text style={[styles.link, { color: colors.brand }]} numberOfLines={1}>
            {t('fuel.sources.open')} ↗
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Card at the end of the Nutrition screen: every source behind the section's numbers. */
export function NutritionSourcesCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
      <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('fuel.sources.title')}</Text>
      <Text style={[styles.lead, { color: colors.muted }]}>{t('fuel.sources.lead')}</Text>
      <NutritionSourcesList />
      <Text style={[styles.lead, { color: colors.muted }]}>{t('fuel.sources.notAdvice')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, gap: 10, padding: 14 },
  cardTitle: { fontSize: 16, fontFamily: fonts.bold },
  lead: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  list: { gap: 8 },
  item: { borderRadius: 14, borderWidth: 1, gap: 3, paddingHorizontal: 12, paddingVertical: 10 },
  pressed: { opacity: 0.7 },
  topic: { fontSize: 11, fontFamily: fonts.bold, textTransform: 'uppercase' },
  title: { fontSize: 14, fontFamily: fonts.semibold, lineHeight: 19 },
  citation: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  link: { fontSize: 12, fontFamily: fonts.bold, marginTop: 2 },
});
