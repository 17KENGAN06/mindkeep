import { useRef, useState, type ReactNode } from 'react';
import { BlurTargetView } from 'expo-blur';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientGlow } from './AmbientGlow';
import { AUTH_HEADER_HEIGHT, AuthHeader } from './AuthHeader';
import { useTheme } from '../features/theme/useTheme';

/** Space above the card: the floating header plus a little room. */
const CONTENT_TOP = AUTH_HEADER_HEIGHT + 12;

/** Sign-in / sign-up / reset layout, like the site's /login: glow, header, form in a card. */
export function AuthScreenFrame({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [raised, setRaised] = useState(false);
  // The floating header blurs this content as it scrolls underneath.
  const blurTarget = useRef<View>(null);
  return (
    // Top and bottom edges handled by hand: the page scrolls under the clock and the home bar.
    <SafeAreaView edges={['left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <BlurTargetView ref={blurTarget} style={styles.root}>
        <AmbientGlow />
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            onScroll={(event) => setRaised(event.nativeEvent.contentOffset.y > 4)}
            scrollEventThrottle={32}
            contentContainerStyle={[
              styles.content,
              { paddingTop: insets.top + CONTENT_TOP, paddingBottom: insets.bottom + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.card,
                { backgroundColor: `${colors.panel}e6`, borderColor: colors.line },
              ]}
            >
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </BlurTargetView>
      <AuthHeader raised={raised} blurTarget={blurTarget} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16 },
  card: { borderRadius: 24, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 24 },
});
