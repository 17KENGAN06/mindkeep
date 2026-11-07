import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { absoluteUrl, isPublicPath, isSeoLanguage, stripLocale } from '@/seo/locale';
import { alternates, OG_LOCALES, pageSeo } from '@/seo/meta';

const routeTitleKeys: Record<string, string> = {
  '/': 'seo.titles.home',
  '/login': 'seo.titles.login',
  '/register': 'seo.titles.register',
  '/forgot-password': 'seo.titles.forgotPassword',
  '/reset-password': 'seo.titles.resetPassword',
  '/verify-email': 'seo.titles.verifyEmail',
  '/onboarding': 'seo.titles.onboarding',
  '/settings': 'seo.titles.settings',
  '/account': 'seo.titles.account',
  '/dashboard': 'seo.titles.dashboard',
  '/tasks': 'seo.titles.tasks',
  '/review': 'seo.titles.review',
  '/calendar': 'seo.titles.calendar',
  '/month-plan': 'seo.titles.monthPlan',
  '/notes': 'seo.titles.notes',
  '/nutrition': 'seo.titles.calories',
  '/calories': 'seo.titles.calories',
  '/habits': 'seo.titles.rhythm',
  '/rhythm': 'seo.titles.rhythm',
  '/materials': 'seo.titles.materials',
  '/categories': 'seo.titles.categories',
  '/finance': 'seo.titles.budget',
  '/finance/transactions': 'seo.titles.transactions',
  '/finance/categories': 'seo.titles.expenseCategories',
  '/notifications': 'seo.titles.notifications',
  '/statistics': 'seo.titles.statistics',
  '/admin': 'seo.titles.admin',
  '/blog': 'seo.titles.blog',
  '/guide': 'seo.titles.guide',
  '/privacy': 'seo.titles.privacy',
  '/delete-account': 'seo.titles.deleteAccount',
  '/terms': 'seo.titles.terms',
  '/cookies': 'seo.titles.cookies',
  '/refund': 'seo.titles.refund',
  '/plans': 'seo.titles.plans',
  '/contact': 'seo.titles.contact',
  '/billing/return': 'seo.titles.billingReturn',
};

/** Finds or creates a head element and sets its attributes. */
function upsert(selector: string, tag: 'meta' | 'link', attrs: Record<string, string>) {
  let element = document.head.querySelector<HTMLElement>(selector);
  if (!element) {
    element = document.createElement(tag);
    document.head.appendChild(element);
  }
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
}

function remove(selector: string) {
  document.head.querySelectorAll(selector).forEach((element) => element.remove());
}

/**
 * Keeps the head in step with the route: title everywhere; on public pages also the
 * description, canonical, hreflang, Open Graph and JSON-LD (the same data the build
 * prerenders into static HTML); app and unknown pages get noindex.
 */
export function SeoHead() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  useEffect(() => {
    const { path } = stripLocale(pathname);
    const lang = i18n.resolvedLanguage ?? i18n.language;
    const seo = isPublicPath(path) && isSeoLanguage(lang) ? pageSeo(path, lang, t) : null;

    remove('link[rel="alternate"][hreflang]');
    remove('script[data-seo]');

    if (!seo || !isSeoLanguage(lang)) {
      document.title = t(titleKey(pathname));
      upsert('meta[name="robots"]', 'meta', { name: 'robots', content: 'noindex,follow' });
      remove('link[rel="canonical"]');
      return;
    }

    const url = absoluteUrl(path, lang);
    document.title = seo.title;
    upsert('meta[name="robots"]', 'meta', { name: 'robots', content: 'index,follow,max-image-preview:large' });
    upsert('meta[name="description"]', 'meta', { name: 'description', content: seo.description });
    upsert('link[rel="canonical"]', 'link', { rel: 'canonical', href: url });
    for (const alternate of alternates(path)) {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = alternate.hreflang;
      link.href = alternate.href;
      document.head.appendChild(link);
    }
    upsert('meta[property="og:type"]', 'meta', { property: 'og:type', content: seo.ogType });
    upsert('meta[property="og:title"]', 'meta', { property: 'og:title', content: seo.title });
    upsert('meta[property="og:description"]', 'meta', { property: 'og:description', content: seo.description });
    upsert('meta[property="og:url"]', 'meta', { property: 'og:url', content: url });
    upsert('meta[property="og:locale"]', 'meta', { property: 'og:locale', content: OG_LOCALES[lang] });
    upsert('meta[name="twitter:title"]', 'meta', { name: 'twitter:title', content: seo.title });
    upsert('meta[name="twitter:description"]', 'meta', { name: 'twitter:description', content: seo.description });
    for (const data of seo.jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seo = '';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    }
  }, [i18n.language, i18n.resolvedLanguage, pathname, t]);

  return null;
}

function titleKey(pathname: string): string {
  const exact = routeTitleKeys[pathname];
  if (exact) return exact;
  if (pathname.startsWith('/materials/')) return 'seo.titles.materials';
  if (pathname.startsWith('/notes/')) return 'seo.titles.notes';
  if (pathname.startsWith('/finance/')) return 'seo.titles.budget';
  if (pathname.startsWith('/admin/users/')) return 'seo.titles.adminUser';
  return 'seo.titles.notFound';
}
