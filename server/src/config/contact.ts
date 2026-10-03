export const CONTACT_TOPICS = ['partnership', 'bug', 'question'] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const MINDKEEP_CONTACT = 'contact@mindkeep.cloud';
export const MINDKEEP_ADMIN = 'admin@mindkeep.cloud';
/** Resend From for the contact form. Not a Hostinger mailbox — same-domain From→inbox is treated as spoofed. */
export const MINDKEEP_MAILER = 'hello@mindkeep.cloud';

export function contactMailFrom(): string {
  return `MindKeep <${MINDKEEP_MAILER}>`;
}

export const CONTACT_INBOX = {
  partnership: MINDKEEP_CONTACT,
  support: MINDKEEP_ADMIN,
} as const;

export function inboxForTopic(topic: ContactTopic): string {
  return topic === 'bug' ? MINDKEEP_ADMIN : MINDKEEP_CONTACT;
}

export const CONTACT_TOPIC_LABEL: Record<ContactTopic, string> = {
  partnership: 'Partnership / collaboration',
  bug: 'Bug report',
  question: 'Question',
};
