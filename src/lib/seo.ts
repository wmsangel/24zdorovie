import type { Metadata } from "next";
import { getCategory } from "@/config/categories";
import { LOCALES, OG_LOCALE, SITE, SITE_META, type Locale } from "@/config/site";
import type { Article } from "./content";
import { getTranslation } from "./content";

/**
 * Абсолютный URL. Из-за trailingSlash: true реальные адреса страниц
 * оканчиваются слэшем, поэтому canonical, hreflang и sitemap обязаны
 * указывать ровно на них — иначе каждая ссылка ведёт через 301.
 * Файлы (последний сегмент с расширением) слэш не получают.
 */
export const absolute = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  const isFile = /\.[a-zA-Z0-9]{2,5}$/.test(p);
  const normalized = isFile || p.endsWith("/") ? p : `${p}/`;
  return `${SITE.url}${normalized}`;
};

/**
 * OG-картинка берётся из заранее сгенерированного набора в /public/og:
 * при статическом экспорте серверного роута /api/og не существует.
 * Набор собирает scripts/gen-og.mjs на этапе сборки — по картинке на
 * рубрику в каждой локали плюс дефолт. У статей с обложкой в приоритете она.
 */
export function ogImage(params: { title: string; category?: string; locale: Locale }) {
  const slug = params.category && getCategory(params.category) ? params.category : "default";
  return `${SITE.url}/og/${slug}-${params.locale}.png`;
}

type MetaInput = {
  title: string;
  description: string;
  locale: Locale;
  /** Путь без префикса локали, например "/nutrition/protein" */
  path: string;
  image?: string;
  /** Слаг рубрики — определяет, какая из статичных OG-картинок подставится */
  category?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** OG article:* — автор, рубрика, теги (только для type: "article") */
  authors?: string[];
  section?: string;
  tags?: string[];
  /** Явные альтернативы; если не заданы — тот же путь в другой локали */
  alternates?: Partial<Record<Locale, string>>;
  noindex?: boolean;
};

export function buildMetadata({
  title,
  description,
  locale,
  path,
  image,
  category,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  section,
  tags,
  alternates,
  noindex,
}: MetaInput): Metadata {
  const canonical = absolute(`/${locale}${path === "/" ? "" : path}`);

  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    const alt = alternates?.[l];
    if (alternates && !alt) continue; // перевода нет — hreflang не выводим
    languages[l] = absolute(`/${l}${(alt ?? path) === "/" ? "" : (alt ?? path)}`);
  }
  /**
   * x-default — русская версия. Брать для неё путь текущей страницы нельзя:
   * у переводов разные слаги, и на EN-статье это давало ссылку на
   * несуществующий /ru/<английский-слаг>/. Берём реальный путь перевода,
   * а если его нет — x-default не выводим вовсе: отсутствие подсказки
   * лучше, чем подсказка на 404.
   */
  const ruPath = alternates ? alternates.ru : path;
  if (ruPath) languages["x-default"] = absolute(`/ru${ruPath === "/" ? "" : ruPath}`);

  const img = image ?? ogImage({ title, category, locale });

  return {
    title,
    description,
    alternates: { canonical, languages },
    /**
     * Директивы robots задаём на каждой странице явно: метадата layout на
     * вложенные страницы не наследуется, и без этого блока статьи, рубрики и
     * инструменты теряют max-image-preview:large и полный сниппет в выдаче.
     */
    robots: noindex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type,
      url: canonical,
      title,
      description,
      siteName: SITE_META[locale].title,
      locale: OG_LOCALE[locale],
      images: [{ url: img, width: 1200, height: 630, alt: title }],
      ...(type === "article"
        ? {
            ...(publishedTime ? { publishedTime } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
            ...(authors?.length ? { authors } : {}),
            ...(section ? { section } : {}),
            ...(tags?.length ? { tags } : {}),
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [img],
    },
  };
}

export function articleMetadata(article: Article): Metadata {
  const path = `/${article.category}/${article.slug}`;
  const other: Locale = article.locale === "ru" ? "en" : "ru";
  const translated = getTranslation(article, other);

  return buildMetadata({
    title: article.title,
    description: article.description,
    locale: article.locale,
    path,
    type: "article",
    image: article.cover ? absolute(article.cover) : ogImage({ title: article.title, category: article.category, locale: article.locale }),
    publishedTime: article.date,
    modifiedTime: article.updated ?? article.date,
    authors: [article.author ?? SITE_META[article.locale].title],
    section: getCategory(article.category)?.name[article.locale],
    tags: article.tags,
    alternates: {
      [article.locale]: path,
      ...(translated ? { [other]: `/${translated.category}/${translated.slug}` } : {}),
    },
  });
}

/* ==========================================================================
   JSON-LD
   ========================================================================== */

export function organizationLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: SITE_META[locale].title,
    url: SITE.url,
    logo: { "@type": "ImageObject", url: absolute("/icon.svg") },
    foundingDate: String(SITE.founded),
    sameAs: Object.values(SITE.social).filter(Boolean),
  };
}

