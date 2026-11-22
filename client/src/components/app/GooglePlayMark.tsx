/** One-colour play triangle for icon tiles. */
export function GooglePlayMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.2 2.6a1.6 1.6 0 0 0-.4 1.1v16.6c0 .4.1.8.4 1.1l9-9.4-9-9.4Z" opacity="0.65" />
      <path d="m14 11.2 2.7-2.8L6.3 2.4a1.7 1.7 0 0 0-1.3-.2l9 9Z" opacity="0.85" />
      <path d="m14 12.8-9 9c.4.1.9.1 1.3-.2l10.4-6L14 12.8Z" opacity="0.85" />
      <path d="m20.2 10.5-2.6-1.5-2.8 3 2.8 3 2.6-1.5c1.2-.7 1.2-2.3 0-3Z" />
    </svg>
  );
}
