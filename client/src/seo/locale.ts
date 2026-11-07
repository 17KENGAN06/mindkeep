/**
 * Language prefixes for the public pages. English is the default and has no prefix
 * (`/blog`); every other language lives under its own prefix (`/ru/blog`). The app
 * behind sign-in keeps unprefixed URLs and uses the saved language.
 *
 * Pure module (no browser APIs, relative imports only): the build-time prerender
 * script imports it too.
 */
import { blogArticles } from '../content/blog/articles';

export const SITE_URL = 'https://mindkeep.cloud';

export const SEO_LANGUAGES = ['en', 'uk', 'ru', 'pl', 'de', 'fr', 'it', 'es', 'fi'] as const;
export type SeoLanguage = (typeof SEO_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SeoLanguage = 'en';

/** Languages that appear as a URL prefix. */
export const PREFIXED_LANGUAGES = SEO_LANGUAGES.filter((lang) => lang !== DEFAULT_LANGUAGE);

/** Public, indexable pages (without a language prefix). */
export const PUBLIC_PATHS = [
  '/',
  '/plans',
  '/guide',
  '/blog',
  ...blogArticles.map((article) => `/blog/${article.slug}`),
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/refund',
  '/delete-account',
] as const;

export function isSeoLanguage(value: string | undefined): value is SeoLanguage {
  return SEO_LANGUAGES.includes(value as SeoLanguage);
}

/** Routes that exist in every language, as React Router patterns. */
const PUBLIC_PATTERNS = [/^\/$/, /^\/plans$/, /^\/guide$/, /^\/blog$/, /^\/blog\/[^/]+$/, /^\/contact$/, /^\/privacy$/, /^\/terms$/, /^\/cookies$/, /^\/refund$/, /^\/delete-account$/];

export function isPublicPath(path: string): boolean {
  return PUBLIC_PATTERNS.some((pattern) => pattern.test(path));
}

/** Splits `/ru/blog` into `{ lang: 'ru', path: '/blog' }`; unprefixed paths get `lang: null`. */
export function stripLocale(pathname: string): { lang: SeoLanguage | null; path: string } {
  const match = /^\/([a-z]{2})(\/.*)?$/.exec(pathname);
  if (match?.[1] && (PREFIXED_LANGUAGES as readonly string[]).includes(match[1])) {
    const path = match[2] && match[2] !== '/' ? match[2].replace(/\/$/, '') : '/';
    if (isPublicPath(path)) return { lang: match[1] as SeoLanguage, path };
  }
  return { lang: null, path: pathname };
}

/** `/blog` + `ru` → `/ru/blog`; only public pages get a prefix. */
export function localizePath(path: string, lang: string | undefined): string {
  const [pathname, rest = ''] = splitSuffix(path);
  if (!isSeoLanguage(lang) || lang === DEFAULT_LANGUAGE || !isPublicPath(pathname)) return path;
  return `/${lang}${pathname === '/' ? '' : pathname}${rest}`;
}

export function absoluteUrl(path: string, lang: SeoLanguage): string {
  const localized = localizePath(path, lang);
  return `${SITE_URL}${localized === '/' ? '/' : localized}`;
}

function splitSuffix(path: string): [string, string] {
  const index = path.search(/[?#]/);
  return index === -1 ? [path, ''] : [path.slice(0, index), path.slice(index)];
}
