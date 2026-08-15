import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { ArticleCard, CoverArt } from "@/components/ArticleCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CoverCredit } from "@/components/CoverCredit";
import { JsonLd } from "@/components/JsonLd";
import { Mdx } from "@/components/mdx/Mdx";
import { Newsletter } from "@/components/Newsletter";
import { ShareBar } from "@/components/ShareBar";
import { Toc } from "@/components/Toc";
import { getCategory } from "@/config/categories";
import { SITE, type Locale } from "@/config/site";
import { getAllArticles, getArticle, getRelated, tagSlug } from "@/lib/content";
import { formatDate, isLocale, localePath, t } from "@/lib/i18n";
import { articleLd, articleMetadata, breadcrumbLd, faqLd, recipeLd } from "@/lib/seo";
import { extractHeadings, splitAtMiddleHeading } from "@/lib/toc";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllArticles().map((a) => ({
    locale: a.locale,
    category: a.category,
    slug: a.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, category, slug } = await params;
  if (!isLocale(locale)) return {};
  const article = getArticle(locale, category, slug);
  return article ? articleMetadata(article) : {};
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}) {
  const { locale: raw, category, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const article = getArticle(locale, category, slug);
  if (!article) notFound();

  const cat = getCategory(article.category);
  const headings = extractHeadings(article.body);
  const [bodyStart, bodyRest] = splitAtMiddleHeading(article.body);
  const related = getRelated(article, 3);
  const url = `${SITE.url}${article.url}`;

  return (
    <article data-accent={cat?.accent}>
      {/* ── Заголовок ────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--accent-tint)]">
        <div
          className="organic-blob right-[-5rem] top-[-8rem] h-80 w-80 bg-[var(--accent)]"
          aria-hidden="true"
        />
        <div className="container-page relative py-10 md:py-14">
          <Breadcrumbs
            locale={locale}
            items={[
              { href: localePath(locale, `/${article.category}`), label: cat?.name[locale] ?? "" },
              { label: article.title },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            {cat && (
              <Link href={localePath(locale, `/${cat.slug}`)} className="chip">
                {cat.emoji} {cat.name[locale]}
              </Link>
            )}
            <h1 className="mt-4 text-[2rem] leading-[1.1] md:text-[3.1rem]">{article.title}</h1>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-[var(--ink-soft)] md:text-[1.18rem]">
              {article.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.85rem] text-[var(--ink-soft)]">
              {article.author && (
                <span className="font-semibold text-[var(--ink)]">{article.author}</span>
              )}
              <time dateTime={article.date}>{formatDate(article.date, locale)}</time>
              {article.updated && article.updated !== article.date && (
                <span className="text-[var(--ink-faint)]">
                  {t(locale, "updated")}: {formatDate(article.updated, locale)}
                </span>
              )}
              <span>
                {article.minutes} {t(locale, "min_read")}
              </span>
              {article.reviewer && (
                <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[0.78rem] font-semibold">
                  ✓ {t(locale, "reviewed_by")}: {article.reviewer}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container-page py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-16">
          {/* ── Тело статьи ───────────────────────────────────── */}
          <div className="min-w-0">
            <figure className="mb-10">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[var(--line)]">
                <CoverArt article={article} priority sizes="(max-width: 1024px) 100vw, 760px" />
              </div>
              {article.cover && article.coverCredit && (
                <CoverCredit credit={article.coverCredit} locale={locale} />
              )}
            </figure>

            {/* Мобильное оглавление */}
            {headings.length >= 3 && (
              <details className="mb-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 lg:hidden">
                <summary className="cursor-pointer font-semibold">{t(locale, "toc")}</summary>
                <div className="mt-4">
                  <Toc headings={headings} locale={locale} />
                </div>
              </details>
            )}

            <div className="prose">
              <Mdx source={bodyStart} />
            </div>

            {bodyRest && (
              <>
                <AdSlot placement="in-article" locale={locale} className="my-10" />
                <div className="prose">
                  <Mdx source={bodyRest} />
                </div>
              </>
            )}

            {/* FAQ — отдельным блоком, размечен FAQPage */}
            {article.faq && article.faq.length > 0 && (
              <section className="mt-14">
                <h2 className="font-display text-2xl font-semibold md:text-3xl">
                  {t(locale, "faq_title")}
                </h2>
                <div className="mt-6 divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
                  {article.faq.map((item, i) => (
                    <details key={i} className="group p-5">
                      <summary className="flex cursor-pointer items-start justify-between gap-4 font-semibold">
                        {item.q}
                        <span className="mt-0.5 shrink-0 text-[var(--ink-faint)] transition-transform group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 leading-relaxed text-[var(--ink-soft)]">{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Источники — сигнал E-E-A-T для YMYL-тематики */}
            {article.sources && article.sources.length > 0 && (
              <section className="mt-14">
                <h2 className="font-display text-2xl font-semibold">{t(locale, "sources_title")}</h2>
                <ol className="mt-4 space-y-2 text-[0.92rem] text-[var(--ink-soft)]">
                  {article.sources.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[var(--ink-faint)]">{i + 1}.</span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="underline decoration-[var(--line)] underline-offset-2 transition-colors hover:decoration-[var(--brand)]"
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Дисклеймер: обязателен для медицинской тематики */}
            <aside className="mt-12 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-5">
              <p className="font-semibold">⚕️ {t(locale, "disclaimer_title")}</p>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
                {t(locale, "disclaimer_text")}
              </p>
            </aside>

            {article.tags && article.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={localePath(locale, `/tag/${encodeURIComponent(tagSlug(tag))}`)}
                    className="rounded-full border border-[var(--line)] px-3.5 py-1.5 text-[0.82rem] font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand-strong)]"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 border-t border-[var(--line)] pt-6">
              <ShareBar url={url} title={article.title} locale={locale} />
            </div>

            <AdSlot placement="article-end" locale={locale} className="mt-10" />
          </div>

          {/* ── Сайдбар ───────────────────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-8">
              {headings.length >= 3 && <Toc headings={headings} locale={locale} />}
              <AdSlot placement="sidebar" locale={locale} />
            </div>
          </aside>
        </div>

        {/* ── Читайте также ─────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="border-b border-[var(--line)] pb-4 text-2xl md:text-[2rem]">
              {t(locale, "section_related")}
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((a) => (
                <ArticleCard key={a.url} article={a} locale={locale} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-20">
          <Newsletter locale={locale} />
        </section>
      </div>

      <JsonLd
        data={[
          articleLd(article),
          article.recipe ? recipeLd(article) : null,
          article.faq?.length ? faqLd(article.faq) : null,
          breadcrumbLd([
            { name: t(locale, "breadcrumb_home"), url: `/${locale}` },
            { name: cat?.name[locale] ?? "", url: `/${locale}/${article.category}` },
            { name: article.title, url: article.url },
          ]),
        ]}
      />
    </article>
  );
}
