import { useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';

type FormattedTextProps = {
  text: string;
  className?: string;
};

function CodeBlock({ language, children }: { language: string; children: ReactNode }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const value = String(children).replace(/\n$/, '');

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-2xl bg-[#08140f] ring-1 ring-line">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-[11px] font-semibold tracking-wide text-muted uppercase">
          {language || t('materials.fields.codeBlock')}
        </span>
        <button
          type="button"
          className="text-[11px] font-semibold text-brand-500 hover:underline"
          onClick={() => void onCopy()}
        >
          {copied ? t('materials.copiedCode') : t('materials.copyCode')}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto px-4 pb-4">
        <code className="bg-transparent p-0 font-mono text-[13px] leading-relaxed text-ink">{value}</code>
      </pre>
    </div>
  );
}

/**
 * Renders pasted notes (ChatGPT / Markdown / plain text) with readable formatting.
 */
export function FormattedText({ text, className = '' }: FormattedTextProps) {
  const value = text.trim();
  if (!value) return null;

  return (
    <div className={`formatted-text text-sm leading-relaxed text-muted ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className, children }) {
            const language = /language-(\w+)/.exec(className ?? '')?.[1] ?? '';
            const isBlock = Boolean(className) || String(children).includes('\n');
            if (!isBlock) {
              return <code className={className}>{children}</code>;
            }
            return <CodeBlock language={language}>{children}</CodeBlock>;
          },
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}
