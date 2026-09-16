import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getArticleBySlug } from '../../content/blog/articles';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import type { MoreStackParamList } from '../../navigation/types';
import { formatDate } from '../../utils/date';

export function BlogArticleScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const route = useRoute<RouteProp<MoreStackParamList, 'BlogArticle'>>();
  const article = getArticleBySlug(route.params.slug);
  const body = t(`blog.articles.${route.params.slug}.body`, { returnObjects: true });
  const paragraphs = Array.isArray(body) ? body : [String(body)];

  if (!article) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.muted }}>{t('notes.notFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.topic, { color: colors.brand }]}>{t(`blog.topics.${article.topic}.label`)}</Text>
      <Text style={[styles.title, { color: colors.ink }]}>{t(`blog.articles.${article.slug}.title`)}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>
        {t('blog.byAuthor', { author: article.author })} · {formatDate(article.publishedAt, language)}
      </Text>
      <View style={[styles.origin, { backgroundColor: colors.panel, borderColor: colors.line }]}>
        <Text style={[styles.originLabel, { color: colors.brand }]}>{t('blog.originLabel')}</Text>
        <Text style={[styles.originNote, { color: colors.muted }]}>
          {t(`blog.articles.${article.slug}.originNote`)}
        </Text>
      </View>
      {paragraphs.map((paragraph) => (
        <Text key={paragraph.slice(0, 24)} style={[styles.body, { color: colors.ink }]}>
          {paragraph}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 20 },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  topic: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '700' },
  meta: { fontSize: 13 },
  origin: { borderRadius: 16, borderWidth: 1, gap: 6, padding: 14 },
  originLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  originNote: { fontSize: 13, lineHeight: 20 },
  body: { fontSize: 16, lineHeight: 24 },
});
