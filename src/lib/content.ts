import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { LOCALES, type Locale } from "@/config/site";
import { CATEGORY_SLUGS } from "@/config/categories";

export const CONTENT_DIR = path.join(process.cwd(), "content");

export type FaqItem = { q: string; a: string };
export type SourceItem = { title: string; url: string };

/**
 * Авторство обложки. Указывается под картинкой в статье — требование
 * лицензий на фотостоки и просто хороший тон.
 */
export type CoverCredit = {
  /** Имя автора снимка */
  author: string;
  /** Ссылка на страницу снимка у источника */
  url?: string;
  /** Например «Unsplash» или «Pexels» */
  source?: string;
  /** Например «Unsplash License», «CC BY 4.0» */
  license?: string;
};

export type RecipeMeta = {
  /** Минуты */
  time?: number;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  cuisine?: string;
  ingredients?: string[];
  steps?: string[];
};

export type Frontmatter = {
  title: string;
  description: string;
  date: string;
  updated?: string;
  category: string;
  tags?: string[];
  cover?: string;
  coverAlt?: string;
  coverCredit?: CoverCredit;
  author?: string;
  reviewer?: string;
  featured?: boolean;
  draft?: boolean;
  /** Общий ключ для связи RU/EN версий одной статьи (для hreflang) */
  translationKey?: string;
  faq?: FaqItem[];
  sources?: SourceItem[];
  recipe?: RecipeMeta;
};

export type Article = Frontmatter & {
  slug: string;
  locale: Locale;
  url: string;
  body: string;
  minutes: number;
  words: number;
};

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".mdx") || entry.name.endsWith(".md") ? [full] : [];
  });
}

function parseFile(file: string, locale: Locale): Article | null {
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const fm = data as Frontmatter;

  const slug = path.basename(file).replace(/\.mdx?$/, "");
  const category = fm.category ?? path.basename(path.dirname(file));

  if (!fm.title || !fm.date) {
    console.warn(`[content] Пропущен ${file}: нет title или date`);
    return null;
  }
  if (!CATEGORY_SLUGS.includes(category)) {
    console.warn(`[content] Пропущен ${file}: неизвестная рубрика "${category}"`);
    return null;
  }

  const stats = readingTime(content);

  return {
    ...fm,
    category,
    slug,
    locale,
    url: `/${locale}/${category}/${slug}`,
    body: content,
    minutes: Math.max(1, Math.round(stats.minutes)),
    words: stats.words,
    tags: fm.tags ?? [],
  };
}

let cache: Article[] | null = null;

/** Все опубликованные статьи, отсортированные от новых к старым. Кэшируется на процесс. */
export function getAllArticles(): Article[] {
  if (cache && process.env.NODE_ENV === "production") return cache;

  const articles = LOCALES.flatMap((locale) =>
    walk(path.join(CONTENT_DIR, locale))
      .map((file) => parseFile(file, locale))
      .filter((a): a is Article => a !== null),
  )
    .filter((a) => !a.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  cache = articles;
  return articles;
}

export function getArticles(locale: Locale): Article[] {
  return getAllArticles().filter((a) => a.locale === locale);
}

export function getArticle(locale: Locale, category: string, slug: string): Article | undefined {
  return getAllArticles().find(
    (a) => a.locale === locale && a.category === category && a.slug === slug,
  );
}

export function getByCategory(locale: Locale, category: string): Article[] {
  return getArticles(locale).filter((a) => a.category === category);
}

export function getFeatured(locale: Locale, limit = 3): Article[] {
  const featured = getArticles(locale).filter((a) => a.featured);
  return (featured.length ? featured : getArticles(locale)).slice(0, limit);
}

export function getByTag(locale: Locale, tag: string): Article[] {
  const needle = tag.toLowerCase();
  return getArticles(locale).filter((a) => a.tags?.some((x) => x.toLowerCase() === needle));
}

/**
 * Слаг тега для URL: «Силовые тренировки» → «силовые-тренировки».
 *
 * Кириллица в пути остаётся — её понимают и Google, и Яндекс, а вот пробел
 * превращается в %20, и адрес выглядит битым везде, куда его копируют.
 * Дефисы внутри самих тегов («омега-3») при этом не трогаем, поэтому
 * обратное преобразование делается не заменой символов, а поиском
 * по списку тегов: tagBySlug ниже.
 */
export function tagSlug(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, "-");
}

/** Исходное написание тега по его слагу — с ним и ищем статьи, и рисуем #заголовок */
export function tagBySlug(locale: Locale, slug: string): string | undefined {
  const needle = slug.toLowerCase();
  return getAllTags(locale).find((t) => tagSlug(t.tag) === needle)?.tag;
}

/**
 * Минимум статей, при котором тег-страница имеет смысл для поиска.
 * Тег с одним-двумя материалами — это thin content: страница почти дублирует
 * карточки статей и только тратит краулинговый бюджет. Такие страницы остаются
 * доступными (на них ведут ссылки из статей), но уходят из индекса и sitemap.
 *
 * Порог 3 держит в индексе примерно 40 тегов на локаль вместо 85 при пороге 2 —
 * заметная экономия обхода на молодом домене без потери полезных листингов.
 */
export const TAG_INDEX_MIN = 3;

export function getAllTags(locale: Locale): { tag: string; count: number }[] {
  /**
   * Ключ — слаг, а не написание: «ИМТ» и «имт» дают одну страницу,
   * иначе на один URL пришлось бы два маршрута. За человеческое написание
   * отвечает первое встреченное — оно и попадает в заголовок.
   */
  const counts = new Map<string, { tag: string; count: number }>();
  for (const a of getArticles(locale)) {
    for (const tag of a.tags ?? []) {
      const key = tagSlug(tag);
      const seen = counts.get(key);
      if (seen) seen.count += 1;
      else counts.set(key, { tag, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * Похожие материалы: сначала совпадение по тегам внутри рубрики,
 * затем добор свежими из той же рубрики, затем — просто свежими.
 */
export function getRelated(article: Article, limit = 3): Article[] {
  const pool = getArticles(article.locale).filter((a) => a.slug !== article.slug);
  const tags = new Set((article.tags ?? []).map((t) => t.toLowerCase()));

  const scored = pool.map((a) => {
    const overlap = (a.tags ?? []).filter((t) => tags.has(t.toLowerCase())).length;
    const sameCategory = a.category === article.category ? 1 : 0;
    return { article: a, score: overlap * 2 + sameCategory };
  });

  return scored
    .sort((a, b) => b.score - a.score || +new Date(b.article.date) - +new Date(a.article.date))
    .slice(0, limit)
    .map((s) => s.article);
}

/** Версия этой же статьи на другом языке — для hreflang и переключателя языка */
export function getTranslation(article: Article, target: Locale): Article | undefined {
  if (target === article.locale) return article;
  const key = article.translationKey;
  return getAllArticles().find(
    (a) =>
      a.locale === target &&
      ((key && a.translationKey === key) || (!key && a.category === article.category && a.slug === article.slug)),
  );
}

/** Лёгкий индекс для клиентского поиска (без тела статьи) */
export function getSearchIndex(locale: Locale) {
  return getArticles(locale).map((a) => ({
    t: a.title,
    d: a.description,
    u: a.url,
    c: a.category,
    g: a.tags ?? [],
    m: a.minutes,
    p: a.date,
  }));
}
