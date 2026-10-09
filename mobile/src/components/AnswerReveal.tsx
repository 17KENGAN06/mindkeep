import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import { fonts } from '../config/fonts';

type AnswerRevealProps = {
  question: string;
  answer: string;
};

export function AnswerReveal({ question, answer }: AnswerRevealProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.wrap, { backgroundColor: `${colors.brand}14`, borderColor: colors.line }]}>
      <Text style={[styles.label, { color: colors.muted }]}>{t('materials.fields.question')}</Text>
      <Text style={[styles.question, { color: colors.ink }]}>{question}</Text>
      <Pressable onPress={() => setOpen((value) => !value)} style={styles.toggle}>
        <Text style={[styles.toggleText, { color: colors.brand }]}>
          {open ? t('materials.hideAnswer') : t('materials.revealAnswer')}
        </Text>
      </Pressable>
      {open ? <Text style={[styles.answer, { color: colors.ink }]}>{answer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  label: { fontSize: 12, fontFamily: fonts.bold, textTransform: 'uppercase' },
  question: { fontSize: 16, fontFamily: fonts.semibold, marginTop: 8 },
  toggle: { marginTop: 12 },
  toggleText: { fontSize: 14, fontFamily: fonts.bold },
  answer: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 10 },
});
