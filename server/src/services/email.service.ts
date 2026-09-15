import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { AppError } from '@/utils/AppError.js';

type SendEmailInput = {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
};

function contactUnavailable(): never {
  throw new AppError('Contact form is temporarily unavailable', {
    statusCode: 503,
    code: 'CONTACT_UNAVAILABLE',
  });
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const from = env.EMAIL_FROM?.trim();
  const apiKey = env.RESEND_API_KEY?.trim();

  if (!from || !apiKey) {
    if (env.NODE_ENV === 'production') {
      logger.error('Contact email is not configured');
      contactUnavailable();
    }

    logger.info('Contact email skipped in development', {
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
    });
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      reply_to: input.replyTo,
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    logger.error('Resend rejected contact email', {
      status: response.status,
      details: details.slice(0, 500),
    });
    contactUnavailable();
  }
}
