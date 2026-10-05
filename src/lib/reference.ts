import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Locale } from "@/config/site";
import type { FaqItem, SourceItem } from "./content";

export type RefPage = {
  slug: string;
  locale: Locale;
  /** h1 и <title>: пишется под запрос, не дублирует name из реестра */
  title: string;
  description: string;
  updated?: string;
  /** Короткий ответ наверху карточки — цель featured snippet */
  lede?: string;
  /** Синонимы/другие названия → nonProprietaryName в schema DietarySupplement */
  aka?: string[];
  /** Рабочая доза одной строкой → recommendedIntake в schema */
  recommendedIntake?: string;
  /** Короткая оговорка о безопасности → safetyConsideration в schema */
  safety?: string;
  faq?: FaqItem[];
  sources?: SourceItem[];
  /** Тело карточки живёт в content/reference/{locale}/{slug}.mdx */
  body: string;
};

/** Текст карточки справочника живёт в content/reference/{locale}/{slug}.mdx */
export function getRefPage(locale: Locale, slug: string): RefPage | null {
  const file = path.join(process.cwd(), "content", "reference", locale, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;

  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return {
    slug,
    locale,
    title: data.title ?? slug,
    description: data.description ?? "",
    updated: data.updated,
    lede: data.lede,
    aka: data.aka,
    recommendedIntake: data.recommendedIntake,
    safety: data.safety,
    faq: data.faq,
    sources: data.sources,
    body: content,
  };
}
