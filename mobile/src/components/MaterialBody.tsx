import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import { parseContentBlocks } from '../utils/contentBlocks';

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
              <Text style={[styles.codeText, { color: colors.ink }]}>{block.value}</Text>
            </ScrollView>
          </View>
        ) : (
          <Text key={block.id} style={[styles.text, { color: colors.ink }]}>
            {block.value}
          </Text>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  text: { fontSize: 15, lineHeight: 22 },
  code: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  codeLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  codeText: { fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },
});
