import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  type ReactElement,
} from 'react';
import {
  Platform,
  ScrollView,
  View,
  type RefreshControlProps,
  type ScrollViewProps,
} from 'react-native';

type SectionScroll = {
  /** Height of the transparent header the content scrolls under (Android); 0 = nothing to do. */
  topInset: number;
  /** Scroll position, so the section layout can fade its frosted header strip in. */
  reportScroll: (y: number) => void;
  /** A SectionScrollView is mounted: the layout stops pushing the whole screen down. */
  register: () => () => void;
};

export const SectionScrollContext = createContext<SectionScroll>({
  topInset: 0,
  reportScroll: () => undefined,
  register: () => () => undefined,
});

/**
 * The scroll view of a section screen. iOS: a plain ScrollView (the system insets it under the
 * transparent header). Android: content starts under the header too — a spacer of the header's
 * height keeps the first item clear, the pull-to-refresh spinner appears below the header, and
 * the scroll position drives the frosted header strip drawn by the section layout.
 */
export const SectionScrollView = forwardRef<ScrollView, ScrollViewProps>(function SectionScrollView(
  { children, refreshControl, onScroll, scrollEventThrottle, ...rest },
  ref,
) {
  const { topInset, reportScroll, register } = useContext(SectionScrollContext);
  const android = Platform.OS === 'android' && topInset > 0;

  useEffect(() => (android ? register() : undefined), [android, register]);

  if (!android) {
    return (
      <ScrollView
        ref={ref}
        refreshControl={refreshControl}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      ref={ref}
      {...rest}
      refreshControl={
        isValidElement(refreshControl)
          ? cloneElement(refreshControl as ReactElement<RefreshControlProps>, {
              progressViewOffset: topInset,
            })
          : refreshControl
      }
      onScroll={(event) => {
        reportScroll(event.nativeEvent.contentOffset.y);
        onScroll?.(event);
      }}
      scrollEventThrottle={scrollEventThrottle ?? 16}
    >
      <View style={{ height: topInset }} />
      {children}
    </ScrollView>
  );
});
