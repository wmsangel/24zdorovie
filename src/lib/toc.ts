import GithubSlugger from "github-slugger";

export type Heading = { id: string; text: string; level: 2 | 3 };

/**
 * Достаёт h2/h3 из markdown-тела. Слаги считает тем же алгоритмом,
 * что и rehype-slug, поэтому якоря совпадают с реальными id в DOM.
 */
export function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const text = match[2]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // ссылки → текст
      .replace(/[*_`~]/g, "")
      .trim();

    headings.push({ id: slugger.slug(text), text, level: match[1].length as 2 | 3 });
  }

  return headings;
}

/**
 * Делит статью на две части по ближайшему к середине заголовку h2 —
 * в стык вставляется рекламный блок in-article. Если подходящего
 * заголовка нет (короткий текст), вторая часть пустая.
 */
export function splitAtMiddleHeading(markdown: string): [string, string] {
  const lines = markdown.split("\n");
  const target = markdown.length * 0.45;

  let inFence = false;
  let offset = 0;
  let bestLine = -1;
  let bestDelta = Infinity;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;

    if (!inFence && /^##\s+/.test(line)) {
      const delta = Math.abs(offset - target);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestLine = i;
      }
    }
    offset += line.length + 1;
  }

  // Не режем, если разрыв придётся на первую четверть текста
  if (bestLine < 0 || bestDelta > markdown.length * 0.3) return [markdown, ""];

  return [lines.slice(0, bestLine).join("\n"), lines.slice(bestLine).join("\n")];
}
