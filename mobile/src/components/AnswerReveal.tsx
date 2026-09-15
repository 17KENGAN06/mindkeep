import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';

type AnswerRevealProps = {
  question: string;
  answer: string;
};

export function AnswerReveal({ question, answer }: AnswerRevealProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('materials.fields.question')}</Text>
      <Text style={styles.question}>{question}</Text>
      <Pressable onPress={() => setOpen((value) => !value)} style={styles.toggle}>
        <Text style={styles.toggleText}>{open ? t('materials.hideAnswer') : t('materials.revealAnswer')}</Text>
      </Pressable>
      {open ? <Text style={styles.answer}>{answer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(142, 239, 180, 0.08)',
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  question: { color: colors.ink, fontSize: 16, fontWeight: '600', marginTop: 8 },
  toggle: { marginTop: 12 },
  toggleText: { color: colors.brand, fontSize: 14, fontWeight: '700' },
  answer: { color: colors.ink, fontSize: 15, lineHeight: 22, marginTop: 10 },
});
