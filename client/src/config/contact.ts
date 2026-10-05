export const CONTACT_TOPICS = ['partnership', 'bug', 'question', 'billing'] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const MINDKEEP_CONTACT = 'contact@mindkeep.cloud';
export const MINDKEEP_ADMIN = 'admin@mindkeep.cloud';

export const CONTACT_INBOX = {
  partnership: MINDKEEP_CONTACT,
  support: MINDKEEP_ADMIN,
} as const;

export function inboxForTopic(topic: ContactTopic): string {
  return topic === 'bug' || topic === 'billing' ? MINDKEEP_ADMIN : MINDKEEP_CONTACT;
}
