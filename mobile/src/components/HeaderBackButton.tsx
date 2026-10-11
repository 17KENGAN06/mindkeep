import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from './AppIcon';
import { ANDROID_HEADER_DROP } from './headerMetrics';
import { useTheme } from '../features/theme/useTheme';

/** Back button of the section headers: a soft glass square with a thin chevron, like the site's icon buttons. */
export function HeaderBackButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: `${colors.panel}e6`, borderColor: colors.line },
        pressed && { backgroundColor: `${colors.brand}1f`, borderColor: `${colors.brand}66` },
      ]}
    >
      <AppIcon name="chevron-back" color={colors.ink} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 44 px like iPhone's header buttons; lowered so it sits in the middle of the taller glass strip.
  button: {
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginRight: 8,
    marginTop: ANDROID_HEADER_DROP,
    width: 44,
  },
});
