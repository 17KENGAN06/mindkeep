import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import {
  ensureEditableBlocks,
  insertCodeAt,
  parseContentBlocks,
  removeCodeBlock,
  serializeContentBlocks,
  type ContentBlock,
} from '../utils/contentBlocks';
import { containsCodeFence, normalizePastedText } from '../utils/pasteText';

type MaterialContentEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

function updateBlock(blocks: ContentBlock[], id: string, patch: Partial<ContentBlock>): ContentBlock[] {
  return blocks.map((block) => (block.id === id ? { ...block, ...patch } : block));
}

export function MaterialContentEditor({ value, onChange }: MaterialContentEditorProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => ensureEditableBlocks(parseContentBlocks(value)));
  const serializedRef = useRef(serializeContentBlocks(blocks));
  const focusedTextId = useRef(blocks.find((block) => block.type === 'text')?.id ?? '');
  const cursors = useRef<Record<string, number>>({});

  useEffect(() => {
    if (value === serializedRef.current) return;
    const next = ensureEditableBlocks(parseContentBlocks(value));
    setBlocks(next);
    serializedRef.current = serializeContentBlocks(next);
  }, [value]);

  const commit = (next: ContentBlock[]) => {
    setBlocks(next);
    const serialized = serializeContentBlocks(next);
    serializedRef.current = serialized;
    onChange(serialized);
  };

  const applyText = (id: string, next: string) => {
    const value = normalizePastedText(next);
    const updated = updateBlock(blocks, id, { value });
    if (containsCodeFence(value)) {
      commit(ensureEditableBlocks(parseContentBlocks(serializeContentBlocks(updated))));
      return;
    }
    commit(updated);
  };

  const addCodeInText = (textId: string) => {
    const block = blocks.find((item) => item.id === textId);
    const cursor = cursors.current[textId] ?? block?.value.length ?? 0;
    commit(insertCodeAt(blocks, textId, cursor));
  };

  const addCode = () => {
    const textId =
      focusedTextId.current ||
      [...blocks].reverse().find((block) => block.type === 'text')?.id ||
      blocks[0]?.id;
    if (!textId) return;
    addCodeInText(textId);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[styles.label, { color: colors.muted }]}>{t('materials.fields.content')}</Text>
        <Pressable onPress={addCode}>
          <Text style={[styles.action, { color: colors.brand }]}>{t('materials.addCodeBlock')}</Text>
        </Pressable>
      </View>

      {blocks.map((block, index) =>
        block.type === 'code' ? (
          <View key={block.id} style={[styles.codeWrap, { backgroundColor: colors.bg, borderColor: colors.line }]}>
            <View style={styles.codeHead}>
              <TextInput
                value={block.language}
                onChangeText={(language) => commit(updateBlock(blocks, block.id, { language }))}
                placeholder={t('materials.fields.codeLanguage')}
                placeholderTextColor={colors.muted}
                style={[styles.language, { color: colors.muted }]}
              />
              <Pressable onPress={() => commit(removeCodeBlock(blocks, block.id))}>
                <Text style={[styles.action, { color: colors.muted }]}>{t('materials.removeCodeBlock')}</Text>
              </Pressable>
            </View>
            <TextInput
              multiline
              spellCheck={false}
              autoCorrect={false}
              autoCapitalize="none"
              value={block.value}
              onChangeText={(next) => commit(updateBlock(blocks, block.id, { value: normalizePastedText(next) }))}
              placeholder={t('materials.fields.codePlaceholder')}
              placeholderTextColor={colors.muted}
              style={[styles.codeInput, { color: colors.ink }]}
            />
          </View>
        ) : (
          <View key={block.id} style={styles.textWrap}>
            <TextInput
              multiline
              value={block.value}
              onChangeText={(next) => {
                focusedTextId.current = block.id;
                applyText(block.id, next);
              }}
              onFocus={() => {
                focusedTextId.current = block.id;
              }}
              onSelectionChange={(event) => {
                focusedTextId.current = block.id;
                cursors.current[block.id] = event.nativeEvent.selection.start;
              }}
              placeholder={
                blocks[index - 1]?.type === 'code'
                  ? t('materials.fields.contentContinue')
                  : t('materials.fields.content')
              }
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
              ]}
            />
            <Pressable onPress={() => addCodeInText(block.id)}>
              <Text style={[styles.action, { color: colors.brand }]}>{t('materials.insertCodeHere')}</Text>
            </Pressable>
          </View>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  head: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13 },
  action: { fontSize: 13, fontWeight: '700' },
  textWrap: { gap: 8 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  codeWrap: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  codeHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  language: { flex: 1, fontSize: 16, marginRight: 8 },
  codeInput: {
    fontFamily: 'monospace',
    fontSize: 16,
    lineHeight: 22,
    minHeight: 140,
    paddingHorizontal: 18,
    paddingVertical: 16,
    textAlignVertical: 'top',
  },
});
