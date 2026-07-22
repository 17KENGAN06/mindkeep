type BrandMarkProps = {
  className?: string;
  title?: string;
};

/** Mindkeep mark — leaf/page + revisit orbit (3·7·30). */
export function BrandMark({ className = 'h-8 w-8', title = 'Mindkeep' }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <rect width="64" height="64" rx="16" className="fill-[var(--app-surface)]" />
      <circle cx="32" cy="32" r="22" className="stroke-[var(--app-line)]" strokeWidth="2" fill="none" />
      <circle
        cx="32"
        cy="32"
        r="15"
        className="stroke-brand-200"
        strokeWidth="1.5"
        strokeDasharray="3 5"
        fill="none"
      />
      <path
        d="M32 14c0 0-12 8-12 22 0 8 5.2 14 12 14s12-6 12-14C44 22 32 14 32 14Z"
        className="fill-brand-500"
      />
      <path
        d="M32 18v28"
        className="stroke-[var(--app-surface)]"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="46" cy="20" r="2.4" className="fill-brand-400" />
      <circle cx="50" cy="32" r="2.4" className="fill-brand-500" />
      <circle cx="46" cy="44" r="2.4" className="fill-brand-600" />
    </svg>
  );
}
