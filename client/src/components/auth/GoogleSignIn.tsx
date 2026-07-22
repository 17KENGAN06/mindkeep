import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { env } from '@/config/env';

type GoogleSignInProps = {
  onCredential: (credential: string) => void;
  onError: () => void;
  disabled?: boolean;
};

type GoogleIdentity = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type: 'standard';
      theme: 'outline';
      size: 'large';
      shape: 'pill';
      text: 'continue_with';
      width: number;
    },
  ) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdentity;
      };
    };
  }
}

const SCRIPT_ID = 'google-identity-services';
const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export function GoogleSignIn({ onCredential, onError, disabled = false }: GoogleSignInProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const credentialRef = useRef(onCredential);
  const errorRef = useRef(onError);

  useEffect(() => {
    credentialRef.current = onCredential;
    errorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!env.googleClientId) return;

    let cancelled = false;
    const handleScriptError = () => errorRef.current();

    const render = () => {
      const identity = window.google?.accounts.id;
      const container = containerRef.current;
      if (cancelled || !identity || !container) return;

      container.replaceChildren();
      identity.initialize({
        client_id: env.googleClientId,
        cancel_on_tap_outside: true,
        callback: ({ credential }) => {
          if (credential) credentialRef.current(credential);
          else errorRef.current();
        },
      });
      identity.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: Math.max(200, Math.floor(container.clientWidth)),
      });
    };

    if (window.google?.accounts.id) {
      render();
      return () => {
        cancelled = true;
      };
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener('load', render);
    script.addEventListener('error', handleScriptError);

    return () => {
      cancelled = true;
      script?.removeEventListener('load', render);
      script?.removeEventListener('error', handleScriptError);
    };
  }, []);

  if (!env.googleClientId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs tracking-[0.14em] text-muted uppercase">{t('auth.or')}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="relative min-h-10 w-full overflow-hidden rounded-full">
        <div ref={containerRef} className="flex w-full justify-center" />
        {disabled ? (
          <div
            className="absolute inset-0 cursor-wait bg-panel/60"
            aria-label={t('auth.googleProcessing')}
          />
        ) : null}
      </div>
    </div>
  );
}
