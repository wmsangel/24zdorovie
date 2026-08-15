import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Locale } from "@/config/site";
import type { FaqItem, SourceItem } from "./content";

export type ToolPage = {
  slug: string;
  locale: Locale;
  /** h1 и <title>: пишется под запрос, поэтому не дублирует name из реестра */
  title: string;
  description: string;
  updated?: string;
  /** Короткий ответ над калькулятором — цель featured snippet */
  lede?: string;
  faq?: FaqItem[];
  sources?: SourceItem[];
  /** Проза под виджетом: как это считается и как читать результат */
  body: string;
};

/** Текст вокруг калькулятора живёт в content/tools/{locale}/{slug}.mdx */
export function getToolPage(locale: Locale, slug: string): ToolPage | null {
  const file = path.join(process.cwd(), "content", "tools", locale, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;

  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return {
    slug,
    locale,
    title: data.title ?? slug,
    description: data.description ?? "",
    updated: data.updated,
    lede: data.lede,
    faq: data.faq,
    sources: data.sources,
    body: content,
  };
}
