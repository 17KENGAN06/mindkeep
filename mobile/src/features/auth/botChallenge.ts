import { authApi } from '../../api/auth';

/** Server rejects tokens younger than 400 ms (`botProtection.service.ts`); keep a margin. */
const MIN_CHALLENGE_AGE_MS = 450;

/**
 * Fetches a bot-protection token and waits until it is old enough to be accepted.
 * The wait starts when the response arrives, not when the request started: on a phone the
 * challenge request can spend most of its time on DNS/TLS before reaching the server, while
 * the follow-up request reuses the connection and arrives fast, so timing from the start
 * could deliver a token the server still sees as "too fast".
 */
export async function issueBotToken(): Promise<string> {
  const { botToken } = await authApi.challenge();
  await new Promise((resolve) => setTimeout(resolve, MIN_CHALLENGE_AGE_MS));
  return botToken;
}
