import { isValidElement, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { highlightCode, languageLabel } from '@/utils/highlight';
import { isHttpUrl, sourceHost } from '@/utils/url';

type FormattedTextProps = {
  text: string;
  className?: string;
};

function textFromChildren(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(textFromChildren).join('');
  return '';
}

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
    <div className="material-code my-4 overflow-hidden rounded-2xl bg-[#0a1611] ring-1 ring-line">
      <div className="flex items-center justify-between gap-3 border-b border-line/80 px-5 py-3">
        <span className="text-[11px] font-semibold tracking-wide text-muted uppercase">
          {languageLabel(language) || t('materials.fields.codeBlock')}
        </span>
        <button
          type="button"
          className="text-[11px] font-semibold text-brand-500 hover:underline"
          onClick={() => void onCopy()}
        >
          {copied ? t('materials.copiedCode') : t('materials.copyCode')}
        </button>
      </div>
      <pre className="material-code__body m-0 overflow-x-auto">
        <code
          className="hljs block whitespace-pre-wrap break-words bg-transparent p-0 font-mono text-[13px] leading-7"
          dangerouslySetInnerHTML={{ __html: highlightCode(value, language) }}
        />
      </pre>
    </div>
  );
}

function isTitleParagraph(children: ReactNode): boolean {
  const parts = Array.isArray(children) ? children : [children];
  const visible = parts.filter((part) => {
    if (part == null || part === false) return false;
    if (typeof part === 'string' || typeof part === 'number') return String(part).trim().length > 0;
    return true;
  });
  if (visible.length !== 1) return false;
  const only = visible[0];
  return isValidElement(only) && (only.type === 'strong' || only.type === 'b');
}

function MarkdownLink({ href, children }: { href?: string; children: ReactNode }) {
  if (!href) return <>{children}</>;
  if (href.startsWith('#') || href.startsWith('/')) {
    return <a href={href}>{children}</a>;
  }

  const raw = textFromChildren(children).trim();
  const label = !raw || raw === href || isHttpUrl(raw) ? sourceHost(href) : children;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="material-link">
      <span className="min-w-0 truncate">{label}</span>
      <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden />
    </a>
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
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className: codeClass, children }) {
            const language = /language-(\w+)/.exec(codeClass ?? '')?.[1] ?? '';
            const isBlock = Boolean(codeClass) || String(children).includes('\n');
            if (!isBlock) {
              return <code className={codeClass}>{children}</code>;
            }
            return <CodeBlock language={language}>{children}</CodeBlock>;
          },
          a({ href, children }) {
            return <MarkdownLink href={href}>{children}</MarkdownLink>;
          },
          p({ children }) {
            if (isTitleParagraph(children)) {
              return <h3>{children}</h3>;
            }
            return <p>{children}</p>;
          },
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}
