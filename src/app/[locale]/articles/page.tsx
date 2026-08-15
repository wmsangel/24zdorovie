import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlesArchive } from "@/components/ArticlesArchive";
import { LOCALES, type Locale } from "@/config/site";
import { isLocale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return buildMetadata({
    locale,
    path: "/articles",
    title: locale === "ru" ? "Все статьи" : "All articles",
    description:
      locale === "ru"
        ? "Полный архив материалов о питании, тренировках, сне, добавках и профилактике — от новых к старым."
        : "The complete archive of articles on nutrition, training, sleep, supplements and prevention.",
  });
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  return <ArticlesArchive locale={locale} page={1} />;
}
