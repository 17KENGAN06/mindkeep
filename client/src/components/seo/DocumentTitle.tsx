import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

const routeTitleKeys: Record<string, string> = {
  '/': 'seo.titles.home',
  '/login': 'seo.titles.login',
  '/register': 'seo.titles.register',
  '/dashboard': 'seo.titles.dashboard',
  '/tasks': 'seo.titles.tasks',
  '/review': 'seo.titles.review',
  '/calendar': 'seo.titles.calendar',
  '/month-plan': 'seo.titles.monthPlan',
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
};

export function DocumentTitle() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  useEffect(() => {
    const exact = routeTitleKeys[pathname];
    let key = exact;

    if (!key) {
      if (pathname.startsWith('/materials/')) {
        key = 'seo.titles.materials';
      } else if (pathname.startsWith('/finance/')) {
        key = 'seo.titles.budget';
      } else if (pathname.startsWith('/blog/')) {
        key = 'seo.titles.blog';
      } else {
        key = 'seo.titles.notFound';
      }
    }

    document.title = t(key);
  }, [pathname, t]);

  return null;
}
