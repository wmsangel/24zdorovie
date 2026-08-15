import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SearchClient } from "@/components/SearchClient";
import { LOCALES } from "@/config/site";
import { getSearchIndex } from "@/lib/content";
import { isLocale, t } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

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
    path: "/search",
    title: t(locale, "nav_search"),
    description: t(locale, "search_placeholder"),
    // Страница результатов не должна конкурировать с рубриками в выдаче
    noindex: true,
  });
}

export default async function SearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const index = getSearchIndex(locale);

  return (
    <div className="container-page py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center text-[2.2rem] md:text-[2.8rem]">{t(locale, "nav_search")}</h1>
        <div className="mt-8">
          <Suspense fallback={<div className="h-14 rounded-full bg-[var(--surface-2)]" />}>
            <SearchClient index={index} locale={locale} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
