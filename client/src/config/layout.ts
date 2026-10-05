/** Shared content column: header, sections, and footer use this everywhere. */
export const PAGE_SHELL = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8';
export const PAGE_SHELL_Y = 'py-5 sm:py-6';
/** Extra right inset on home snap screens so the side section nav never covers copy. */
export const HOME_SIDE_NAV_PAD = 'xl:pr-20';
export const HOME_SNAP_SHELL = `${PAGE_SHELL} ${HOME_SIDE_NAV_PAD} relative flex min-h-0 flex-col py-7 sm:py-8 xl:py-10 home-snap-shell`;
