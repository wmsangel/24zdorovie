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
  {
    slug: "vitamin-c",
    emoji: "🍊",
    category: "supplements",
    name: {
      ru: "Витамин C",
      en: "Vitamin C",
    },
    tagline: {
      ru: "Что доказано об аскорбинке, сколько нужно в день и почему мегадозы бесполезны",
      en: "What's proven about ascorbic acid, how much you need and why megadoses are pointless",
    },
    related: {
      ru: ["/immunity/vitamin-c-i-prostuda", "/supplements/multivitaminy-nuzhny-li"],
      en: ["/immunity/vitamin-c-and-colds", "/supplements/do-multivitamins-work"],
    },
  },
  {
    slug: "zinc",
    emoji: "🛡️",
    category: "supplements",
    name: {
      ru: "Цинк",
      en: "Zinc",
    },
    tagline: {
      ru: "Зачем нужен, рабочая доза и почему постоянные мегадозы вредят",
      en: "What it's for, the working dose and why chronic megadoses backfire",
    },
    related: {
      ru: ["/immunity/tsink-i-prostuda", "/immunity/kak-ukrepit-immunitet"],
      en: ["/immunity/zinc-and-colds", "/immunity/how-to-boost-immunity"],
    },
  },
  {
    slug: "calcium",
    emoji: "🦴",
    category: "supplements",
    name: {
      ru: "Кальций",
      en: "Calcium",
    },
    tagline: {
      ru: "Сколько нужно для костей, почему еда лучше таблеток и когда добавка оправдана",
      en: "How much you need for bones, why food beats pills and when a supplement is justified",
    },
    related: {
      ru: ["/supplements/vitamin-d-normy-i-dozirovki", "/supplements/magniy-formy-i-dozy"],
      en: ["/supplements/vitamin-d-dosage", "/supplements/magnesium-forms-doses"],
    },
  },
  {
    slug: "coenzyme-q10",
    emoji: "⚡",
    category: "supplements",
    name: {
      ru: "Коэнзим Q10",
      en: "Coenzyme Q10",
    },
    tagline: {
      ru: "Где доказательства реальны, а где это дорогой антиэйдж-миф",
      en: "Where the evidence is real, and where it's an expensive anti-ageing myth",
    },
    related: {
      ru: ["/heart/statiny-polza-i-mify", "/heart/kak-snizit-serdechno-sosudistyy-risk"],
      en: ["/heart/how-to-lower-cardiovascular-risk", "/supplements/do-multivitamins-work"],
    },
  },
];

export function getRefItem(slug: string): RefItem | undefined {
  return REFERENCE.find((r) => r.slug === slug);
}
