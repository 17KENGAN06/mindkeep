/** Shared content column: header, sections, and footer use this everywhere. */
export const PAGE_SHELL = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8';
export const PAGE_SHELL_Y = 'py-5 sm:py-6';
/** Extra right inset on home snap screens so the side section nav never covers copy. */
export const HOME_SIDE_NAV_PAD = 'lg:pr-16 xl:pr-20';
export const HOME_SNAP_SHELL = `${PAGE_SHELL} ${HOME_SIDE_NAV_PAD} relative flex h-full min-h-0 flex-col justify-center overflow-y-auto py-4 sm:py-8`;
