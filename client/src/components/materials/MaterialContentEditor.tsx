import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  parseContentBlocks,
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
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => parseContentBlocks(value));
  const serializedRef = useRef(serializeContentBlocks(blocks));

  useEffect(() => {
    if (value === serializedRef.current) return;
    const next = parseContentBlocks(value);
    setBlocks(next);
    serializedRef.current = serializeContentBlocks(next);
  }, [value]);

  const commit = (next: ContentBlock[]) => {
    setBlocks(next);
    const serialized = serializeContentBlocks(next);
    serializedRef.current = serialized;
    onChange(serialized);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-500 ring-1 ring-line hover:bg-brand-50"
            onClick={() =>
              commit([...blocks, { id: `${Date.now()}-code`, type: 'code', value: '', language: '' }])
            }
          >
            {t('materials.addCodeBlock')}
          </button>
          {blocks[blocks.length - 1]?.type === 'code' ? (
            <button
              type="button"
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-muted ring-1 ring-line hover:bg-brand-50"
              onClick={() =>
                commit([...blocks, { id: `${Date.now()}-text`, type: 'text', value: '', language: '' }])
              }
            >
              {t('materials.addTextBlock')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {blocks.map((block) =>
          block.type === 'code' ? (
            <div key={block.id} className="overflow-hidden rounded-2xl ring-1 ring-line">
              <div className="flex items-center justify-between gap-2 bg-brand-50 px-3 py-2">
                <input
                  value={block.language}
                  onChange={(event) =>
                    commit(updateBlock(blocks, block.id, { language: event.target.value }))
                  }
                  placeholder={t('materials.fields.codeLanguage')}
                  className="min-w-0 flex-1 bg-transparent text-xs font-medium text-muted outline-none"
                />
                <button
                  type="button"
                  className="text-xs font-semibold text-muted hover:text-ink"
                  onClick={() => commit(blocks.filter((item) => item.id !== block.id))}
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
                className="min-h-36 w-full resize-y bg-[#08140f] px-3 py-3 font-mono text-[13px] leading-relaxed text-ink outline-none"
              />
            </div>
          ) : (
            <textarea
              key={block.id}
              value={block.value}
              onChange={(event) => commit(updateBlock(blocks, block.id, { value: event.target.value }))}
              rows={8}
              className={`min-h-28 w-full rounded-xl border bg-panel px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 ${
                error ? 'border-red-400' : 'border-line'
              }`}
            />
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
