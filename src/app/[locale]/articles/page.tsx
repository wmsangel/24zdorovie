import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlesArchive } from "@/components/ArticlesArchive";
import { JsonLd } from "@/components/JsonLd";
import { LOCALES, type Locale } from "@/config/site";
import { getArticles } from "@/lib/content";
import { isLocale, t } from "@/lib/i18n";
import { breadcrumbLd, buildMetadata, collectionLd } from "@/lib/seo";

const archiveMeta = (locale: Locale) => ({
  title: locale === "ru" ? "Все статьи" : "All articles",
  description:
    locale === "ru"
      ? "Полный архив материалов о питании, тренировках, сне, добавках и профилактике — от новых к старым."
      : "The complete archive of articles on nutrition, training, sleep, supplements and prevention.",
});

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
  const m = archiveMeta(locale);
  return buildMetadata({ locale, path: "/articles", title: m.title, description: m.description });
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const m = archiveMeta(locale);

  return (
    <>
      <ArticlesArchive locale={locale} page={1} />
      <JsonLd
        data={[
          collectionLd({
            name: m.title,
            description: m.description,
            url: `/${locale}/articles`,
            locale,
            items: getArticles(locale),
          }),
          breadcrumbLd([
            { name: t(locale, "breadcrumb_home"), url: `/${locale}` },
            { name: m.title, url: `/${locale}/articles` },
          ]),
        ]}
      />
    </>
  );
}
