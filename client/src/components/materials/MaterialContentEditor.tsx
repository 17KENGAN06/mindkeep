import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ensureEditableBlocks,
  insertCodeAt,
  parseContentBlocks,
  removeCodeBlock,
  serializeContentBlocks,
  type ContentBlock,
} from '@/utils/contentBlocks';

type MaterialContentEditorProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  hint?: string;
  error?: string;
};

function updateBlock(blocks: ContentBlock[], id: string, patch: Partial<ContentBlock>): ContentBlock[] {
  return blocks.map((block) => (block.id === id ? { ...block, ...patch } : block));
}

export function MaterialContentEditor({
  value,
  onChange,
  label,
  hint,
  error,
}: MaterialContentEditorProps) {
  const { t } = useTranslation();
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => ensureEditableBlocks(parseContentBlocks(value)));
  const serializedRef = useRef(serializeContentBlocks(blocks));
  const focusedTextId = useRef(blocks.find((block) => block.type === 'text')?.id ?? '');
  const cursors = useRef<Record<string, number>>({});
  const textRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (value === serializedRef.current) return;
    const next = ensureEditableBlocks(parseContentBlocks(value));
    setBlocks(next);
    serializedRef.current = serializeContentBlocks(next);
  }, [value]);

  const commit = (next: ContentBlock[]) => {
    setBlocks(next);
    const serialized = serializeContentBlocks(next);
    serializedRef.current = serialized;
    onChange(serialized);
  };

  const rememberCursor = (id: string, target: HTMLTextAreaElement) => {
    focusedTextId.current = id;
    cursors.current[id] = target.selectionStart ?? target.value.length;
  };

  const addCodeInText = (textId: string) => {
    const field = textRefs.current[textId];
    const cursor = field?.selectionStart ?? cursors.current[textId] ?? field?.value.length ?? 0;
    commit(insertCodeAt(blocks, textId, cursor));
  };

  const addCode = () => {
    const textId =
      focusedTextId.current ||
      [...blocks].reverse().find((block) => block.type === 'text')?.id ||
      blocks[0]?.id;
    if (!textId) return;
    addCodeInText(textId);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        <button
          type="button"
          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-500 ring-1 ring-line hover:bg-brand-50"
          onClick={addCode}
        >
          {t('materials.addCodeBlock')}
        </button>
      </div>

      <div className="space-y-3">
        {blocks.map((block, index) =>
          block.type === 'code' ? (
            <div key={block.id} className="overflow-hidden rounded-2xl ring-1 ring-line">
              <div className="flex items-center justify-between gap-2 bg-brand-50 px-3 py-2">
                <input
                  value={block.language}
                  onChange={(event) =>
                    commit(updateBlock(blocks, block.id, { language: event.target.value }))
                  }
                  placeholder={t('materials.fields.codeLanguage')}
                  className="min-w-0 flex-1 bg-transparent text-base font-medium text-muted outline-none sm:text-xs"
                />
                <button
                  type="button"
                  className="text-xs font-semibold text-muted hover:text-ink"
                  onClick={() => commit(removeCodeBlock(blocks, block.id))}
                >
                  {t('materials.removeCodeBlock')}
                </button>
              </div>
              <textarea
                value={block.value}
                onChange={(event) => commit(updateBlock(blocks, block.id, { value: event.target.value }))}
                spellCheck={false}
                rows={8}
                placeholder={t('materials.fields.codePlaceholder')}
                className="min-h-36 w-full resize-y bg-[#08140f] px-3 py-3 font-mono text-base leading-relaxed text-ink outline-none sm:text-[13px]"
              />
            </div>
          ) : (
            <div key={block.id} className="space-y-2">
              <textarea
                ref={(node) => {
                  textRefs.current[block.id] = node;
                }}
                value={block.value}
                onChange={(event) => {
                  rememberCursor(block.id, event.currentTarget);
                  commit(updateBlock(blocks, block.id, { value: event.target.value }));
                }}
                onSelect={(event) => rememberCursor(block.id, event.currentTarget)}
                onClick={(event) => rememberCursor(block.id, event.currentTarget)}
                onKeyUp={(event) => rememberCursor(block.id, event.currentTarget)}
                rows={block.value.trim() ? 6 : 4}
                placeholder={
                  blocks[index - 1]?.type === 'code'
                    ? t('materials.fields.contentContinue')
                    : t('materials.fields.content')
                }
                className={`min-h-24 w-full rounded-xl border bg-panel px-3 py-2.5 text-base text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 ${
                  error ? 'border-red-400' : 'border-line'
                }`}
              />
              <button
                type="button"
                className="text-xs font-semibold text-brand-500 hover:underline"
                onClick={() => addCodeInText(block.id)}
              >
                {t('materials.insertCodeHere')}
              </button>
            </div>
          ),
        )}
      </div>

      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
