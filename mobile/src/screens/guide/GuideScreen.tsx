import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../features/theme/useTheme';

type GuideStep = { title: string; body: string };
type GuideFaq = { question: string; answer: string };

export function GuideScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const steps = t('guide.steps', { returnObjects: true });
  const rules = t('guide.rules', { returnObjects: true });
  const faq = t('guide.faq', { returnObjects: true });

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.eyebrow, { color: colors.brand }]}>{t('guide.eyebrow')}</Text>
      <Text style={[styles.title, { color: colors.ink }]}>{t('guide.title')}</Text>
      <Text style={[styles.intro, { color: colors.muted }]}>{t('guide.intro')}</Text>

      <Text style={[styles.section, { color: colors.ink }]}>{t('guide.stepsTitle')}</Text>
      {Array.isArray(steps)
        ? (steps as GuideStep[]).map((step, index) => (
            <View
              key={step.title}
              style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}
            >
              <Text style={[styles.stepLabel, { color: colors.brand }]}>
                {t('guide.stepLabel', { number: index + 1 })}
              </Text>
              <Text style={[styles.cardTitle, { color: colors.ink }]}>{step.title}</Text>
              <Text style={[styles.body, { color: colors.muted }]}>{step.body}</Text>
            </View>
          ))
        : null}

      <View style={[styles.card, styles.rulesCard, { backgroundColor: colors.panel, borderColor: colors.line }]}>
        <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('guide.rulesTitle')}</Text>
        {Array.isArray(rules)
          ? (rules as string[]).map((rule) => (
              <View key={rule} style={styles.ruleRow}>
                <View style={[styles.dot, { backgroundColor: colors.brand }]} />
                <Text style={[styles.body, styles.ruleText, { color: colors.muted }]}>{rule}</Text>
              </View>
            ))
          : null}
      </View>

      <Text style={[styles.section, { color: colors.ink }]}>{t('guide.faqTitle')}</Text>
      {Array.isArray(faq)
        ? (faq as GuideFaq[]).map((item) => (
            <View
              key={item.question}
              style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}
            >
              <Text style={[styles.cardTitle, { color: colors.ink }]}>{item.question}</Text>
              <Text style={[styles.body, { color: colors.muted }]}>{item.answer}</Text>
            </View>
          ))
        : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '700', marginTop: 10 },
  intro: { fontSize: 16, lineHeight: 24, marginTop: 12 },
  section: { fontSize: 20, fontWeight: '700', marginTop: 28, marginBottom: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  rulesCard: { marginTop: 8 },
  stepLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase' },
  cardTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  body: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  ruleRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  dot: { borderRadius: 4, height: 8, marginTop: 8, width: 8 },
  ruleText: { flex: 1, marginTop: 0 },
});
