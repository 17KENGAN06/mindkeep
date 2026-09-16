export const CONTACT_TOPICS = ['partnership', 'bug', 'question'] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const CONTACT_INBOX = {
  partnership: 'partner@weisezahoy.com',
  support: 'admin@weisezahoy.com',
} as const;

export function inboxForTopic(topic: ContactTopic): string {
  return topic === 'partnership' ? CONTACT_INBOX.partnership : CONTACT_INBOX.support;
}
