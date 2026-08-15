import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { getCategory } from "@/config/categories";
import { LOCALES, SITE, type Locale } from "@/config/site";
import { TOOLS } from "@/config/tools";
import { isLocale, t } from "@/lib/i18n";
import { absolute, breadcrumbLd, buildMetadata } from "@/lib/seo";

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
    path: "/tools",
    title: t(locale, "tools_title"),
    description: t(locale, "tools_lede"),
  });
}

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--brand-tint)]">
        <div
          className="organic-blob right-[-4rem] top-[-6rem] h-72 w-72 bg-[var(--brand)]"
          aria-hidden="true"
        />
        <div className="container-page relative py-10 md:py-14">
          <Breadcrumbs locale={locale} items={[{ label: t(locale, "tools_title") }]} />
          <div className="mt-6 max-w-2xl">
            <h1 className="text-[2.2rem] leading-tight md:text-[3rem]">
              {t(locale, "tools_title")}
            </h1>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-[var(--ink-soft)]">
              {t(locale, "tools_lede")}
            </p>
          </div>
        </div>
      </section>

      <div className="container-page py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const cat = getCategory(tool.category);
            return (
              <Link
                key={tool.slug}
                href={`/${locale}/tools/${tool.slug}`}
                data-accent={cat?.accent}
                className="card card-hover flex flex-col p-6"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-tint)] text-2xl">
                  {tool.emoji}
                </span>
                <h2 className="mt-5 font-display text-[1.35rem] font-semibold leading-snug">
                  {tool.name[locale]}
                </h2>
                <p className="mt-2.5 flex-1 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
                  {tool.tagline[locale]}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[0.88rem] font-semibold text-[var(--accent)]">
                  {t(locale, "tools_open")}
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M5 12h14m-6-6 6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-[0.88rem] text-[var(--ink-faint)]">
          🔒 {t(locale, "tools_privacy")}
        </p>
      </div>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: t(locale, "tools_title"),
            description: t(locale, "tools_lede"),
            url: absolute(`/${locale}/tools`),
            inLanguage: locale,
            isPartOf: { "@id": `${SITE.url}/#website` },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: TOOLS.length,
              itemListElement: TOOLS.map((tool, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absolute(`/${locale}/tools/${tool.slug}`),
                name: tool.name[locale],
              })),
            },
          },
          breadcrumbLd([
            { name: t(locale, "breadcrumb_home"), url: `/${locale}` },
            { name: t(locale, "tools_title"), url: `/${locale}/tools` },
          ]),
        ]}
      />
    </div>
  );
}
