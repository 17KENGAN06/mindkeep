import type { ReactNode } from 'react';

const STRIPE_URL = 'https://stripe.com';

function Mark({ children, label }: { children: ReactNode; label: string }) {
  return (
    <li>
      <span
        title={label}
        className="inline-flex h-8 w-[3.2rem] items-center justify-center overflow-hidden rounded-[0.45rem] bg-white shadow-[0_1px_2px_rgba(15,23,20,0.08)] ring-1 ring-black/10"
      >
        {children}
        <span className="sr-only">{label}</span>
      </span>
    </li>
  );
}

type PaymentMarksProps = {
  compact?: boolean;
  label: string;
  via: string;
  ariaLabel: string;
  stripeLabel: string;
};

export function PaymentMarks({ compact = false, label, via, ariaLabel, stripeLabel }: PaymentMarksProps) {
  return (
    <div className={`min-w-0 ${compact ? '' : 'md:text-right'}`}>
      {compact ? (
        <p className="mb-2 text-[11px] leading-relaxed text-muted">{via}</p>
      ) : (
        <>
          <p className="text-[11px] tracking-[0.24em] text-muted uppercase">{label}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{via}</p>
        </>
      )}
      <ul
        aria-label={ariaLabel}
        className={`flex flex-wrap items-center gap-1.5 ${compact ? '' : 'mt-3 md:justify-end'}`}
      >
        <Mark label="Visa">
          <svg viewBox="0 0 50 32" className="h-8 w-[3.2rem]" aria-hidden>
            <rect width="50" height="32" rx="6" fill="#1A1F71" />
            <text
              x="25"
              y="21"
              textAnchor="middle"
              fill="#fff"
              fontFamily="Arial, Helvetica, sans-serif"
              fontSize="13"
              fontStyle="italic"
              fontWeight="800"
              letterSpacing="1.1"
            >
              VISA
            </text>
          </svg>
        </Mark>
        <Mark label="Mastercard">
          <svg viewBox="0 0 50 32" className="h-8 w-[3.2rem]" aria-hidden>
            <rect width="50" height="32" rx="6" fill="#F5F5F5" />
            <circle cx="21" cy="16" r="8.5" fill="#EB001B" />
            <circle cx="29" cy="16" r="8.5" fill="#F79E1B" />
          </svg>
        </Mark>
        <Mark label="American Express">
          <svg viewBox="0 0 50 32" className="h-8 w-[3.2rem]" aria-hidden>
            <rect width="50" height="32" rx="6" fill="#016FD0" />
            <text
              x="25"
              y="20.5"
              textAnchor="middle"
              fill="#fff"
              fontFamily="Arial, Helvetica, sans-serif"
              fontSize="10"
              fontWeight="800"
              letterSpacing="0.7"
            >
              AMEX
            </text>
          </svg>
        </Mark>
        <li>
          <a
            href={STRIPE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={stripeLabel}
            title={stripeLabel}
            className="inline-flex h-8 w-[3.55rem] items-center justify-center overflow-hidden rounded-[0.45rem] bg-white no-underline shadow-[0_1px_2px_rgba(15,23,20,0.08)] ring-1 ring-black/10 transition hover:ring-[#635BFF]/45"
          >
            <svg viewBox="0 0 56 32" className="h-8 w-[3.55rem]" aria-hidden>
              <text
                x="28"
                y="21"
                textAnchor="middle"
                fill="#635BFF"
                fontFamily="Georgia, Times New Roman, serif"
                fontSize="14"
                fontStyle="italic"
                fontWeight="700"
                letterSpacing="-0.4"
              >
                stripe
              </text>
            </svg>
          </a>
        </li>
      </ul>
    </div>
  );
}
