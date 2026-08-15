import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/config/categories";
import { LOCALES, type Locale } from "@/config/site";
import { TOOLS } from "@/config/tools";
import {
  getAllArticles,
  getAllTags,
  getArticles,
  tagSlug,
  TAG_INDEX_MIN,
  type Article,
} from "@/lib/content";
import { pageCount } from "@/lib/paginate";
import { absolute } from "@/lib/seo";

/** Статический экспорт требует явно пометить метадата-роуты как статические */
export const dynamic = "force-static";

const STATIC_PATHS = [
  "",
  "/articles",
  "/tools",
  "/about",
  "/authors",
  "/contacts",
  "/advertising",
  "/privacy",
  "/terms",
  "/disclaimer",
];

/** absolute() сам добавляет завершающий слэш — он обязателен при trailingSlash: true */
const url = (locale: Locale, path: string) => absolute(`/${locale}${path}`);

/** Двуязычные альтернативы для каждой записи — Google любит явный hreflang в sitemap */
const languages = (path: string) =>
  Object.fromEntries(LOCALES.map((l) => [l, url(l, path)])) as Record<string, string>;

/**
 * Ключ языковой пары статьи. translationKey задаётся во фронтматтере;
 * если его нет — считаем парой статьи с одинаковыми рубрикой и слагом.
 */
const pairKey = (a: Article) => a.translationKey ?? `${a.category}/${a.slug}`;

/**
 * hreflang для статьи выводим только при реально существующем переводе:
 * ссылка на несуществующий URL хуже, чем её отсутствие.
 */
function articleLanguages(article: Article, byPair: Map<string, Article[]>) {
  const pair = byPair.get(pairKey(article)) ?? [];
  if (pair.length < 2) return undefined;
  return Object.fromEntries(pair.map((a) => [a.locale, absolute(a.url)])) as Record<string, string>;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: url(locale, path),
        lastModified: getArticles(locale)[0]?.date ?? new Date(),
        changeFrequency: path === "" || path === "/articles" ? "daily" : "monthly",
        priority: path === "" ? 1 : path === "/articles" ? 0.8 : 0.4,
        alternates: { languages: languages(path) },
      });
    }

    /**
     * Страницы архива со второй и дальше. Каждая индексируется сама по себе
     * (self-canonical), поэтому им место в карте сайта — иначе краулер
     * доберётся до старых материалов только по ссылкам из ленты.
     * hreflang выводим лишь на локали, где такая страница существует.
     */
    const pages = pageCount(getArticles(locale).length);
    for (let n = 2; n <= pages; n++) {
      const path = `/articles/page/${n}`;
      const twins = LOCALES.filter((l) => n <= pageCount(getArticles(l).length));
      entries.push({
        url: url(locale, path),
        lastModified: getArticles(locale)[0]?.date ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.4,
        alternates: {
          languages: Object.fromEntries(twins.map((l) => [l, url(l, path)])) as Record<
            string,
            string
          >,
        },
      });
    }

    for (const category of CATEGORIES) {
      const items = getArticles(locale).filter((a) => a.category === category.slug);
      entries.push({
        url: url(locale, `/${category.slug}`),
        lastModified: items[0]?.date ?? new Date(),
        changeFrequency: "daily",
        priority: 0.9,
        alternates: { languages: languages(`/${category.slug}`) },
      });
    }

    // Калькуляторы существуют в обеих локалях всегда — hreflang выводим без проверок
    for (const tool of TOOLS) {
      entries.push({
        url: url(locale, `/tools/${tool.slug}`),
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: { languages: languages(`/tools/${tool.slug}`) },
      });
    }

    // В карту сайта попадают только теги, переживающие порог thin content
    for (const { tag } of getAllTags(locale).filter((t) => t.count >= TAG_INDEX_MIN)) {
      entries.push({
        url: url(locale, `/tag/${encodeURIComponent(tagSlug(tag))}`),
        changeFrequency: "weekly",
        priority: 0.3,
      });
    }
  }

  const articles = getAllArticles();

  // Группируем по языковой паре один раз, чтобы не искать перевод для каждой статьи
  const byPair = new Map<string, Article[]>();
  for (const article of articles) {
    const key = pairKey(article);
    byPair.set(key, [...(byPair.get(key) ?? []), article]);
  }

  for (const article of articles) {
    const alternates = articleLanguages(article, byPair);
    entries.push({
      url: absolute(article.url),
      lastModified: article.updated ?? article.date,
      changeFrequency: "monthly",
      priority: article.featured ? 0.9 : 0.7,
      ...(alternates ? { alternates: { languages: alternates } } : {}),
    });
  }

  return entries;
}
