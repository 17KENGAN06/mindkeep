import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { isPublicPath, localizePath, stripLocale } from '@/seo/locale';

/**
 * `localize('/blog')` gives the public page in the current language (`/ru/blog`);
 * `basePath` is the current path without its language prefix, for "is this page" checks.
 */
export function useLocalePath() {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const localize = useCallback((path: string) => localizePath(path, lang), [lang]);
  return { localize, basePath: stripLocale(pathname).path, lang };
}

/** Changes the language; on a public page it also moves to that language's URL. */
export function useSwitchLanguage() {
  const { i18n } = useTranslation();
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  return useCallback(
    (code: string) => {
      const { path } = stripLocale(pathname);
      // Move only once the language has changed, or the gate on the new URL would
      // still see the old language and send the visitor back.
      void i18n.changeLanguage(code).then(() => {
        if (!isPublicPath(path)) return;
        const target = `${localizePath(path, code)}${search}${hash}`;
        if (target !== `${pathname}${search}${hash}`) void navigate(target, { replace: true });
      });
    },
    [hash, i18n, navigate, pathname, search],
  );
}
