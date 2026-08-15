import type { Metadata } from "next";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { ArticleCard } from "@/components/ArticleCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryCard } from "@/components/CategoryCard";
import { JsonLd } from "@/components/JsonLd";
import { CATEGORIES, getCategory } from "@/config/categories";
import { LOCALES, type Locale } from "@/config/site";
import { getByCategory } from "@/lib/content";
import { isLocale, plural, t } from "@/lib/i18n";
import { breadcrumbLd, buildMetadata, collectionLd } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => CATEGORIES.map((c) => ({ locale, category: c.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  const cat = getCategory(category);
  if (!isLocale(locale) || !cat) return {};

  const count = getByCategory(locale, category).length;
  const suffix =
    locale === "ru"
      ? `${count} ${plural(count, ["материал", "материала", "материалов"])}`
      : `${count} articles`;

  return buildMetadata({
    title: `${cat.name[locale]} — ${suffix}`,
    description: cat.description[locale],
    locale,
    path: `/${cat.slug}`,
    category: cat.slug,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale: raw, category: slug } = await params;
  const cat = getCategory(slug);
  if (!isLocale(raw) || !cat) notFound();
  const locale: Locale = raw;

  const articles = getByCategory(locale, slug);
  const [lead, ...rest] = articles;
  const siblings = CATEGORIES.filter((c) => c.slug !== slug).slice(0, 4);

  return (
    <div data-accent={cat.accent}>
      {/* Шапка рубрики */}
      <section className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--accent-tint)]">
        <div
          className="organic-blob right-[-4rem] top-[-6rem] h-72 w-72 bg-[var(--accent)]"
          aria-hidden="true"
        />
        <div className="container-page relative py-10 md:py-14">
          <Breadcrumbs locale={locale} items={[{ label: cat.name[locale] }]} />
          <div className="mt-6 flex items-start gap-5">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[var(--surface)] text-3xl shadow-[var(--shadow-soft)]">
              {cat.emoji}
            </span>
            <div>
              <h1 className="text-[2.2rem] leading-tight md:text-[3rem]">{cat.name[locale]}</h1>
              <p className="mt-3 max-w-2xl text-[1.02rem] leading-relaxed text-[var(--ink-soft)]">
                {cat.description[locale]}
              </p>
              <p className="mt-4 text-[0.85rem] font-semibold text-[var(--accent)]">
                {locale === "ru"
                  ? `${articles.length} ${plural(articles.length, ["материал", "материала", "материалов"])}`
                  : `${articles.length} articles`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-12">
        {articles.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] p-12 text-center text-[var(--ink-soft)]">
            {t(locale, "empty_category")}
          </p>
        ) : (
          <>
            {lead && <ArticleCard article={lead} locale={locale} variant="hero" priority />}

            {rest.length > 0 && (
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((article, i) => (
                  <Fragment key={article.url}>
                    <ArticleCard article={article} locale={locale} />
                    {i === 4 && <AdSlot placement="in-feed" locale={locale} className="h-full" />}
                  </Fragment>
                ))}
              </div>
            )}
          </>
        )}

        <section className="mt-20">
          <h2 className="border-b border-[var(--line)] pb-4 text-2xl">
            {t(locale, "section_categories")}
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {siblings.map((c) => (
              <CategoryCard
                key={c.slug}
                category={c}
                locale={locale}
                count={getByCategory(locale, c.slug).length}
              />
            ))}
          </div>
        </section>
      </div>

      <JsonLd
        data={[
          collectionLd({
            name: cat.name[locale],
            description: cat.description[locale],
            url: `/${locale}/${cat.slug}`,
            locale,
            items: articles,
          }),
          breadcrumbLd([
            { name: t(locale, "breadcrumb_home"), url: `/${locale}` },
            { name: cat.name[locale], url: `/${locale}/${cat.slug}` },
          ]),
        ]}
      />
    </div>
  );
}
