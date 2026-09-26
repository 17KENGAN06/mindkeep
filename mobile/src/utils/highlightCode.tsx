import { Text } from 'react-native';

const TOKEN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#(?!\{)[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:abstract|as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|from|function|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|true|try|type|typeof|undefined|var|void|while|with|yield)\b|\b\d+(?:\.\d+)?\b)/g;

function tokenColor(part: string, ink: string): string {
  if (/^(\/\/|\/\*|#(?!\{))/.test(part)) return '#7d9a8c';
  if (/^['"`]/.test(part)) return '#e8c07a';
  if (/^\d/.test(part)) return '#7ec8e3';
  if (/^[A-Za-z]/.test(part)) return '#8eefb4';
  return ink;
}

type HighlightedCodeProps = {
  value: string;
  color: string;
};

export function HighlightedCode({ value, color }: HighlightedCodeProps) {
  const parts = value.split(TOKEN).filter((part) => part.length > 0);
  return (
    <Text style={{ color, fontFamily: 'monospace', fontSize: 13, lineHeight: 22 }}>
      {parts.map((part, index) => (
        <Text key={`${index}-${part.slice(0, 8)}`} style={{ color: tokenColor(part, color) }}>
          {part}
        </Text>
      ))}
    </Text>
  );
}
