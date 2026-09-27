import { Pressable, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import { setAppLanguage, supportedLanguages, type AppLanguage } from '../i18n';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { colors } = useTheme();
  const current = (i18n.resolvedLanguage ?? i18n.language).slice(0, 2);

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: `${colors.brand}14`, borderColor: colors.line },
      ]}
    >
      {supportedLanguages.map((language) => {
        const active = current === language.code;
        return (
          <Pressable
            key={language.code}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => void setAppLanguage(language.code as AppLanguage)}
            style={[
              styles.chip,
              active
                ? { backgroundColor: colors.brand }
                : { backgroundColor: 'transparent' },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.onBrand : colors.muted },
                active && styles.labelActive,
              ]}
            >
              {language.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 6,
  },
  chip: {
    borderRadius: 12,
    minHeight: 40,
    minWidth: '31%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  label: { fontSize: 13, fontWeight: '600' },
  labelActive: { fontWeight: '700' },
});
