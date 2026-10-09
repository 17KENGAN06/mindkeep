import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import { parseSourceUrl } from '../utils/url';
import { fonts } from '../config/fonts';

export function SourceLink({ href }: { href: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { host, path } = parseSourceUrl(href);

  return (
    <Pressable
      onPress={() => void Linking.openURL(href)}
      style={[styles.row, { backgroundColor: colors.bg, borderColor: colors.line }]}
    >
      <View style={styles.copy}>
        <Text style={[styles.host, { color: colors.ink }]} numberOfLines={1}>
          {host}
        </Text>
        {path ? (
          <Text style={[styles.path, { color: colors.muted }]} numberOfLines={1}>
            {path}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.action, { color: colors.brand }]}>{t('materials.openSource')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  copy: { flex: 1, minWidth: 0 },
  host: { fontSize: 14, fontFamily: fonts.bold },
  path: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  action: { fontSize: 13, fontFamily: fonts.bold },
});
