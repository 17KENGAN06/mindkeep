import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { adminApi } from '@/api/admin';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';

export function AdminPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => (await adminApi.overview()).overview,
    enabled: user?.role === 'ADMIN',
  });

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => (await adminApi.users()).users,
    enabled: user?.role === 'ADMIN',
  });

  const reviewsQuery = useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: async () => (await adminApi.reviews()).reviews,
    enabled: user?.role === 'ADMIN',
  });

  const moderateReview = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'APPROVED' | 'REJECTED';
    }) => adminApi.moderateReview(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['reviews', 'approved'] });
    },
  });

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  if (overviewQuery.isLoading || usersQuery.isLoading || reviewsQuery.isLoading) {
    return <Loader />;
  }

  if (overviewQuery.isError || usersQuery.isError || reviewsQuery.isError) {
    return <ErrorMessage message={t('admin.loadError')} />;
  }

  const overview = overviewQuery.data;
  const users = usersQuery.data ?? [];
  const reviews = reviewsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          {t('admin.title')}
        </h1>
        <p className="mt-1 text-sm text-muted">{t('admin.subtitle')}</p>
      </div>

      {overview ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t('admin.stats.users')} value={overview.usersTotal} />
          <StatCard label={t('admin.stats.admins')} value={overview.adminsTotal} />
          <StatCard label={t('admin.stats.materials')} value={overview.materialsTotal} />
          <StatCard label={t('admin.stats.reminders')} value={overview.remindersTotal} />
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-line bg-panel">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{t('admin.reviewsTitle')}</h2>
        </div>
        {reviews.length === 0 ? (
          <div className="p-4">
            <EmptyState title={t('admin.reviewsEmpty')} />
          </div>
        ) : (
          <div className="divide-y divide-line">
            {reviews.map((review) => (
              <article key={review.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{review.user.name}</p>
                    <p className="text-xs text-muted">{review.user.email}</p>
                  </div>
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                    {review.rating}★ · {t(`admin.reviewStatus.${review.status}`)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink">{review.text}</p>
                {review.location ? (
                  <p className="mt-2 text-xs text-muted">{review.location}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() =>
                      moderateReview.mutate({ id: review.id, status: 'APPROVED' })
                    }
                    disabled={review.status === 'APPROVED' || moderateReview.isPending}
                  >
                    {t('admin.approveReview')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      moderateReview.mutate({ id: review.id, status: 'REJECTED' })
                    }
                    disabled={review.status === 'REJECTED' || moderateReview.isPending}
                  >
                    {t('admin.rejectReview')}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-line bg-panel">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{t('admin.usersTitle')}</h2>
        </div>

        {users.length === 0 ? (
          <div className="p-4">
            <EmptyState title={t('admin.empty')} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-brand-50/50 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.email')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.role')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.timezone')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.materials')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.reminders')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.created')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                    <td className="px-4 py-3 text-muted">{item.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${
                          item.role === 'ADMIN'
                            ? 'bg-brand-100 text-brand-500'
                            : 'bg-surface text-muted'
                        }`}
                      >
                        {item.role === 'ADMIN' ? t('admin.roles.admin') : t('admin.roles.user')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{item.timezone}</td>
                    <td className="px-4 py-3 text-ink">{item.materialsCount}</td>
                    <td className="px-4 py-3 text-ink">{item.remindersCount}</td>
                    <td className="px-4 py-3 text-muted">
                      {format(new Date(item.createdAt), 'yyyy-MM-dd')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className="font-display mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
