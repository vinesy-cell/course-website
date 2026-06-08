import fs from "node:fs";

export function readDocument(filePath) {
  const markdown = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  const lines = markdown.split("\n");
  const headings = [];

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (match) {
      headings.push({
        level: match[1].length,
        title: match[2].trim(),
        line: index,
        start: index + 1,
        end: lines.length,
      });
    }
  });

  headings.forEach((heading, index) => {
    const next = headings
      .slice(index + 1)
      .find((candidate) => candidate.level <= heading.level);
    if (next) heading.end = next.line;
  });

  return { markdown, lines, headings };
}

export function findHeading(document, title, options = {}) {
  const { within, level } = options;
  return document.headings.find((heading) => {
    if (heading.title !== title) return false;
    if (level && heading.level !== level) return false;
    if (within && !(heading.line > within.line && heading.line < within.end)) {
      return false;
    }
    return true;
  });
}

export function childHeadings(document, parent, level = parent.level + 1) {
  return document.headings.filter(
    (heading) =>
      heading.level === level &&
      heading.line > parent.line &&
      heading.line < parent.end,
  );
}

export function sectionLines(document, heading) {
  if (!heading) return [];
  return document.lines.slice(heading.start, heading.end);
}

export function sectionText(document, heading) {
  return sectionLines(document, heading).join("\n").trim();
}

export function cleanInline(text) {
  return String(text || "")
    .replace(/!\[\[[^\]]+\]\]/g, "")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function paragraphs(lines) {
  const result = [];
  let current = [];

  const flush = () => {
    const value = cleanInline(current.join(" "));
    if (value) result.push(value);
    current = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      /^#{1,6}\s/.test(trimmed) ||
      /^[-*]\s+/.test(trimmed) ||
      /^\d+\.\s+/.test(trimmed) ||
      /^\|/.test(trimmed) ||
      /^```/.test(trimmed) ||
      /^>/.test(trimmed)
    ) {
      flush();
      continue;
    }
    if (/^[^：:]{1,16}[：:]$/.test(trimmed)) {
      flush();
      continue;
    }
    current.push(trimmed);
  }
  flush();
  return result;
}

export function bullets(lines) {
  return lines
    .map((line) => line.match(/^\s*[-*]\s+(.+?)\s*$/))
    .filter(Boolean)
    .map((match) => cleanInline(match[1]));
}

export function numbered(lines) {
  return lines
    .map((line) => line.match(/^\s*\d+\.\s+(.+?)\s*$/))
    .filter(Boolean)
    .map((match) => cleanInline(match[1]));
}

export function table(lines) {
  const rows = lines
    .filter((line) => /^\s*\|.*\|\s*$/.test(line))
    .map((line) =>
      line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((cell) => cleanInline(cell)),
    )
    .filter(
      (row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, ""))),
    );

  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])),
  );
}

export function labeledList(lines, label) {
  const index = lines.findIndex(
    (line) => line.trim() === `${label}：` || line.trim() === `${label}:`,
  );
  if (index < 0) return [];

  const result = [];
  for (const line of lines.slice(index + 1)) {
    const match = line.match(/^\s*[-*]\s+(.+?)\s*$/);
    if (match) {
      result.push(cleanInline(match[1]));
      continue;
    }
    if (line.trim() && result.length) break;
  }
  return result;
}

export function firstParagraph(document, heading) {
  return paragraphs(sectionLines(document, heading))[0] || "";
}
