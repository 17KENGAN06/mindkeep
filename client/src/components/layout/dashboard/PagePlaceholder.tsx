type PagePlaceholderProps = {
  title: string;
  description: string;
  note?: string;
};

export function PagePlaceholder({ title, description, note }: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
      </section>

      <section className="rounded-3xl bg-panel p-6 shadow-sm ring-1 ring-line sm:p-8">
        <div className="rounded-2xl border border-dashed border-line bg-brand-50/40 px-4 py-12 text-center sm:px-8">
          <p className="text-base font-semibold text-ink">
            {note ?? 'Coming soon'}
          </p>
        </div>
      </section>
    </div>
  );
}
