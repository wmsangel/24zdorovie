import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Locale } from "@/config/site";

export type StaticPage = {
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  updated?: string;
  body: string;
};

/** Служебные страницы живут в content/pages/{locale}/{slug}.mdx */
export function getStaticPage(locale: Locale, slug: string): StaticPage | null {
  const file = path.join(process.cwd(), "content", "pages", locale, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;

  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return {
    slug,
    locale,
    title: data.title ?? slug,
    description: data.description ?? "",
    updated: data.updated,
    body: content,
  };
}
