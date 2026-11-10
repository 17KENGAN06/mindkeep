/**
 * Search and social metadata for the public pages, shared by the runtime <SeoHead>
 * and the build-time prerender (scripts/prerender.ts). Pure module, relative imports.
 */
import { getArticleBySlug } from '../content/blog/articles';
import { isFeatureSlug } from '../content/features';
import { absoluteUrl, DEFAULT_LANGUAGE, SEO_LANGUAGES, SITE_URL, type SeoLanguage } from './locale';

export type Translate = (key: string) => string;
/** Reads a non-string value (an array of questions) from the same locale. */
export type TranslateList = (key: string) => unknown;

export type ArticleFaq = { q: string; a: string }[];

/** The article's questions, or an empty list when the locale has none. */
export function articleFaq(slug: string, list: TranslateList): ArticleFaq {
  return listFaq(list(`blog.articles.${slug}.faq`));
}

/** Keeps only well-formed { q, a } items. */
export function listFaq(value: unknown): ArticleFaq {
  return Array.isArray(value)
    ? value.filter((item): item is { q: string; a: string } => typeof item?.q === 'string' && typeof item?.a === 'string')
    : [];
}

export type PageSeo = {
  title: string;
  description: string;
  ogType: 'website' | 'article';
  jsonLd: Record<string, unknown>[];
};

export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const OG_LOCALES: Record<SeoLanguage, string> = {
  en: 'en_US',
  uk: 'uk_UA',
  ru: 'ru_RU',
  pl: 'pl_PL',
  de: 'de_DE',
  fr: 'fr_FR',
  it: 'it_IT',
  es: 'es_ES',
  fi: 'fi_FI',
};

const SAME_AS = ['https://www.instagram.com/mindkeep.cloud/', 'https://www.tiktok.com/@mindkeep.cloud'];

const PAGE_KEYS: Record<string, string> = {
  '/': 'home',
  '/plans': 'plans',
  '/guide': 'guide',
  '/blog': 'blog',
  '/contact': 'contact',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/cookies': 'cookies',
  '/refund': 'refund',
  '/delete-account': 'deleteAccount',
};

/** One entry per language plus x-default, for hreflang links and the sitemap. */
export function alternates(path: string): { hreflang: string; href: string }[] {
  return [
    ...SEO_LANGUAGES.map((lang) => ({ hreflang: lang, href: absoluteUrl(path, lang) })),
    { hreflang: 'x-default', href: absoluteUrl(path, DEFAULT_LANGUAGE) },
  ];
}

const organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Mindkeep',
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/favicon.png`,
  sameAs: SAME_AS,
};

function breadcrumbs(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function faqJsonLd(faq: ArticleFaq): Record<string, unknown>[] {
  if (faq.length === 0) return [];
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];
}

/** Metadata for a public path, or null when the path is not a known public page. */
export function pageSeo(path: string, lang: SeoLanguage, t: Translate, list?: TranslateList): PageSeo | null {
  const url = absoluteUrl(path, lang);
  const home = { name: t('nav.home'), url: absoluteUrl('/', lang) };

  const featureSlug = /^\/features\/([^/]+)$/.exec(path)?.[1];
  if (featureSlug !== undefined) {
    if (!isFeatureSlug(featureSlug)) return null;
    const base = `landing.pages.${featureSlug}`;
    const name = t(`${base}.title`);
    return {
      title: t(`${base}.seoTitle`),
      description: t(`${base}.description`),
      ogType: 'website',
      jsonLd: [
        breadcrumbs([home, { name, url }]),
        ...faqJsonLd(list ? listFaq(list(`${base}.faq`)) : []),
      ],
    };
  }

  const articleSlug = /^\/blog\/([^/]+)$/.exec(path)?.[1];
  if (articleSlug) {
    const article = getArticleBySlug(articleSlug);
    if (!article) return null;
    const headline = t(`blog.articles.${article.slug}.title`);
    const description = t(`blog.articles.${article.slug}.excerpt`);
    return {
      title: `${headline} · Mindkeep`,
      description,
      ogType: 'article',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline,
          description,
          inLanguage: lang,
          datePublished: article.publishedAt,
          dateModified: article.publishedAt,
          mainEntityOfPage: url,
          url,
          image: OG_IMAGE,
          author: { '@type': 'Organization', name: article.author, url: `${SITE_URL}/` },
          publisher: organization,
        },
        breadcrumbs([home, { name: t('nav.blog'), url: absoluteUrl('/blog', lang) }, { name: headline, url }]),
        ...faqJsonLd(list ? articleFaq(article.slug, list) : []),
      ],
    };
  }

  const key = PAGE_KEYS[path];
  if (!key) return null;
  const title = t(`seo.titles.${key}`);
  const description = t(`seo.descriptions.${key}`);

  if (path === '/') {
    return {
      title,
      description,
      ogType: 'website',
      jsonLd: [
        { '@context': 'https://schema.org', ...organization },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          name: 'Mindkeep',
          url: `${SITE_URL}/`,
          inLanguage: SEO_LANGUAGES,
          publisher: { '@id': `${SITE_URL}/#organization` },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Mindkeep',
          url,
          description,
          applicationCategory: 'ProductivityApplication',
          operatingSystem: 'Web, Android, iOS',
          inLanguage: lang,
          image: OG_IMAGE,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          publisher: { '@id': `${SITE_URL}/#organization` },
        },
      ],
    };
  }

  const name = title.replace(/\s*·\s*Mindkeep$/, '');
  return {
    title,
    description,
    ogType: 'website',
    jsonLd: [breadcrumbs([home, { name, url }])],
  };
}
