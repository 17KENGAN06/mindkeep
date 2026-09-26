export type ContentBlock = {
  id: string;
  type: 'text' | 'code';
  value: string;
  language: string;
};

function nextId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseContentBlocks(raw: string): ContentBlock[] {
  const text = raw.replace(/\r\n/g, '\n');
  const blocks: ContentBlock[] = [];
  const fence = /```(\w*)[ \t]*\n([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = fence.exec(text)) !== null) {
    const before = text.slice(last, match.index).trim();
    if (before) {
      blocks.push({ id: nextId(), type: 'text', value: before, language: '' });
    }
    blocks.push({
      id: nextId(),
      type: 'code',
      value: (match[2] ?? '').replace(/\n$/, ''),
      language: match[1] ?? '',
    });
    last = match.index + match[0].length;
  }

  const after = text.slice(last).trim();
  if (after) {
    blocks.push({ id: nextId(), type: 'text', value: after, language: '' });
  }

  if (blocks.length === 0) {
    blocks.push({ id: nextId(), type: 'text', value: text, language: '' });
  }

  return blocks;
}

export function serializeContentBlocks(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'code') {
        const language = block.language.trim();
        return `\`\`\`${language}\n${block.value.replace(/\n+$/, '')}\n\`\`\``;
      }
      return block.value.trim();
    })
    .filter((part) => part.length > 0)
    .join('\n\n');
}

export function previewContent(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
