const WORD = /[\p{L}\p{N}]/u;

export function normalizePastedText(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0|\u202F|\u2007/g, ' ')
    .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, ' ')
    .replace(/[^\S\n]{2,}/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n');
}

export function spaceRatio(value: string): number {
  const letters = value.replace(/[^\p{L}\p{N}]+/gu, '');
  if (letters.length < 8) return 1;
  return (value.match(/[ \t]/g) ?? []).length / letters.length;
}

export function looksJammed(value: string): boolean {
  return spaceRatio(value) < 0.06;
}

export function pickPastedText(plain: string, fromHtml: string): string {
  const p = normalizePastedText(plain);
  const h = normalizePastedText(fromHtml);
  const pScore = spaceRatio(p);
  const hScore = spaceRatio(h);

  if (pScore >= 0.06 && hScore >= 0.06) {
    const htmlRicher = h.includes('**') || /^#{1,4} /m.test(h) || /^- /m.test(h);
    if (htmlRicher && hScore >= pScore * 0.75) return h;
    return pScore >= hScore ? p : h;
  }
  if (pScore >= 0.06) return p;
  if (hScore >= 0.06) return h;
  return pScore >= hScore ? p || h : h || p;
}

function joinInline(parts: string[]): string {
  let out = '';
  for (const part of parts) {
    if (!part) continue;
    if (!out) {
      out = part;
      continue;
    }
    if (WORD.test(out.slice(-1)) && WORD.test(part[0] ?? '')) {
      out += ` ${part}`;
      continue;
    }
    out += part;
  }
  return out;
}

export function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (!(node instanceof HTMLElement)) {
      return joinInline(Array.from(node.childNodes).map(walk));
    }

    const name = node.nodeName;
    if (name === 'SCRIPT' || name === 'STYLE') return '';
    if (name === 'BR') return '\n';
    if (name === 'PRE') return `${node.textContent ?? ''}\n`;

    const inner = joinInline(Array.from(node.childNodes).map(walk));
    if (/^H[1-6]$/.test(name)) {
      return `${'#'.repeat(Number(name[1]))} ${inner.trim()}\n\n`;
    }
    if (name === 'LI') return `- ${inner.trim()}\n`;
    if (name === 'P' || name === 'DIV' || name === 'BLOCKQUOTE' || name === 'TR') {
      return `${inner.replace(/\n+$/, '')}\n\n`;
    }
    return inner;
  };

  return normalizePastedText(walk(doc.body));
}

export function readClipboard(data: DataTransfer | null): string {
  if (!data) return '';
  const html = data.getData('text/html');
  const fromHtml = html.trim() ? htmlToPlainText(html) : '';
  return pickPastedText(data.getData('text/plain'), fromHtml);
}

export function insertAtCursor(value: string, incoming: string, start: number, end = start): string {
  const from = Math.max(0, Math.min(start, value.length));
  const to = Math.max(from, Math.min(end, value.length));
  return `${value.slice(0, from)}${incoming}${value.slice(to)}`;
}

export function containsCodeFence(value: string): boolean {
  return /```/.test(value);
}
