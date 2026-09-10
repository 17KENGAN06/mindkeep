import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type FormattedTextProps = {
  text: string;
  className?: string;
};

/**
 * Renders pasted notes (ChatGPT / Markdown / plain text) with readable formatting.
 */
export function FormattedText({ text, className = '' }: FormattedTextProps) {
  const value = text.trim();
  if (!value) return null;

  return (
    <div className={`formatted-text text-sm leading-relaxed text-muted ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
    </div>
  );
}
