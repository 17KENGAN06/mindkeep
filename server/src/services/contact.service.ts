import { CONTACT_TOPIC_LABEL, inboxForTopic } from '@/config/contact.js';
import { sendEmail } from '@/services/email.service.js';
import type { SendContactInput } from '@/validations/contact.schemas.js';

function compact(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

export class ContactService {
  async send(input: SendContactInput): Promise<void> {
    const name = compact(input.name);
    const email = compact(input.email).toLowerCase();
    const message = compact(input.message);
    const topicLabel = CONTACT_TOPIC_LABEL[input.topic];
    const to = inboxForTopic(input.topic);

    await sendEmail({
      to,
      replyTo: email,
      subject: `[Mindkeep] ${topicLabel} — ${name}`,
      text: [
        `Topic: ${topicLabel}`,
        `Inbox: ${to}`,
        `Name: ${name}`,
        `Email: ${email}`,
        '',
        message,
      ].join('\n'),
    });
  }
}

export const contactService = new ContactService();
