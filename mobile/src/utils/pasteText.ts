export function normalizePastedText(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0|\u202F|\u2007/g, ' ')
    .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, '')
    .replace(/\n{4,}/g, '\n\n\n');
}

export function containsCodeFence(value: string): boolean {
  return /```/.test(value);
}
