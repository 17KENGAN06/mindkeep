import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Reveal } from '@/components/motion/Reveal';
import {
  blogArticles,
  blogTopics,
  getArticleBySlug,
  type BlogTopicId,
} from '@/content/blog/articles';
import { NotFoundPage } from '@/pages/NotFoundPage';

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function BlogPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        <header className="flex items-center justify-between gap-3">
          <BrandLockup to="/" size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        <Reveal className="mt-12 sm:mt-16">
          <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
            {t('blog.eyebrow')}
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t('blog.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-muted sm:text-lg">{t('blog.subtitle')}</p>
        </Reveal>

        <section className="mt-12 sm:mt-16">
          <div className="mb-8 flex flex-wrap gap-2">
            {blogTopics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-line px-3 py-1 text-[11px] tracking-[0.16em] text-muted uppercase"
              >
                {t(`blog.topics.${topic}.label`)}
              </span>
            ))}
          </div>

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            {blogArticles.map((article, index) => (
              <Reveal key={article.slug} className="min-w-0 h-full" delayMs={80 + index * 70}>
                <ArticleCard article={article} />
              </Reveal>
            ))}
          </div>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}

export function BlogArticlePage() {
  const { slug = '' } = useParams();
  const { t, i18n } = useTranslation();
  const article = getArticleBySlug(slug);

  if (!article) {
    return <NotFoundPage />;
  }

  const body = t(`blog.articles.${article.slug}.body`, {
    returnObjects: true,
  }) as string[] | string;

  const paragraphs = Array.isArray(body) ? body : [String(body)];

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
        <header className="flex items-center justify-between gap-3">
          <BrandLockup to="/" size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        <Reveal className="mt-8 text-sm">
          <Link to="/blog" className="font-medium text-brand-500 no-underline">
            ← {t('blog.back')}
          </Link>
        </Reveal>

        <Reveal className="mt-8" delayMs={60}>
          <article>
            <p className="text-[11px] tracking-[0.2em] text-brand-500 uppercase">
              {t(`blog.topics.${article.topic}.label`)}
            </p>
            <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t(`blog.articles.${article.slug}.title`)}
            </h1>

            <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
              <span>{t('blog.byAuthor', { author: article.author })}</span>
              <span aria-hidden>·</span>
              <time dateTime={article.publishedAt}>
                {formatDate(article.publishedAt, i18n.language)}
              </time>
            </div>

            <div className="glass-panel mt-8 rounded-2xl p-4 sm:p-5">
              <p className="text-[11px] tracking-[0.18em] text-brand-500 uppercase">
                {t('blog.originLabel')}
              </p>
              <p className="mt-2 font-display text-lg font-semibold text-ink">{article.originator}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t(`blog.articles.${article.slug}.originNote`)}
              </p>
            </div>

            <div className="prose-mindkeep mt-10 space-y-5 text-base leading-relaxed text-ink/90 sm:text-lg">
              {paragraphs.map((paragraph, index) => (
                <Reveal key={paragraph.slice(0, 24)} delayMs={100 + index * 50}>
                  <p>{paragraph}</p>
                </Reveal>
              ))}
            </div>
          </article>
        </Reveal>

        <Reveal className="mt-16 border-t border-line pt-10" delayMs={120}>
          <h2 className="font-display text-xl font-semibold text-ink">{t('blog.moreTitle')}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {blogArticles
              .filter((item) => item.slug !== article.slug)
              .slice(0, 2)
              .map((item, index) => (
                <Reveal key={item.slug} delayMs={index * 80}>
                  <ArticleCard article={item} />
                </Reveal>
              ))}
          </div>
        </Reveal>
      </div>
      <SiteFooter />
    </div>
  );
}

/** Used only for type narrowing in templates when filtering topics */
export type { BlogTopicId };
