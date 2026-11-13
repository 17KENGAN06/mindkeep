import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { nutritionSources, type NutritionSourceId } from '@/features/nutrition/sources';

/** The list of sources: what each one backs, its title and citation, opens in a new tab. */
export function NutritionSourcesList({ only }: { only?: NutritionSourceId[] }) {
  const { t } = useTranslation();
  const list = only ? nutritionSources.filter((source) => only.includes(source.id)) : nutritionSources;

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {list.map((source) => (
        <li key={source.id}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full flex-col gap-1 rounded-2xl bg-surface/60 px-4 py-3 no-underline ring-1 ring-line transition hover:ring-brand-500/50 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <span className="text-[11px] font-semibold tracking-wide text-brand-500 uppercase">
              {t(`calories.sources.topics.${source.id}`)}
            </span>
            <span className="text-sm leading-snug font-semibold text-ink">{source.title}</span>
            <span className="text-xs text-muted">{source.citation}</span>
            <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-semibold text-brand-500">
              {t('calories.sources.open')}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Section at the end of the Nutrition page: every source behind its numbers. */
export function NutritionSourcesSection() {
  const { t } = useTranslation();
  return (
    <section id="nutrition-sources" className="scroll-mt-6 space-y-3 rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
      <h2 className="text-lg font-semibold text-ink">{t('calories.sources.title')}</h2>
      <p className="text-sm text-muted">{t('calories.sources.lead')}</p>
      <NutritionSourcesList />
      <p className="text-xs leading-relaxed text-muted">{t('calories.sources.notAdvice')}</p>
    </section>
  );
}
