import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BotGuard } from '@/components/auth/BotGuard';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { contactApi } from '@/api/contact';
import { CONTACT_INBOX, inboxForTopic, type ContactTopic } from '@/config/contact';
import { mapContactError } from '@/features/contact/mapContactError';
import { createContactFormSchema, type ContactFormValues } from '@/schemas/contact';

export function ContactPage() {
  const { t } = useTranslation();
  const schema = createContactFormSchema(t);
  const [botToken, setBotToken] = useState<string | null>(null);
  const [humanChecked, setHumanChecked] = useState(false);
  const [botError, setBotError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      topic: '',
      name: '',
      email: '',
      message: '',
      website: '',
    },
  });

  const topic = useWatch({ control, name: 'topic' });
  const destination = topic ? inboxForTopic(topic as ContactTopic) : null;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    setBotError(undefined);

    if (!humanChecked) {
      setBotError(t('auth.bot.humanRequired'));
      return;
    }

    try {
      await contactApi.send({
        topic: values.topic as ContactTopic,
        name: values.name.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
        ...(botToken ? { botToken } : {}),
        website: values.website ?? '',
      });
      setSent(true);
    } catch (error) {
      setFormError(mapContactError(error, t));
    }
  });

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        <header className="flex items-center justify-between gap-3">
          <BrandLockup to="/" size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        <Reveal className="mt-12 max-w-3xl sm:mt-16">
          <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
            {t('contact.eyebrow')}
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t('contact.title')}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{t('contact.intro')}</p>
        </Reveal>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            href={`mailto:${CONTACT_INBOX.partnership}`}
            className="glass-panel rounded-2xl p-5 no-underline transition hover:ring-1 hover:ring-brand-300"
          >
            <p className="text-sm font-semibold text-ink">{t('contact.partnershipTitle')}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t('contact.partnershipBody')}</p>
            <p className="mt-3 break-all text-sm font-medium text-brand-500">{CONTACT_INBOX.partnership}</p>
          </a>
          <a
            href={`mailto:${CONTACT_INBOX.support}`}
            className="glass-panel rounded-2xl p-5 no-underline transition hover:ring-1 hover:ring-brand-300"
          >
            <p className="text-sm font-semibold text-ink">{t('contact.supportTitle')}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t('contact.supportBody')}</p>
            <p className="mt-3 break-all text-sm font-medium text-brand-500">{CONTACT_INBOX.support}</p>
          </a>
        </div>

        <Reveal className="mt-8" delayMs={80}>
          {sent ? (
            <div className="glass-panel rounded-3xl p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-ink">{t('contact.successTitle')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                {t('contact.successBody')}
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-brand-500 no-underline"
              >
                ← {t('nav.home')}
              </Link>
            </div>
          ) : (
            <form className="relative space-y-4 rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line sm:p-6" onSubmit={onSubmit} noValidate>
              <Select
                label={t('contact.fields.topic')}
                placeholder={t('contact.placeholders.topic')}
                error={errors.topic?.message}
                options={[
                  { value: 'partnership', label: t('contact.topics.partnership') },
                  { value: 'bug', label: t('contact.topics.bug') },
                  { value: 'question', label: t('contact.topics.question') },
                ]}
                {...register('topic')}
              />
              {destination ? (
                <p className="text-xs text-muted">{t('contact.destination', { email: destination })}</p>
              ) : null}

              <Input
                label={t('contact.fields.name')}
                autoComplete="name"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label={t('contact.fields.email')}
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Textarea
                label={t('contact.fields.message')}
                placeholder={t('contact.placeholders.message')}
                rows={8}
                className="min-h-40"
                error={errors.message?.message}
                {...register('message')}
              />

              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
                {...register('website')}
              />

              <BotGuard
                onReady={setBotToken}
                humanChecked={humanChecked}
                onHumanCheckedChange={setHumanChecked}
                error={botError}
              />

              <ErrorMessage message={formError} />

              <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting} className="w-full">
                {t('contact.send')}
              </Button>
            </form>
          )}
        </Reveal>

        <Link to="/" className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-brand-500 no-underline">
          ← {t('nav.home')}
        </Link>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SiteFooter embedded />
      </div>
    </div>
  );
}
