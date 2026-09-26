import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import { parseContentBlocks } from '../utils/contentBlocks';
import { HighlightedCode } from '../utils/highlightCode';

type MaterialBodyProps = {
  content: string;
};

export function MaterialBody({ content }: MaterialBodyProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const blocks = parseContentBlocks(content);

  return (
    <View style={styles.wrap}>
      {blocks.map((block) =>
        block.type === 'code' ? (
          <View key={block.id} style={[styles.code, { backgroundColor: colors.bg, borderColor: colors.line }]}>
            <Text style={[styles.codeLabel, { color: colors.muted }]}>
              {block.language || t('materials.fields.codeBlock')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <HighlightedCode value={block.value} color={colors.ink} />
            </ScrollView>
          </View>
        ) : (
          <Text key={block.id} style={[styles.text, { color: colors.ink }]}>
            {block.value.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
              const bold = part.startsWith('**') && part.endsWith('**') && part.length > 4;
              return (
                <Text key={`${block.id}-${index}`} style={bold ? styles.bold : undefined}>
                  {bold ? part.slice(2, -2) : part}
                </Text>
              );
            })}
          </Text>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  text: { fontSize: 15, lineHeight: 22 },
  bold: { fontWeight: '700' },
  code: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  codeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
});
