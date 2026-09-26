import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
  htmlToMarkdown,
  markdownToHtml,
  readClipboardAsMarkdown,
  splitHtmlAtCaret,
} from '@/utils/richText';

export type RichNoteHandle = {
  splitAtCaret: () => { before: string; after: string };
  focus: () => void;
};

type RichNoteFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onPasteMarkdown?: (markdown: string) => boolean;
  onFocus?: () => void;
  placeholder?: string;
  error?: boolean;
};

export const RichNoteField = forwardRef<RichNoteHandle, RichNoteFieldProps>(function RichNoteField(
  { value, onChange, onPasteMarkdown, onFocus, placeholder, error },
  ref,
) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    if (value === lastValue.current && node.innerHTML) return;
    lastValue.current = value;
    const html = markdownToHtml(value);
    if (node.innerHTML !== html) {
      node.innerHTML = html;
    }
  }, [value]);

  useImperativeHandle(ref, () => ({
    splitAtCaret() {
      const node = nodeRef.current;
      if (!node) return { before: value, after: '' };
      return splitHtmlAtCaret(node);
    },
    focus() {
      nodeRef.current?.focus();
    },
  }));

  const emit = () => {
    const node = nodeRef.current;
    if (!node) return;
    const markdown = htmlToMarkdown(node.innerHTML);
    lastValue.current = markdown;
    onChange(markdown);
  };

  return (
    <div
      ref={nodeRef}
      contentEditable
      role="textbox"
      aria-multiline="true"
      data-placeholder={placeholder}
      suppressContentEditableWarning
      className={`rich-note min-h-28 w-full rounded-xl border bg-panel px-3.5 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 ${
        error ? 'border-red-400' : 'border-line'
      }`}
      onInput={emit}
      onFocus={onFocus}
      onBlur={emit}
      onPaste={(event) => {
        event.preventDefault();
        const markdown = readClipboardAsMarkdown(event.clipboardData);
        if (!markdown) return;
        if (onPasteMarkdown?.(markdown)) return;
        const node = nodeRef.current;
        if (!node) return;
        const { before, after } = splitHtmlAtCaret(node);
        const next = `${before}${markdown}${after}`;
        lastValue.current = next;
        node.innerHTML = markdownToHtml(next);
        onChange(next);
      }}
    />
  );
});
