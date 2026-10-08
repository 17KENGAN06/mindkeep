import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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
 * scrolling body, optional pinned footer.
 *
 * A Modal is its own native window, so it gets its own SafeAreaProvider: insets measured by the
 * app's root provider can be 0 inside it, which pushed the header under the status bar.
 */
export function SheetModal(props: SheetModalProps) {
  return (
    <Modal
      visible={props.visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={props.onClose}
    >
      <SafeAreaProvider>
        <SheetBody {...props} />
      </SafeAreaProvider>
    </Modal>
  );
}

function SheetBody({ title, subtitle, onClose, children, footer }: SheetModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Android fallback: never let the header sit under the status bar, even if insets read 0.
  const top = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0);
  const bottom = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: top }]}>
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
          contentContainerStyle={[styles.body, !footer && { paddingBottom: bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
          {children}
        </ScrollView>
        {footer ? (
          <View
            style={[
              styles.footer,
              { borderTopColor: colors.line, backgroundColor: colors.bg, paddingBottom: bottom },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
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
    minHeight: 64,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: { flex: 1, fontSize: 19, fontWeight: '700', lineHeight: 24 },
  close: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  body: { gap: 12, padding: 20, paddingBottom: 24 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
