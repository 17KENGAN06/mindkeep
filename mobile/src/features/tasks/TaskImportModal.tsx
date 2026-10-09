import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SheetModal } from '../../components/SheetModal';
import { AppButton, ChoiceChip } from '../../components/ui';
import { useTheme } from '../theme/useTheme';
import { parseTaskImport } from './parseTaskImport';
import { fonts } from '../../config/fonts';

type PairChoice = 'tab' | 'comma' | 'custom';
type CardChoice = 'newline' | 'semicolon' | 'custom';

type TaskImportModalProps = {
  visible: boolean;
  date: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onImport: (tasks: { title: string; minutes: number }[]) => void;
};

/** Paste "title<sep>minutes" lines into one day (site: features/tasks/TaskImportDialog). */
export function TaskImportModal({ visible, date, loading = false, error, onClose, onImport }: TaskImportModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [pairChoice, setPairChoice] = useState<PairChoice>('tab');
  const [cardChoice, setCardChoice] = useState<CardChoice>('newline');
  const [pairCustom, setPairCustom] = useState('');
  const [cardCustom, setCardCustom] = useState('');

  // Start fresh each time the dialog opens (adjusted during render).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setText('');
      setPairChoice('tab');
      setCardChoice('newline');
      setPairCustom('');
      setCardCustom('');
    }
  }

  const pairSep = pairChoice === 'tab' ? '\t' : pairChoice === 'comma' ? ',' : pairCustom;
  const cardSep = cardChoice === 'newline' ? '\n' : cardChoice === 'semicolon' ? ';' : cardCustom;
  const parsed = useMemo(() => parseTaskImport(text, pairSep, cardSep), [text, pairSep, cardSep]);

  const chip = (selected: boolean, label: string, onPress: () => void) => (
    <ChoiceChip key={label} label={label} selected={selected} onPress={onPress} />
  );

  const inputStyle = [styles.input, { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink }];

  return (
    <SheetModal
      visible={visible}
      title={t('tasks.importTitle')}
      subtitle={t('tasks.importHint', { date })}
      onClose={onClose}
      footer={
        <>
          <AppButton
            label={t('tasks.importSubmit')}
            loading={loading}
            disabled={parsed.rows.length === 0}
            onPress={() => {
              if (parsed.rows.length > 0) onImport(parsed.rows);
            }}
          />
          <AppButton variant="secondary" label={t('common.cancel')} disabled={loading} onPress={onClose} />
        </>
      }
    >
      <Text style={[styles.label, { color: colors.ink }]}>{t('tasks.importPaste')}</Text>
      <TextInput
        multiline
        autoCorrect={false}
        autoCapitalize="none"
        value={text}
        onChangeText={setText}
        placeholder={'English\t30\nMath\t45'}
        placeholderTextColor={colors.muted}
        style={[inputStyle, styles.textarea]}
      />

      <Text style={[styles.label, { color: colors.ink }]}>{t('tasks.importPairSep')}</Text>
      <View style={styles.chips}>
        {chip(pairChoice === 'tab', t('tasks.importTab'), () => setPairChoice('tab'))}
        {chip(pairChoice === 'comma', t('tasks.importComma'), () => setPairChoice('comma'))}
        {chip(pairChoice === 'custom', t('tasks.importCustom'), () => setPairChoice('custom'))}
      </View>
      {pairChoice === 'custom' ? (
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          value={pairCustom}
          onChangeText={setPairCustom}
          placeholder={t('tasks.importCustom')}
          placeholderTextColor={colors.muted}
          style={inputStyle}
        />
      ) : null}

      <Text style={[styles.label, { color: colors.ink }]}>{t('tasks.importCardSep')}</Text>
      <View style={styles.chips}>
        {chip(cardChoice === 'newline', t('tasks.importNewline'), () => setCardChoice('newline'))}
        {chip(cardChoice === 'semicolon', t('tasks.importSemicolon'), () => setCardChoice('semicolon'))}
        {chip(cardChoice === 'custom', t('tasks.importCustom'), () => setCardChoice('custom'))}
      </View>
      {cardChoice === 'custom' ? (
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          value={cardCustom}
          onChangeText={setCardCustom}
          placeholder={t('tasks.importCustom')}
          placeholderTextColor={colors.muted}
          style={inputStyle}
        />
      ) : null}

      <Text style={[styles.label, { color: colors.ink }]}>
        {t('tasks.importPreview', { count: parsed.rows.length })}
      </Text>
      {parsed.rows.length === 0 ? (
        <Text style={[styles.muted, { color: colors.muted }]}>{t('tasks.importEmptyPreview')}</Text>
      ) : (
        <View style={[styles.preview, { backgroundColor: `${colors.brand}12`, borderColor: colors.line }]}>
          {parsed.rows.map((row, index) => (
            <View key={`${row.title}-${index}`} style={styles.previewRow}>
              <Text numberOfLines={1} style={[styles.previewTitle, { color: colors.ink }]}>
                {row.title}
              </Text>
              <Text style={[styles.muted, { color: colors.muted }]}>
                {row.minutes} {t('tasks.minShort')}
              </Text>
            </View>
          ))}
        </View>
      )}
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontFamily: fonts.semibold },
  muted: { fontFamily: fonts.regular, fontSize: 13 },
  error: { fontFamily: fonts.regular, fontSize: 14 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textarea: { fontFamily: 'monospace', fontSize: 13, minHeight: 140, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preview: { borderRadius: 12, borderWidth: 1, gap: 4, padding: 12 },
  previewRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  previewTitle: { flex: 1, fontFamily: fonts.regular, fontSize: 14 },
});
