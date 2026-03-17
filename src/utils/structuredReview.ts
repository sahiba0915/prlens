import chalk from "chalk";

export type NumberedSection = {
  /** e.g. "Critical Issues" */
  title: string;
  /** Section body, trimmed, may be empty string */
  body: string;
};

export type ParsedNumberedOutput = {
  sections: NumberedSection[];
  raw: string;
};

/**
 * Parses output that follows the format:
 * 1. Critical Issues
 * <text>
 * 2. Improvements
 * <text>
 * ...
 */
export function parseNumberedHeadings(raw: string): ParsedNumberedOutput {
  const text = (raw ?? "").trim();
  if (!text) return { sections: [], raw: "" };

  const collect = (re: RegExp, titleGroup: number): Array<{ index: number; title: string }> => {
    const matches: Array<{ index: number; title: string }> = [];
    for (const m of text.matchAll(re)) {
      matches.push({ index: m.index ?? 0, title: (m[titleGroup] ?? "").trim() });
    }
    return matches;
  };

  // Prefer the explicitly requested format first.
  let matches = collect(/^(\d+)\.\s+(.+)\s*$/gm, 2);

  // Fallback: common markdown variants.
  if (matches.length === 0) matches = collect(/^\*\*(.+?)\*\*\s*$/gm, 1);
  if (matches.length === 0) matches = collect(/^#{2,6}\s+(.+?)\s*$/gm, 1);

  if (matches.length === 0) return { sections: [], raw: text };

  const sections: NumberedSection[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i]!.index;
    const end = i + 1 < matches.length ? matches[i + 1]!.index : text.length;
    const chunk = text.slice(start, end).trimEnd();

    const firstNl = chunk.indexOf("\n");
    const titleLine = firstNl === -1 ? chunk : chunk.slice(0, firstNl);
    const body = firstNl === -1 ? "" : chunk.slice(firstNl + 1).trim();

    const title = titleLine
      .replace(/^\d+\.\s+/, "")
      .replace(/^\*\*(.+)\*\*$/, "$1")
      .replace(/^#{2,6}\s+/, "")
      .trim() || matches[i]!.title || `Section ${i + 1}`;
    sections.push({ title, body });
  }

  return { sections, raw: text };
}

export function formatStructuredReview(parsed: ParsedNumberedOutput): string {
  const { sections, raw } = parsed;
  if (sections.length === 0) return raw;

  const out: string[] = [];
  for (const s of sections) {
    out.push(chalk.bold(s.title));
    out.push(s.body ? s.body : chalk.gray("(none)"));
    out.push("");
  }
  return out.join("\n").trimEnd();
}

