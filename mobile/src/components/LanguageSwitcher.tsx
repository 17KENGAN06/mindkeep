import { useState } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from './AppIcon';
import { SheetModal } from './SheetModal';
import { fonts } from '../config/fonts';
import { useTheme } from '../features/theme/useTheme';
import { isSystemLanguage, setAppLanguage, supportedLanguages, type AppLanguage } from '../i18n';

type LanguageSwitcherProps = {
  /** A small "RU ▾" pill that opens the list in a sheet (sign-in screens). Default: full grid. */
  compact?: boolean;
};

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = (i18n.resolvedLanguage ?? i18n.language).slice(0, 2);
  const system = isSystemLanguage();

  if (compact) {
    return (
      <>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.language')}
          hitSlop={8}
          onPress={() => setOpen(true)}
          style={[styles.pill, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <AppIcon name="globe-outline" color={colors.brand} size={18} />
          <AppIcon name="chevron-down" color={colors.muted} size={14} />
        </Pressable>
        <SheetModal visible={open} title={t('common.language')} onClose={() => setOpen(false)}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: system }}
            onPress={() => {
              void setAppLanguage('system');
              setOpen(false);
            }}
            style={[
              styles.row,
              { backgroundColor: colors.panel, borderColor: system ? colors.brand : colors.line },
            ]}
          >
            <View style={styles.rowStart}>
              <AppIcon name="phone-portrait-outline" color={colors.muted} size={18} />
              <Text style={[styles.rowLabel, { color: colors.ink }, system && styles.rowLabelActive]}>
                {t('common.systemLanguage')}
              </Text>
            </View>
            {system ? <AppIcon name="checkmark" color={colors.brand} size={20} /> : null}
          </Pressable>
          {supportedLanguages.map((language) => {
            const active = !system && current === language.code;
            return (
              <Pressable
                key={language.code}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  void setAppLanguage(language.code as AppLanguage);
                  setOpen(false);
                }}
                style={[
                  styles.row,
                  { backgroundColor: colors.panel, borderColor: active ? colors.brand : colors.line },
                ]}
              >
                <Text style={[styles.rowLabel, { color: colors.ink }, active && styles.rowLabelActive]}>
                  {language.label}
                </Text>
                {active ? <AppIcon name="checkmark" color={colors.brand} size={20} /> : null}
              </Pressable>
            );
          })}
        </SheetModal>
      </>
    );
  }

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
  label: { fontSize: 13, fontFamily: fonts.semibold },
  labelActive: { fontFamily: fonts.bold },
  pill: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 42,
    paddingHorizontal: 12,
  },
  row: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  rowLabel: { fontFamily: fonts.medium, fontSize: 16 },
  rowLabelActive: { fontFamily: fonts.bold },
  rowStart: { alignItems: 'center', flexDirection: 'row', gap: 10 },
});