export function websiteLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE_META[locale].title,
    description: SITE_META[locale].description,
    inLanguage: locale,
    publisher: { "@id": `${SITE.url}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/${locale}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absolute(item.url),
    })),
  };
}

/**
 * Картинка статьи как ImageObject: Google предпочитает объект с размерами
 * голому URL и для части rich-результатов требует именно его. Для обложки
 * размеры неизвестны, для OG-заглушки они всегда 1200×630.
 */
function articleImageLd(article: Article) {
  if (article.cover) {
    return { "@type": "ImageObject", url: absolute(article.cover) };
  }
  return {
    "@type": "ImageObject",
    url: ogImage({ title: article.title, category: article.category, locale: article.locale }),
    width: 1200,
    height: 630,
  };
}

export function articleLd(article: Article) {
  const category = getCategory(article.category);
  const url = absolute(article.url);
  const isMedical = article.category !== "recipes";

  return {
    "@context": "https://schema.org",
    "@type": isMedical ? "MedicalWebPage" : "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: article.title,
    description: article.description,
    inLanguage: article.locale,
    datePublished: article.date,
    dateModified: article.updated ?? article.date,
    articleSection: category?.name[article.locale],
    keywords: article.tags?.join(", "),
    wordCount: article.words,
    image: articleImageLd(article),
    author: {
      "@type": "Person",
      name: article.author ?? SITE_META[article.locale].title,
      url: absolute(`/${article.locale}/authors`),
    },
    ...(article.reviewer
      ? { reviewedBy: { "@type": "Person", name: article.reviewer } }
      : {}),
    // YMYL-сигналы для медицинских тем: дата последней проверки и аудитория —
    // Google явно учитывает их при оценке экспертности health-контента.
    ...(isMedical
      ? {
          lastReviewed: article.updated ?? article.date,
          medicalAudience: { "@type": "MedicalAudience", audienceType: "Patient" },
        }
      : {}),
    publisher: { "@id": `${SITE.url}/#organization` },
    isPartOf: { "@id": `${SITE.url}/#website` },
  };
}

export function faqLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/**
 * Короткое имя шага для HowToStep.name.
 *
 * Google хочет у шага и название, и текст: без name шаг не попадает
 * в пошаговую карточку выдачи. Отдельного поля во фронтматтере нет и
 * не нужно — первое предложение шага и есть его суть, надо только
 * не тащить в заголовок весь абзац.
 */
function stepName(step: string): string {
  const firstSentence = step.split(/(?<=[.!?])\s/)[0] ?? step;
  const clean = firstSentence.replace(/[.!?]+$/, "").trim();
  if (clean.length <= 60) return clean;
  // Режем по границе слова, чтобы не обрывать посреди слова
  const cut = clean.slice(0, 60);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 30 ? cut.lastIndexOf(" ") : 60).trim()}…`;
}

export function recipeLd(article: Article) {
  const r = article.recipe;
  if (!r) return null;
  const iso = (min?: number) => (min ? `PT${min}M` : undefined);

  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: article.title,
    description: article.description,
    inLanguage: article.locale,
    datePublished: article.date,
    author: { "@type": "Person", name: article.author ?? SITE_META[article.locale].title },
    image: article.cover ? [absolute(article.cover)] : undefined,
    recipeCategory: article.tags?.[0],
    recipeCuisine: r.cuisine,
    // keywords Google просит отдельно от recipeCategory: по ним рецепт
    // подбирается под уточняющие запросы («high protein breakfast»)
    keywords: article.tags?.length ? article.tags.join(", ") : undefined,
    prepTime: iso(r.prepTime),
    cookTime: iso(r.cookTime),
    totalTime: iso(r.time),
    recipeYield: r.servings ? `${r.servings}` : undefined,
    recipeIngredient: r.ingredients,
    recipeInstructions: r.steps?.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: stepName(step),
      text: step,
    })),
    nutrition: r.kcal
      ? {
          "@type": "NutritionInformation",
          calories: `${r.kcal} kcal`,
          proteinContent: r.protein ? `${r.protein} g` : undefined,
          fatContent: r.fat ? `${r.fat} g` : undefined,
          carbohydrateContent: r.carbs ? `${r.carbs} g` : undefined,
          servingSize: r.servings ? `1/${r.servings}` : undefined,
        }
      : undefined,
  };
}

/**
 * Разметка страницы-калькулятора. WebApplication говорит поисковику, что это
 * инструмент, а не статья — под тулзовые запросы («biological age test»)
 * это ровно тот тип, который Google ожидает увидеть.
 * offers с нулевой ценой добавлен намеренно: без него валидаторы ругаются
 * на неполный SoftwareApplication.
 */
export function toolLd(params: {
  name: string;
  description: string;
  url: string;
  locale: Locale;
  category?: string;
  updated?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: params.name,
    description: params.description,
    url: absolute(params.url),
    inLanguage: params.locale,
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    ...(params.updated ? { dateModified: params.updated } : {}),
    image: ogImage({ title: params.name, category: params.category, locale: params.locale }),
    publisher: { "@id": `${SITE.url}/#organization` },
    isPartOf: { "@id": `${SITE.url}/#website` },
  };
}

export function collectionLd(params: {
  name: string;
  description: string;
  url: string;
  locale: Locale;
  items: Article[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: params.name,
    description: params.description,
    url: absolute(params.url),
    inLanguage: params.locale,
    isPartOf: { "@id": `${SITE.url}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: params.items.length,
      itemListElement: params.items.slice(0, 20).map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absolute(a.url),
        name: a.title,
      })),
    },
  };
}
