import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type Ref,
  type RefObject,
} from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  View,
  type RefreshControlProps,
  type ScrollViewProps,
} from 'react-native';

/** Space kept between a focused field and the top of the keyboard. */
const KEYBOARD_GAP = 24;

/**
 * Android draws edge-to-edge, so the window no longer shrinks for the keyboard and fields near
 * the bottom end up under it. Pad the content by what the keyboard really covers of the scroll
 * view, then scroll the focused field above the keyboard. (Window setups that do resize get a
 * zero pad and only the scroll.)
 */
function useAndroidKeyboardPad(
  scrollRef: RefObject<ScrollView | null>,
  offsetY: RefObject<number>,
  enabled: boolean,
): number {
  const [pad, setPad] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const revealFocused = (keyboardTop: number) => {
      const input = TextInput.State.currentlyFocusedInput();
      if (!input) return;
      input.measureInWindow((_x, y, _width, height) => {
        const overflow = y + height + KEYBOARD_GAP - keyboardTop;
        if (overflow > 0) {
          scrollRef.current?.scrollTo({ y: offsetY.current + overflow, animated: true });
        }
      });
    };
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      const keyboardTop = event.endCoordinates.screenY;
      // Measured a moment later, once a resizing window has laid the view out at its new height.
      timers.push(
        setTimeout(() => {
          const view = scrollRef.current?.getNativeScrollRef();
          if (!view) return;
          view.measureInWindow((_x, y, _width, height) => {
            setPad(Math.max(0, Math.round(y + height - keyboardTop)));
            timers.push(setTimeout(() => revealFocused(keyboardTop), 80));
          });
        }, 150),
      );
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setPad(0));
    return () => {
      timers.forEach(clearTimeout);
      show.remove();
      hide.remove();
    };
  }, [enabled, offsetY, scrollRef]);
  return pad;
}

type SectionScrollViewProps = ScrollViewProps & {
  /** Android: make room for the keyboard (default). Off for screens that handle it themselves. */
  keyboardAware?: boolean;
};

type SectionScroll = {
  /** Height of the transparent header the content scrolls under (Android); 0 = nothing to do. */
  topInset: number;
  /** iOS 26+: report scrolling too, for the frosted strip under the header. */
  iosGlass: boolean;
  /** Scroll position, so the section layout can fade its frosted header strip in. */
  reportScroll: (y: number) => void;
  /** A SectionScrollView is mounted: the layout stops pushing the whole screen down. */
  register: () => () => void;
};

export const SectionScrollContext = createContext<SectionScroll>({
  topInset: 0,
  iosGlass: false,
  reportScroll: () => undefined,
  register: () => () => undefined,
});

/**
 * The scroll view of a section screen. iOS: a plain ScrollView (the system insets it under the
 * transparent header). Android: content starts under the header too — a spacer of the header's
 * height keeps the first item clear, the pull-to-refresh spinner appears below the header, and
 * the scroll position drives the frosted header strip drawn by the section layout.
 */
export const SectionScrollView = forwardRef<ScrollView, SectionScrollViewProps>(function SectionScrollView(
  { children, refreshControl, onScroll, scrollEventThrottle, keyboardAware = true, ...rest },
  ref,
) {
  const { topInset, iosGlass, reportScroll, register } = useContext(SectionScrollContext);
  const android = Platform.OS === 'android' && topInset > 0;
  const keyboardOnAndroid = Platform.OS === 'android' && keyboardAware;

  useEffect(() => (android ? register() : undefined), [android, register]);

  const scrollRef = useRef<ScrollView | null>(null);
  const offsetY = useRef(0);
  const setRefs = useCallback(
    (node: ScrollView | null) => {
      scrollRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );
  const keyboardPad = useAndroidKeyboardPad(scrollRef, offsetY, keyboardOnAndroid);
  const keyboardSpacer = keyboardPad > 0 ? <View style={{ height: keyboardPad }} /> : null;

  if (!android) {
    const track = iosGlass || keyboardOnAndroid;
    return (
      <ScrollView
        ref={setRefs}
        refreshControl={refreshControl}
        onScroll={
          track
            ? (event) => {
                offsetY.current = event.nativeEvent.contentOffset.y;
                if (iosGlass) reportScroll(event.nativeEvent.contentOffset.y);
                onScroll?.(event);
              }
            : onScroll
        }
        scrollEventThrottle={track ? (scrollEventThrottle ?? 16) : scrollEventThrottle}
        {...rest}
      >
        {children}
        {keyboardSpacer}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      ref={setRefs}
      {...rest}
      refreshControl={
        isValidElement(refreshControl)
          ? cloneElement(refreshControl as ReactElement<RefreshControlProps>, {
              progressViewOffset: topInset,
            })
          : refreshControl
      }
      onScroll={(event) => {
        offsetY.current = event.nativeEvent.contentOffset.y;
        reportScroll(event.nativeEvent.contentOffset.y);
        onScroll?.(event);
      }}
      scrollEventThrottle={scrollEventThrottle ?? 16}
    >
      <View style={{ height: topInset }} />
      {children}
      {keyboardSpacer}
    </ScrollView>
  );
});

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}
