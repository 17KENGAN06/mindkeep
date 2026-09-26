import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import {
  parseContentBlocks,
  serializeContentBlocks,
  type ContentBlock,
} from '../utils/contentBlocks';

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
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => parseContentBlocks(value));
  const serializedRef = useRef(serializeContentBlocks(blocks));

  useEffect(() => {
    if (value === serializedRef.current) return;
    const next = parseContentBlocks(value);
    setBlocks(next);
    serializedRef.current = serializeContentBlocks(next);
  }, [value]);

  const commit = (next: ContentBlock[]) => {
    setBlocks(next);
    const serialized = serializeContentBlocks(next);
    serializedRef.current = serialized;
    onChange(serialized);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[styles.label, { color: colors.muted }]}>{t('materials.fields.content')}</Text>
        <Pressable
          onPress={() =>
            commit([...blocks, { id: `${Date.now()}-code`, type: 'code', value: '', language: '' }])
          }
        >
          <Text style={[styles.action, { color: colors.brand }]}>{t('materials.addCodeBlock')}</Text>
        </Pressable>
      </View>
      {blocks[blocks.length - 1]?.type === 'code' ? (
        <Pressable
          onPress={() =>
            commit([...blocks, { id: `${Date.now()}-text`, type: 'text', value: '', language: '' }])
          }
        >
          <Text style={[styles.action, { color: colors.muted }]}>{t('materials.addTextBlock')}</Text>
        </Pressable>
      ) : null}

      {blocks.map((block) =>
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
              <Pressable onPress={() => commit(blocks.filter((item) => item.id !== block.id))}>
                <Text style={[styles.action, { color: colors.muted }]}>{t('materials.removeCodeBlock')}</Text>
              </Pressable>
            </View>
            <TextInput
              multiline
              spellCheck={false}
              autoCorrect={false}
              autoCapitalize="none"
              value={block.value}
              onChangeText={(next) => commit(updateBlock(blocks, block.id, { value: next }))}
              placeholder={t('materials.fields.codePlaceholder')}
              placeholderTextColor={colors.muted}
              style={[styles.codeInput, { color: colors.ink }]}
            />
          </View>
        ) : (
          <TextInput
            key={block.id}
            multiline
            value={block.value}
            onChangeText={(next) => commit(updateBlock(blocks, block.id, { value: next }))}
            style={[
              styles.input,
              { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
            ]}
          />
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
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  codeWrap: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  codeHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  language: { flex: 1, fontSize: 13, marginRight: 8 },
  codeInput: {
    fontFamily: 'monospace',
    fontSize: 13,
    minHeight: 140,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
});
