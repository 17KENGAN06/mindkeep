import { Pressable, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import { setAppLanguage, supportedLanguages, type AppLanguage } from '../i18n';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { colors } = useTheme();
  const current = (i18n.resolvedLanguage ?? i18n.language).slice(0, 2);

  return (
    <View style={styles.row}>
      {supportedLanguages.map((language) => {
        const active = current === language.code;
        return (
          <Pressable
            key={language.code}
            accessibilityRole="button"
            onPress={() => void setAppLanguage(language.code as AppLanguage)}
            style={[
              styles.chip,
              { borderColor: colors.line },
              active && { backgroundColor: colors.brand, borderColor: colors.brand },
            ]}
          >
            <Text style={[{ color: colors.ink, fontSize: 13 }, active && { color: colors.onBrand, fontWeight: '700' }]}>
              {language.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
