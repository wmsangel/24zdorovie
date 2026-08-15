import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Mdx } from "@/components/mdx/Mdx";
import { LOCALES } from "@/config/site";
import { formatDate, isLocale, t } from "@/lib/i18n";
import { getStaticPage } from "@/lib/pages";
import { breadcrumbLd, buildMetadata } from "@/lib/seo";

export function staticPageParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/** Общая метадата для служебных страниц (about, privacy, terms…) */
export async function staticPageMetadata(
  params: Promise<{ locale: string }>,
  slug: string,
): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = getStaticPage(locale, slug);
  if (!page) return {};

  return buildMetadata({
    locale,
    path: `/${slug}`,
    title: page.title,
    description: page.description,
  });
}

export async function StaticPageView({
  params,
  slug,
}: {
  params: Promise<{ locale: string }>;
  slug: string;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const page = getStaticPage(locale, slug);
  if (!page) notFound();

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs locale={locale} items={[{ label: page.title }]} />
        <h1 className="mt-6 text-[2.2rem] leading-tight md:text-[3rem]">{page.title}</h1>
        {page.description && (
          <p className="mt-4 text-[1.05rem] leading-relaxed text-[var(--ink-soft)]">
            {page.description}
          </p>
        )}
        {page.updated && (
          <p className="mt-3 text-[0.82rem] text-[var(--ink-faint)]">
            {t(locale, "updated")}: {formatDate(page.updated, locale)}
          </p>
        )}
        <div className="prose mt-10">
          <Mdx source={page.body} />
        </div>
      </div>

      <JsonLd
        data={breadcrumbLd([
          { name: t(locale, "breadcrumb_home"), url: `/${locale}` },
          { name: page.title, url: `/${locale}/${slug}` },
        ])}
      />
    </div>
  );
}
