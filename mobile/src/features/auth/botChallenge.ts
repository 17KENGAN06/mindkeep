import { authApi } from '../../api/auth';

const MIN_CHALLENGE_AGE_MS = 450;

export async function issueBotToken(): Promise<string> {
  const started = Date.now();
  const { botToken } = await authApi.challenge();
  const wait = MIN_CHALLENGE_AGE_MS - (Date.now() - started);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  return botToken;
}
