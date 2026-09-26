export type ContentBlock = {
  id: string;
  type: 'text' | 'code';
  value: string;
  language: string;
};

function nextId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createContentBlock(
  type: ContentBlock['type'],
  value = '',
  language = '',
): ContentBlock {
  return { id: nextId(), type, value, language };
}

export function ensureEditableBlocks(blocks: ContentBlock[]): ContentBlock[] {
  const next = blocks.map((block) => ({ ...block }));
  if (next.length === 0 || next[0]?.type === 'code') {
    next.unshift(createContentBlock('text'));
  }
  if (next[next.length - 1]?.type === 'code') {
    next.push(createContentBlock('text'));
  }
  return next;
}

export function insertCodeSplit(
  blocks: ContentBlock[],
  textBlockId: string,
  before: string,
  after: string,
): ContentBlock[] {
  const index = blocks.findIndex((block) => block.id === textBlockId && block.type === 'text');
  if (index < 0) {
    return insertCodeAfter(blocks);
  }
  const next = [...blocks];
  next.splice(
    index,
    1,
    createContentBlock('text', before),
    createContentBlock('code'),
    createContentBlock('text', after),
  );
  return next;
}

export function insertCodeAt(blocks: ContentBlock[], textBlockId: string, cursor: number): ContentBlock[] {
  const index = blocks.findIndex((block) => block.id === textBlockId && block.type === 'text');
  if (index < 0) {
    return insertCodeAfter(blocks);
  }

  const current = blocks[index]!;
  const at = Math.max(0, Math.min(cursor, current.value.length));
  const before = current.value.slice(0, at);
  const after = current.value.slice(at);
  const next = [...blocks];
  next.splice(
    index,
    1,
    createContentBlock('text', before),
    createContentBlock('code'),
    createContentBlock('text', after),
  );
  return next;
}

export function insertCodeAfter(blocks: ContentBlock[], afterId?: string): ContentBlock[] {
  const index = afterId ? blocks.findIndex((block) => block.id === afterId) : blocks.length - 1;
  const at = index < 0 ? blocks.length - 1 : index;
  const next = [...blocks];
  next.splice(at + 1, 0, createContentBlock('code'), createContentBlock('text'));
  return next;
}

export function removeCodeBlock(blocks: ContentBlock[], id: string): ContentBlock[] {
  const next: ContentBlock[] = [];
  for (const block of blocks) {
    if (block.id === id && block.type === 'code') continue;
    const last = next[next.length - 1];
    if (block.type === 'text' && last?.type === 'text') {
      last.value = [last.value, block.value].filter((part) => part.trim().length > 0).join('\n\n');
      continue;
    }
    next.push({ ...block });
  }
  if (next.length === 0 || next[0]?.type === 'code') {
    next.unshift(createContentBlock('text'));
  }
  if (next[next.length - 1]?.type === 'code') {
    next.push(createContentBlock('text'));
  }
  return next;
}

export function parseContentBlocks(raw: string): ContentBlock[] {
  const text = raw.replace(/\r\n/g, '\n');
  const blocks: ContentBlock[] = [];
  const fence = /```(\w*)[ \t]*\n([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = fence.exec(text)) !== null) {
    const before = text.slice(last, match.index).replace(/^\n+|\n+$/g, '');
    if (before.trim()) {
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

  const after = text.slice(last).replace(/^\n+|\n+$/g, '');
  if (after.trim()) {
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
      return block.value.replace(/^\n+|\n+$/g, '');
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
