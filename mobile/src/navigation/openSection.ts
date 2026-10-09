import { CommonActions, type NavigationProp, type NavigationState } from '@react-navigation/native';
import type { AppTabParamList, MoreStackParamList } from './types';

type AnyNavigation = Pick<NavigationProp<AppTabParamList>, 'dispatch' | 'getState' | 'navigate'>;

/**
 * Opens a section from Home with nothing under it in the Sections stack, so its back arrow
 * returns to Home (see `returnHome`) instead of the Sections hub.
 */
export function openSectionFromHome<S extends keyof MoreStackParamList>(
  navigation: AnyNavigation,
  screen: S,
  params?: MoreStackParamList[S],
): void {
  const state = navigation.getState() as NavigationState | undefined;
  if (!state || !state.routes.some((route) => route.name === 'More')) {
    navigation.navigate('More', { screen, params, initial: false } as never);
    return;
  }
  const routes = state.routes.map((route) =>
    route.name === 'More'
      ? { name: 'More', key: route.key, state: { index: 0, routes: [{ name: screen, params }] } }
      : route,
  );
  navigation.dispatch(
    CommonActions.reset({
      ...state,
      routes,
      index: routes.findIndex((route) => route.name === 'More'),
    } as never),
  );
}

/** True when the Today tab is the one on screen (quick add, reminders opened from Home). */
export function isOnHome(navigation: AnyNavigation): boolean {
  const state = navigation.getState() as NavigationState | undefined;
  return state?.routes[state.index]?.name === 'Today';
}

type StackNavigation = {
  getParent: () => { navigate: (name: 'Today') => void } | undefined;
  reset: (state: { index: number; routes: { name: keyof MoreStackParamList }[] }) => void;
};

/** Back from a section opened from Home: show Home, and put the Sections tab back on its hub. */
export function returnHome(navigation: StackNavigation): void {
  navigation.getParent()?.navigate('Today');
  navigation.reset({ index: 0, routes: [{ name: 'MoreHome' }] });
}
