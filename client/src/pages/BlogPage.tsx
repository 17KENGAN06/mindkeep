import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Reveal } from '@/components/motion/Reveal';
import {
  blogArticles,
  blogTopics,
  getArticleBySlug,
  topicFeature,
  type BlogTopicId,
} from '@/content/blog/articles';
import { PAGE_SHELL, PAGE_SHELL_Y } from '@/config/layout';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { articleFaq } from '@/seo/meta';
import { useLocalePath } from '@/seo/useLocalePath';

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
      <div className={`${PAGE_SHELL} ${PAGE_SHELL_Y}`}>
        <PublicHeader />

        <Reveal className="mt-12 sm:mt-16">
          <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
            {t('blog.eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
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

          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {blogArticles.map((article, index) => (
              <Reveal key={article.slug} className="min-w-0 h-full" delayMs={80 + index * 70}>
                <ArticleCard article={article} />
              </Reveal>
            ))}
          </div>
        </section>
        <SiteFooter embedded />
      </div>
    </div>
  );
}

export function BlogArticlePage() {
  const { localize } = useLocalePath();
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
  const faq = articleFaq(article.slug, (key) => t(key, { returnObjects: true }));

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className={`${PAGE_SHELL} ${PAGE_SHELL_Y}`}>
        <PublicHeader />

        <Reveal className="mt-8 text-sm">
          <Link to={localize('/blog')} className="font-medium text-brand-500 no-underline">
            ← {t('blog.back')}
          </Link>
        </Reveal>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <Reveal delayMs={60}>
            <article>
              <p className="text-[11px] tracking-[0.2em] text-brand-500 uppercase">
                {t(`blog.topics.${article.topic}.label`)}
              </p>
              <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {t(`blog.articles.${article.slug}.title`)}
              </h1>

              <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                <span>{t('blog.byAuthor', { author: article.author })}</span>
                <span aria-hidden>·</span>
                <time dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt, i18n.language)}
                </time>
              </div>

              <div className="prose-mindkeep mt-10 max-w-none space-y-5 text-base leading-relaxed text-ink/90 sm:text-lg">
                {paragraphs.map((paragraph, index) => (
                  <Reveal key={`${index}-${paragraph.slice(0, 24)}`} delayMs={100 + Math.min(index, 6) * 50}>
                    {/* "## " starts a subheading inside the article text. */}
                    {paragraph.startsWith('## ') ? (
                      <h2 className="pt-4 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                        {paragraph.slice(3)}
                      </h2>
                    ) : (
                      <p>{paragraph}</p>
                    )}
                  </Reveal>
                ))}
              </div>

              {faq.length > 0 ? (
                <section className="mt-12" aria-labelledby="article-faq">
                  <h2 id="article-faq" className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                    {t('blog.faqTitle')}
                  </h2>
                  <div className="mt-5 divide-y divide-line rounded-2xl bg-panel ring-1 ring-line">
                    {faq.map((item) => (
                      <details key={item.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-ink">
                          {item.q}
                          <span className="text-xl leading-none text-brand-500 transition group-open:rotate-45" aria-hidden>
                            +
                          </span>
                        </summary>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted">{item.a}</p>
                      </details>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="mt-12 rounded-2xl bg-brand-500/[0.07] p-6 ring-1 ring-brand-500/25 sm:p-7">
                <p className="text-lg font-semibold tracking-tight text-ink">{t('blog.ctaTitle')}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{t('blog.ctaText')}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <Link
                    to="/register"
                    className="inline-flex min-h-11 items-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-on-brand no-underline transition hover:bg-brand-400"
                  >
                    {t('blog.ctaButton')}
                  </Link>
                  <Link
                    to={localize(`/features/${topicFeature[article.topic]}`)}
                    className="text-sm font-semibold text-brand-500 no-underline hover:text-brand-400"
                  >
                    {t(`landing.pages.${topicFeature[article.topic]}.nav`)} →
                  </Link>
                </div>
              </div>
            </article>
          </Reveal>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <Reveal delayMs={80}>
              <div className="glass-panel rounded-2xl p-5 sm:p-6">
                <p className="text-[11px] tracking-[0.18em] text-brand-500 uppercase">
                  {t('blog.originLabel')}
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-ink">{article.originator}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {t(`blog.articles.${article.slug}.originNote`)}
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={120}>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-ink">{t('blog.moreTitle')}</h2>
                <div className="mt-4 grid gap-4">
                  {blogArticles
                    .filter((item) => item.slug !== article.slug)
                    .slice(0, 2)
                    .map((item) => (
                      <ArticleCard key={item.slug} article={item} />
                    ))}
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
        <SiteFooter embedded />
      </div>
    </div>
  );
}

/** Used only for type narrowing in templates when filtering topics */
export type { BlogTopicId };
