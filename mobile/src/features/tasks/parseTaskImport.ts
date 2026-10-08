// Same parser as the site (client/src/features/tasks/parseTaskImport.ts) so pasted text imports identically.

export type ParsedTaskImportRow = {
  title: string;
  minutes: number;
};

export type ParseTaskImportResult = {
  rows: ParsedTaskImportRow[];
  skipped: number;
};

function parseMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const hourMin = trimmed.match(/^(\d{1,2})\s*[:hч]\s*(\d{1,2})$/i);
  if (hourMin) {
    const total = Number(hourMin[1]) * 60 + Number(hourMin[2]);
    return total >= 1 && total <= 1440 ? total : null;
  }
  const match = trimmed.match(/(\d{1,4})/);
  if (!match) return null;
  const minutes = Number(match[1]);
  return minutes >= 1 && minutes <= 1440 ? minutes : null;
}

function splitCards(text: string, cardSep: string): string[] {
  if (cardSep === '\n') {
    return text.split(/\r?\n/);
  }
  return text.split(cardSep);
}

export function parseTaskImport(text: string, pairSep: string, cardSep: string): ParseTaskImportResult {
  const pair = pairSep || '\t';
  const card = cardSep || '\n';
  const rows: ParsedTaskImportRow[] = [];
  let skipped = 0;

  for (const raw of splitCards(text, card)) {
    const line = raw.trim();
    if (!line) continue;
    const sepIndex = line.indexOf(pair);
    if (sepIndex <= 0) {
      skipped += 1;
      continue;
    }
    const title = line.slice(0, sepIndex).trim();
    const minutes = parseMinutes(line.slice(sepIndex + pair.length));
    if (!title || minutes == null) {
      skipped += 1;
      continue;
    }
    rows.push({ title: title.slice(0, 200), minutes });
    if (rows.length >= 60) break;
  }

  return { rows, skipped };
}
