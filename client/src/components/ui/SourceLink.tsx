import { ArrowUpRight, Link2 } from 'lucide-react';
import { parseSourceUrl } from '@/utils/url';

type SourceLinkProps = {
  href: string;
  actionLabel: string;
};

export function SourceLink({ href, actionLabel }: SourceLinkProps) {
  const { host, path } = parseSourceUrl(href);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-3 rounded-2xl bg-surface px-3.5 py-3 no-underline ring-1 ring-line transition hover:ring-brand-300"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 ring-1 ring-line">
        <Link2 className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{host}</span>
        {path ? <span className="mt-0.5 block truncate text-xs text-muted">{path}</span> : null}
      </span>
      <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-brand-500">
        {actionLabel}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </a>
  );
}
