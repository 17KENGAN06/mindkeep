/** Same cap as the server (USER_NAME_MAX): a display name fits every screen. */
export const USER_NAME_MAX = 40;

/** Longest first name shown in a greeting before it is cut with "…". */
const GREETING_NAME_MAX = 18;

/** The first word of a display name, for greetings ("Hi, Anna" instead of the full name). */
export function firstName(name: string | null | undefined): string {
  const first = (name ?? '').trim().split(/\s+/)[0] ?? '';
  return first.length > GREETING_NAME_MAX ? `${first.slice(0, GREETING_NAME_MAX - 1)}…` : first;
}
