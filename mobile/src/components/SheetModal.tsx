import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppIcon } from './AppIcon';
import { useTheme } from '../features/theme/useTheme';

type SheetModalProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Buttons pinned under the scrolling body. */
  footer?: ReactNode;
};

/**
 * Full-screen dialog (calorie helper, task import/copy, scans): header with title and close,
 * scrolling body, optional pinned footer. Edge-to-edge safe on Android — content stays clear of
 * the status bar and the system navigation bar.
 */
export function SheetModal({ visible, title, subtitle, onClose, children, footer }: SheetModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.screen,
          { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: colors.line }]}>
          <Text style={[styles.title, { color: colors.ink }]} numberOfLines={2}>
            {title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            hitSlop={8}
            onPress={onClose}
            style={[styles.close, { backgroundColor: colors.panel, borderColor: colors.line }]}
          >
            <AppIcon name="close" color={colors.ink} size={22} />
          </Pressable>
        </View>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
            {children}
          </ScrollView>
          {footer ? (
            <View style={[styles.footer, { borderTopColor: colors.line, backgroundColor: colors.bg }]}>
              {footer}
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { flex: 1, fontSize: 20, fontWeight: '700' },
  close: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  body: { gap: 12, padding: 20, paddingBottom: 32 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
