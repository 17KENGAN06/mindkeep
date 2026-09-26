import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RichNoteField, type RichNoteHandle } from '@/components/materials/RichNoteField';
import {
  ensureEditableBlocks,
  insertCodeAfter,
  insertCodeSplit,
  parseContentBlocks,
  removeCodeBlock,
  serializeContentBlocks,
  type ContentBlock,
} from '@/utils/contentBlocks';
import { containsCodeFence, insertAtCursor, readClipboard } from '@/utils/pasteText';

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
  const richRefs = useRef<Record<string, RichNoteHandle | null>>({});

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

  const addCodeInText = (textId: string) => {
    focusedTextId.current = textId;
    const split = richRefs.current[textId]?.splitAtCaret();
    if (split) {
      commit(insertCodeSplit(blocks, textId, split.before, split.after));
      return;
    }
    commit(insertCodeAfter(blocks, textId));
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
            <div key={block.id} className="overflow-hidden rounded-2xl bg-[#0a1611] ring-1 ring-line">
              <div className="flex items-center justify-between gap-3 border-b border-line/80 bg-transparent px-5 py-3">
                <input
                  value={block.language}
                  onChange={(event) =>
                    commit(updateBlock(blocks, block.id, { language: event.target.value }))
                  }
                  placeholder={t('materials.fields.codeLanguage')}
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-muted outline-none"
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
                onPaste={(event) => {
                  const pasted = readClipboard(event.clipboardData);
                  if (!pasted) return;
                  event.preventDefault();
                  const target = event.currentTarget;
                  const nextValue = insertAtCursor(
                    target.value,
                    pasted,
                    target.selectionStart ?? target.value.length,
                    target.selectionEnd ?? target.selectionStart ?? target.value.length,
                  );
                  commit(updateBlock(blocks, block.id, { value: nextValue }));
                }}
                spellCheck={false}
                rows={8}
                placeholder={t('materials.fields.codePlaceholder')}
                className="min-h-36 w-full resize-y bg-transparent px-5 py-5 font-mono text-[13px] leading-7 text-ink outline-none"
              />
            </div>
          ) : (
            <div key={block.id} className="space-y-2">
              <RichNoteField
                ref={(handle) => {
                  richRefs.current[block.id] = handle;
                }}
                value={block.value}
                error={Boolean(error)}
                placeholder={
                  blocks[index - 1]?.type === 'code'
                    ? t('materials.fields.contentContinue')
                    : t('materials.fields.content')
                }
                onFocus={() => {
                  focusedTextId.current = block.id;
                }}
                onChange={(next) => {
                  focusedTextId.current = block.id;
                  commit(updateBlock(blocks, block.id, { value: next }));
                }}
                onPasteMarkdown={(markdown) => {
                  focusedTextId.current = block.id;
                  if (!containsCodeFence(markdown)) return false;
                  const split = richRefs.current[block.id]?.splitAtCaret() ?? {
                    before: block.value,
                    after: '',
                  };
                  const nextValue = `${split.before}${markdown}${split.after}`;
                  commit(
                    ensureEditableBlocks(
                      parseContentBlocks(
                        serializeContentBlocks(updateBlock(blocks, block.id, { value: nextValue })),
                      ),
                    ),
                  );
                  return true;
                }}
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
