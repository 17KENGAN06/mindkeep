import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, MapPin, Quote, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reviewsApi } from '@/api/reviews';
import { Button } from '@/components/ui/Button';
import { testimonials } from '@/content/testimonials';
import { useAuth } from '@/features/auth/useAuth';
import type { AppLanguage } from '@/i18n';

type TestimonialsSectionProps = {
  animated?: boolean;
};

export function TestimonialsSection({ animated = false }: TestimonialsSectionProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState<'all' | 4 | 5>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const reveal = (extra = '') => (animated ? `snap-reveal ${extra}` : '');

  const approvedQuery = useQuery({
    queryKey: ['reviews', 'approved'],
    queryFn: async () => (await reviewsApi.approved()).reviews,
  });
  const eligibilityQuery = useQuery({
    queryKey: ['reviews', 'eligibility'],
    queryFn: async () => (await reviewsApi.eligibility()).eligibility,
    enabled: isAuthenticated,
  });
  const submitMutation = useMutation({
    mutationFn: reviewsApi.submit,
    onSuccess: () => {
      setText('');
      setLocation('');
      void queryClient.invalidateQueries({ queryKey: ['reviews', 'eligibility'] });
    },
  });

  const dynamic = (approvedQuery.data ?? []).map((item) => ({
    name: item.user.name,
    location: item.location || t('home.testimonials.communityMember'),
    quote: item.text,
    rating: item.rating,
  }));
  const localizedTestimonials = testimonials.map((item) => ({
    ...item,
    location: item.location[language],
    quote: item.quote[language],
  }));
  const allTestimonials = [...dynamic, ...localizedTestimonials];
  const filtered =
    ratingFilter === 'all'
      ? allTestimonials
      : allTestimonials.filter((item) => item.rating === ratingFilter);
  const current = filtered.length > 0 ? filtered[activeIndex % filtered.length] : null;

  const selectRating = (nextFilter: 'all' | 4 | 5) => {
    setRatingFilter(nextFilter);
    setActiveIndex(0);
  };

  const move = (direction: -1 | 1) => {
    if (filtered.length === 0) return;
    setActiveIndex((currentIndex) => {
      const next = currentIndex + direction;
      return next < 0 ? filtered.length - 1 : next % filtered.length;
    });
  };

  const submitReview = async () => {
    setSubmitError(null);
    try {
      await submitMutation.mutateAsync({ rating, text, location });
    } catch {
      setSubmitError(t('home.testimonials.submitError'));
    }
  };

  const eligibility = eligibilityQuery.data;
  const canSubmit =
    eligibility?.eligible &&
    (eligibility.reviewStatus === null || eligibility.reviewStatus === 'REJECTED');

  return (
    <div>
      <div className={reveal('snap-reveal-left')}>
        <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
          {t('home.testimonials.eyebrow')}
        </p>
        <h2 className="font-display mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
          {t('home.testimonials.title')}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {t('home.testimonials.subtitle')}
        </p>
      </div>

      <div className={`${reveal('snap-reveal-d2')} mt-5 flex flex-wrap items-center gap-2`}>
        {(['all', 5, 4] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => selectRating(filter)}
            className={`inline-flex min-h-10 items-center rounded-full border px-4 text-xs font-semibold transition ${
              ratingFilter === filter
                ? 'border-brand-500 bg-brand-100 text-brand-700'
                : 'border-line bg-panel/70 text-muted hover:border-brand-400 hover:text-ink'
            }`}
            aria-pressed={ratingFilter === filter}
          >
            {filter === 'all' ? t('home.testimonials.all') : `${filter}★`}
          </button>
        ))}
      </div>

      <div className={`${reveal('snap-reveal-d3 snap-reveal-scale')} mt-5`}>
        {current ? (
          <div className="flex items-stretch gap-3">
            <button
              type="button"
              onClick={() => move(-1)}
              className="inline-flex w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-panel text-ink transition hover:border-brand-400 hover:text-brand-500"
              aria-label={t('home.testimonials.previous')}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <article className="glass-panel flex min-h-64 min-w-0 flex-1 flex-col rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Quote className="h-6 w-6 text-brand-500" aria-hidden />
                  <div
                    className="flex gap-1"
                    aria-label={t('home.testimonials.rating', { count: current.rating })}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= current.rating
                            ? 'fill-brand-500 text-brand-500'
                            : 'text-line'
                        }`}
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-[9px] font-semibold tracking-[0.1em] text-brand-700 uppercase sm:text-[10px]">
                  {t('home.testimonials.beta')}
                </span>
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink/90 sm:text-base">
                “{current.quote}”
              </blockquote>
              <footer className="mt-5 border-t border-line/80 pt-4">
                <p className="font-semibold text-ink">{current.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden />
                  {current.location}
                </p>
              </footer>
            </article>
            <button
              type="button"
              onClick={() => move(1)}
              className="inline-flex w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-panel text-ink transition hover:border-brand-400 hover:text-brand-500"
              aria-label={t('home.testimonials.next')}
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      <div className={`${reveal('snap-reveal-d4')} mt-5 rounded-2xl border border-line bg-panel/65 p-4`}>
        {!isAuthenticated ? (
          <p className="text-sm text-muted">
            {t('home.testimonials.loginHint')}{' '}
            <Link to="/login" className="font-semibold text-brand-500 no-underline">
              {t('nav.login')}
            </Link>
          </p>
        ) : eligibility?.reviewStatus === 'PENDING' ? (
          <p className="text-sm text-muted">{t('home.testimonials.pending')}</p>
        ) : eligibility?.reviewStatus === 'APPROVED' ? (
          <p className="text-sm text-muted">{t('home.testimonials.approved')}</p>
        ) : canSubmit ? (
          <div className="grid gap-3 md:grid-cols-[auto_1fr_1fr_auto] md:items-end">
            <label className="text-xs font-medium text-muted">
              {t('home.testimonials.yourRating')}
              <select
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                className="mt-1 block min-h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink"
              >
                <option value={5}>5★</option>
                <option value={4}>4★</option>
                <option value={3}>3★</option>
                <option value={2}>2★</option>
                <option value={1}>1★</option>
              </select>
            </label>
            <label className="text-xs font-medium text-muted">
              {t('home.testimonials.yourReview')}
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                minLength={20}
                maxLength={1000}
                className="mt-1 block min-h-20 w-full resize-y rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="text-xs font-medium text-muted">
              {t('home.testimonials.yourLocation')}
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                maxLength={120}
                className="mt-1 block min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink"
              />
            </label>
            <Button
              type="button"
              onClick={() => void submitReview()}
              isLoading={submitMutation.isPending}
              disabled={text.trim().length < 20}
            >
              {t('home.testimonials.submit')}
            </Button>
            {submitError ? <p className="text-sm text-red-600 md:col-span-4">{submitError}</p> : null}
          </div>
        ) : eligibility ? (
          <div>
            <p className="text-sm text-muted">
              {t('home.testimonials.progressHint', {
                count: eligibility.completedCount,
                required: eligibility.requiredCount,
              })}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line/70">
              <div
                className="h-full rounded-full bg-brand-500 transition-[width]"
                style={{
                  width: `${Math.min(
                    100,
                    (eligibility.completedCount / eligibility.requiredCount) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
