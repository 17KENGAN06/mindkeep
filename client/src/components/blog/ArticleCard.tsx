import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { blogArticles, type BlogArticleMeta } from '@/content/blog/articles';

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

type ArticleCardProps = {
  article: BlogArticleMeta;
  className?: string;
};

export function ArticleCard({ article, className = '' }: ArticleCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <article className={`glass-panel flex h-full flex-col rounded-[1.5rem] p-5 sm:p-6 ${className}`}>
      <p className="text-[11px] tracking-[0.2em] text-brand-500 uppercase">
        {t(`blog.topics.${article.topic}.label`)}
      </p>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-ink sm:text-xl">
        <Link to={`/blog/${article.slug}`} className="text-ink no-underline hover:text-brand-500">
          {t(`blog.articles.${article.slug}.title`)}
        </Link>
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {t(`blog.articles.${article.slug}.excerpt`)}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4 text-xs text-muted">
        <span>{article.author}</span>
        <span aria-hidden>·</span>
        <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, i18n.language)}</time>
      </div>
    </article>
  );
}

type BlogPreviewProps = {
  animated?: boolean;
};

export function BlogPreview({ animated = false }: BlogPreviewProps) {
  const { t } = useTranslation();
  const reveal = (extra = '') => (animated ? `snap-reveal ${extra}` : '');

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className={reveal('snap-reveal-left')}>
          <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
            {t('blog.eyebrow')}
          </p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t('blog.title')}
          </h2>
          <p className="mt-3 max-w-2xl text-muted sm:text-lg">{t('blog.subtitle')}</p>
        </div>
        <Link
          to="/blog"
          className={`${reveal('snap-reveal-d2 snap-reveal-right snap-pop')} inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-[#07110d] no-underline`}
        >
          {t('blog.viewAll')}
        </Link>
      </div>

      <div className="mt-10 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        {blogArticles.map((article, index) => (
          <ArticleCard
            key={article.slug}
            article={article}
            className={reveal(
              `min-w-0 snap-reveal-d${Math.min(index + 3, 6)} snap-reveal-scale snap-pop`,
            )}
          />
        ))}
      </div>
    </div>
  );
}
