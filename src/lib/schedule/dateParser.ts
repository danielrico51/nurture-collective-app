/**
 * Parse spreadsheet-style visit date labels into ISO dates (YYYY-MM-DD).
 * Examples: `1/10`, `1/17,19,24`, `2/13,14`, `1/28, 1/29, 2/4,6,9`
 */
export const parseVisitDatesLabel = (
  label: string,
  defaultYear: number
): string[] => {
  const trimmed = label.trim();
  if (!trimmed) return [];

  let year = defaultYear;
  let month = 1;
  const results: string[] = [];
  const seen = new Set<string>();

  const pushDate = (y: number, m: number, d: number) => {
    if (m < 1 || m > 12 || d < 1 || d > 31) return;
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (!seen.has(iso)) {
      seen.add(iso);
      results.push(iso);
    }
  };

  const segments = trimmed.split(/[,;]+/);
  for (const segment of segments) {
    const part = segment.trim();
    if (!part) continue;

    const fullMatch = part.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (fullMatch) {
      const m = Number(fullMatch[1]);
      const d = Number(fullMatch[2]);
      const yPart = fullMatch[3];
      const y = yPart
        ? yPart.length === 2
          ? 2000 + Number(yPart)
          : Number(yPart)
        : year;
      month = m;
      year = y;
      pushDate(y, m, d);
      continue;
    }

    const dayOnlyMatch = part.match(/^(\d{1,2})$/);
    if (dayOnlyMatch) {
      pushDate(year, month, Number(dayOnlyMatch[1]));
    }
  }

  return results.sort();
};
