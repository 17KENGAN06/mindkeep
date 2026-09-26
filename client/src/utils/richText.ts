import { normalizePastedText, pickPastedText } from '@/utils/pasteText';

const WORD = /[\p{L}\p{N}]/u;

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function joinInline(parts: string[]): string {
  let out = '';
  for (const part of parts) {
    if (!part) continue;
    if (!out) {
      out = part;
      continue;
    }
    const left = out.replace(/[*_`]+$/, '').slice(-1);
    const right = part.replace(/^[*_`]+/, '')[0] ?? '';
    if (left && right && WORD.test(left) && WORD.test(right) && !/\s$/.test(out) && !/^\s/.test(part)) {
      out += ` ${part}`;
      continue;
    }
    out += part;
  }
  return out;
}

function walkMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (!(node instanceof HTMLElement)) {
    return joinInline(Array.from(node.childNodes).map(walkMarkdown));
  }

  const name = node.nodeName;
  if (name === 'SCRIPT' || name === 'STYLE') return '';
  if (name === 'BR') return '\n';
  if (name === 'PRE') return `\n\`\`\`\n${node.textContent ?? ''}\n\`\`\`\n`;

  const inner = joinInline(Array.from(node.childNodes).map(walkMarkdown));
  if (name === 'STRONG' || name === 'B') return inner ? `**${inner}**` : '';
  if (name === 'EM' || name === 'I') return inner ? `*${inner}*` : '';
  if (name === 'CODE' && node.parentElement?.nodeName !== 'PRE') return inner ? `\`${inner}\`` : '';
  if (/^H[1-6]$/.test(name)) return `\n\n${'#'.repeat(Number(name[1]))} ${inner.trim()}\n\n`;
  if (name === 'LI') {
    const parent = node.parentElement;
    if (parent?.nodeName === 'OL') {
      const index = Array.from(parent.children).indexOf(node) + 1;
      return `${index}. ${inner.trim()}\n`;
    }
    return `- ${inner.trim()}\n`;
  }
  if (name === 'A') {
    const href = node.getAttribute('href') ?? '';
    if (/^https?:\/\//i.test(href)) return `[${inner}](${href})`;
    return inner;
  }
  if (name === 'UL' || name === 'OL') return `\n${inner}\n`;
  if (name === 'P' || name === 'DIV' || name === 'BLOCKQUOTE' || name === 'SECTION' || name === 'TR') {
    return `${inner.replace(/\n+$/, '')}\n\n`;
  }
  return inner;
}

export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return normalizePastedText(walkMarkdown(doc.body)).replace(/^\n+|\n+$/g, '');
}

function convertLists(text: string): string {
  return text.replace(/(?:^|\n)(?:(?:-|\d+\.) .+(?:\n(?:-|\d+\.) .+)*)/g, (block) => {
    const lines = block.trim().split('\n');
    const ordered = /^\d+\./.test(lines[0] ?? '');
    const items = lines.map((line) => line.replace(/^(?:-|\d+\.)\s+/, ''));
    const tag = ordered ? 'ol' : 'ul';
    return `\n<${tag}>${items.map((item) => `<li>${item}</li>`).join('')}</${tag}>\n`;
  });
}

export function markdownToHtml(markdown: string): string {
  const source = normalizePastedText(markdown).trim();
  if (!source) return '';

  let html = escapeHtml(source);
  html = html
    .replace(/^######\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^#####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  html = convertLists(html);
  html = html
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__([\s\S]+?)__/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return html
    .split(/\n{2,}/)
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return '';
      if (/^<(h[1-4]|ul|ol)\b/.test(trimmed)) return trimmed;
      const title = trimmed.match(/^<strong>([\s\S]+)<\/strong>$/);
      if (title) return `<h3>${title[1]}</h3>`;
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(Boolean)
    .join('');
}

export function readClipboardAsMarkdown(data: DataTransfer | null): string {
  if (!data) return '';
  const html = data.getData('text/html');
  const fromHtml = html.trim() ? htmlToMarkdown(html) : '';
  return pickPastedText(data.getData('text/plain'), fromHtml);
}

export function splitHtmlAtCaret(root: HTMLElement): { before: string; after: string } {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !root.contains(selection.anchorNode)) {
    return { before: htmlToMarkdown(root.innerHTML), after: '' };
  }

  const range = selection.getRangeAt(0);
  const beforeRange = range.cloneRange();
  beforeRange.selectNodeContents(root);
  beforeRange.setEnd(range.startContainer, range.startOffset);
  const afterRange = range.cloneRange();
  afterRange.selectNodeContents(root);
  afterRange.setStart(range.endContainer, range.endOffset);

  const before = document.createElement('div');
  const after = document.createElement('div');
  before.appendChild(beforeRange.cloneContents());
  after.appendChild(afterRange.cloneContents());
  return { before: htmlToMarkdown(before.innerHTML), after: htmlToMarkdown(after.innerHTML) };
}
