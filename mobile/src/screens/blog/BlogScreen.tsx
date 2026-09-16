import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { blogArticles, blogTopics } from '../../content/blog/articles';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import type { MoreStackParamList } from '../../navigation/types';
import { formatDate } from '../../utils/date';

export function BlogScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.eyebrow, { color: colors.brand }]}>{t('blog.eyebrow')}</Text>
      <Text style={[styles.title, { color: colors.ink }]}>{t('blog.title')}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('blog.subtitle')}</Text>

      <View style={styles.topics}>
        {blogTopics.map((topic) => (
          <View key={topic} style={[styles.topic, { borderColor: colors.line }]}>
            <Text style={[styles.topicText, { color: colors.muted }]}>{t(`blog.topics.${topic}.label`)}</Text>
          </View>
        ))}
      </View>

      {blogArticles.map((article) => (
        <Pressable
          key={article.slug}
          onPress={() => navigation.navigate('BlogArticle', { slug: article.slug })}
          style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <Text style={[styles.topicText, { color: colors.brand }]}>
            {t(`blog.topics.${article.topic}.label`)}
          </Text>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>
            {t(`blog.articles.${article.slug}.title`)}
          </Text>
          <Text style={[styles.excerpt, { color: colors.muted }]}>
            {t(`blog.articles.${article.slug}.excerpt`)}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {t('blog.byAuthor', { author: article.author })} · {formatDate(article.publishedAt, language)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14 },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topic: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  topicText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  card: { borderRadius: 20, borderWidth: 1, gap: 8, padding: 14 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  excerpt: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 12 },
});
