import { CONTACT_TOPIC_LABEL, contactMailFrom, inboxForTopic } from '@/config/contact.js';
import { sendEmail } from '@/services/email.service.js';
import type { SendContactInput } from '@/validations/contact.schemas.js';

function compact(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function contactHtml(rows: Array<[string, string]>, message: string): string {
  const meta = rows
    .map(
      ([label, value]) =>
        `<p style="margin:0 0 8px;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f6f4ef;color:#1c1917;font-family:Georgia,serif;font-size:16px;line-height:1.5;">
  <div style="max-width:560px;margin:0 auto;padding:24px;background:#fff;border-radius:16px;">
    ${meta}
    <p style="margin:16px 0 8px;"><strong>Message:</strong></p>
    <p style="margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

export class ContactService {
  async send(input: SendContactInput): Promise<void> {
    const name = compact(input.name);
    const email = compact(input.email).toLowerCase();
    const message = compact(input.message);
    const topicLabel = CONTACT_TOPIC_LABEL[input.topic];
    const to = inboxForTopic(input.topic);
    const billingFlags =
      input.topic === 'billing'
        ? [
            `Exceptional-refund acknowledgment: ${input.exceptionAck ? 'yes' : 'no'}`,
            `Unused-time no-refund acknowledgment: ${input.noUnusedRefundAck ? 'yes' : 'no'}`,
            'Default product rule: refuse unless duplicate charge, no access after payment, or a binding legal order.',
          ]
        : [];
    const text = [
      `Topic: ${topicLabel}`,
      `Inbox: ${to}`,
      `Name: ${name}`,
      `Email: ${email}`,
      ...billingFlags,
      '',
      message,
    ].join('\n');

    await sendEmail({
      from: contactMailFrom(),
      to,
      replyTo: email,
      subject: `[MindKeep] ${topicLabel} — ${name}`,
      text,
      html: contactHtml(
        [
          ['Topic', topicLabel],
          ['Inbox', to],
          ['Name', name],
          ['Email', email],
          ...(input.topic === 'billing'
            ? ([
                ['Exceptional refund ack', input.exceptionAck ? 'yes' : 'no'],
                ['No unused-time refund ack', input.noUnusedRefundAck ? 'yes' : 'no'],
              ] as Array<[string, string]>)
            : []),
        ],
        message,
      ),
    });
  }
}

export const contactService = new ContactService();
