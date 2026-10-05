import type { Locale } from "./site";

/**
 * Справочник добавок — доказательные карточки (витамины, минералы, БАДы).
 *
 * Устроен как реестр по образцу инструментов (src/config/tools.ts):
 * здесь только оболочка (URL, оформление, перелинковка), а текст карточки
 * живёт в content/reference/{locale}/{slug}.mdx. Виджета нет — это статичный
 * материал.
 *
 * Добавление карточки = запись здесь + две MDX-страницы (ru/en).
 * Маршрут, sitemap, hreflang и schema.org (DietarySupplement) подхватятся сами.
 *
 * ВАЖНО: добавлять слаг сюда можно только вместе с MDX на обе локали —
 * generateStaticParams перебирает REFERENCE при dynamicParams=false, и запись
 * без MDX даст 404 и мусор в sitemap.
 */
export type RefItem = {
  /** Слаг в URL: /{locale}/reference/{slug} — менять после публикации нельзя */
  slug: string;
  emoji: string;
  /**
   * Рубрика (слаг из categories.ts). Определяет акцентный цвет и OG-картинку —
   * обязана существовать, иначе og:image уйдёт в 404.
   */
  category: string;
  name: Record<Locale, string>;
  /** Одна строка под заголовком в листинге */
  tagline: Record<Locale, string>;
  /** Статьи-компаньоны: пути без префикса локали, в порядке важности */
  related: Record<Locale, string[]>;
};

export const REFERENCE: RefItem[] = [
  {
    slug: "creatine",
    emoji: "💪",
    category: "supplements",
    name: {
      ru: "Креатин",
      en: "Creatine",
    },
    tagline: {
      ru: "Самая изученная спортивная добавка: что доказано, рабочая доза и чего бояться не стоит",
      en: "The most-researched sports supplement: what's proven, the working dose and what not to fear",
    },
    related: {
      ru: ["/fitness/skolko-shagov-v-den", "/nutrition/skolko-belka-v-den"],
      en: ["/fitness/strength-training-for-beginners", "/nutrition/how-much-protein-per-day"],
    },
  },
];

export function getRefItem(slug: string): RefItem | undefined {
  return REFERENCE.find((r) => r.slug === slug);
}
