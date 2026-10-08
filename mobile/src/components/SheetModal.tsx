import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
 * Bottom sheet used for dialogs (the site's centered/bottom dialogs). Full-screen backdrop on
 * edge-to-edge Android; the sheet stays below the status bar and above the navigation bar.
 */
export function SheetModal({ visible, title, subtitle, onClose, children, footer }: SheetModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.panel,
              borderColor: colors.line,
              marginTop: insets.top + 16,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(7,17,13,0.55)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    flexShrink: 1,
  },
  body: { gap: 12, padding: 20, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, lineHeight: 18 },
  footer: { gap: 8, paddingHorizontal: 20, paddingTop: 8 },
});
