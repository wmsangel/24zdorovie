import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlesArchive } from "@/components/ArticlesArchive";
import { LOCALES, type Locale } from "@/config/site";
import { getArticles } from "@/lib/content";
import { isLocale, t } from "@/lib/i18n";
import { pageCount } from "@/lib/paginate";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

/**
 * Страницы архива со второй и дальше. Первая живёт по адресу
 * /{locale}/articles/ и здесь намеренно не генерируется — иначе
 * один и тот же список открывался бы по двум URL.
 */
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => {
    const pages = pageCount(getArticles(locale).length);
    return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({
      locale,
      n: String(i + 2),
    }));
  });
}

/** "3" → 3, если такая страница действительно существует */
function resolvePage(locale: Locale, raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 2) return null;
  return n <= pageCount(getArticles(locale).length) ? n : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; n: string }>;
}): Promise<Metadata> {
  const { locale, n: rawN } = await params;
  if (!isLocale(locale)) return {};
  const page = resolvePage(locale, rawN);
  if (!page) return {};

  const path = `/articles/page/${page}`;
  const title = `${locale === "ru" ? "Все статьи" : "All articles"} — ${t(locale, "pagination_page")} ${page}`;

  /**
   * hreflang выводим только на те локали, где такая страница есть:
   * число материалов в RU и EN совпадает не всегда, и ссылка
   * на несуществующую страницу хуже, чем её отсутствие.
   */
  const alternates = Object.fromEntries(
    LOCALES.filter((l) => page <= pageCount(getArticles(l).length)).map((l) => [l, path]),
  );

  return buildMetadata({
    locale,
    path,
    title,
    description:
      locale === "ru"
        ? `Архив материалов о питании, тренировках, сне и добавках, страница ${page} — от новых к старым.`
        : `The archive of articles on nutrition, training, sleep and supplements, page ${page} — newest first.`,
    alternates,
  });
}

export default async function ArticlesPagedPage({
  params,
}: {
  params: Promise<{ locale: string; n: string }>;
}) {
  const { locale: raw, n: rawN } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const page = resolvePage(locale, rawN);
  if (!page) notFound();

  return <ArticlesArchive locale={locale} page={page} />;
}
