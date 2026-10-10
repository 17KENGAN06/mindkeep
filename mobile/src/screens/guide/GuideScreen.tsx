import { StyleSheet, Text, View } from 'react-native';
import { SectionScrollView } from '../../components/SectionScrollView';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../features/theme/useTheme';
import { fonts } from '../../config/fonts';

type GuideStep = { title: string; body: string };
type GuideFaq = { question: string; answer: string };

export function GuideScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const steps = t('guide.steps', { returnObjects: true });
  const rules = t('guide.rules', { returnObjects: true });
  const faq = t('guide.faq', { returnObjects: true });

  return (
    <SectionScrollView
      contentInsetAdjustmentBehavior="automatic"
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
    </SectionScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  eyebrow: { fontSize: 12, fontFamily: fonts.bold, letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 24, fontFamily: fonts.display, marginTop: 10 },
  intro: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, marginTop: 12 },
  section: { fontSize: 20, fontFamily: fonts.bold, marginTop: 28, marginBottom: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  rulesCard: { marginTop: 8 },
  stepLabel: { fontSize: 12, fontFamily: fonts.bold, letterSpacing: 1.6, textTransform: 'uppercase' },
  cardTitle: { fontSize: 17, fontFamily: fonts.bold, marginTop: 8 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 8 },
  ruleRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  dot: { borderRadius: 4, height: 8, marginTop: 8, width: 8 },
  ruleText: { flex: 1, marginTop: 0 },
});
