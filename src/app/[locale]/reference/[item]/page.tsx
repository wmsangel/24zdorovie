import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { ArticleCard } from "@/components/ArticleCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Mdx } from "@/components/mdx/Mdx";
import { Newsletter } from "@/components/Newsletter";
import { ShareBar } from "@/components/ShareBar";
import { getCategory } from "@/config/categories";
import { LOCALES, SITE, type Locale } from "@/config/site";
import { REFERENCE, getRefItem } from "@/config/reference";
import { getArticle, type Article } from "@/lib/content";
import { formatDate, isLocale, localePath, t } from "@/lib/i18n";
import { breadcrumbLd, buildMetadata, faqLd, supplementLd } from "@/lib/seo";
import { getRefPage } from "@/lib/reference";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => REFERENCE.map((item) => ({ locale, item: item.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; item: string }>;
}): Promise<Metadata> {
  const { locale, item: slug } = await params;
  if (!isLocale(locale) || !getRefItem(slug)) return {};
  const page = getRefPage(locale, slug);
  if (!page) return {};

  return buildMetadata({
    locale,
    path: `/reference/${slug}`,
    title: page.title,
    description: page.description,
    category: getRefItem(slug)?.category,
    modifiedTime: page.updated,
  });
}

/** "/fitness/strength-training" → статья, если она существует в этой локали */
function resolveRelated(locale: Locale, paths: string[]): Article[] {
  return paths
    .map((path) => {
      const [, category, slug] = path.split("/");
      return category && slug ? getArticle(locale, category, slug) : undefined;
    })
    .filter((a): a is Article => Boolean(a));
}

export default async function ReferencePage({
  params,
}: {
  params: Promise<{ locale: string; item: string }>;
}) {
  const { locale: raw, item: slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const item = getRefItem(slug);
  const page = item ? getRefPage(locale, slug) : null;
  if (!item || !page) notFound();

  const cat = getCategory(item.category);
  const related = resolveRelated(locale, item.related[locale]);
  const rest = REFERENCE.filter((x) => x.slug !== item.slug);
  const others = [
    ...rest.filter((x) => x.category === item.category),
    ...rest.filter((x) => x.category !== item.category),
  ].slice(0, 6);
  const url = `${SITE.url}/${locale}/reference/${item.slug}/`;

  return (
    <div data-accent={cat?.accent}>
      <header className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--accent-tint)]">
        <div
          className="organic-blob right-[-5rem] top-[-8rem] h-80 w-80 bg-[var(--accent)]"
          aria-hidden="true"
        />
        <div className="container-page relative py-10 md:py-14">
          <Breadcrumbs
            locale={locale}
            items={[
              { href: localePath(locale, "/reference"), label: t(locale, "reference_title") },
              { label: item.name[locale] },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <span className="chip">
              {item.emoji} {cat?.name[locale]}
            </span>
            <h1 className="mt-4 text-[2rem] leading-[1.1] md:text-[3rem]">{page.title}</h1>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-[var(--ink-soft)] md:text-[1.15rem]">
              {page.description}
            </p>
            {page.updated && (
              <p className="mt-4 text-[0.82rem] text-[var(--ink-faint)]">
                {t(locale, "updated")}: {formatDate(page.updated, locale)}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="container-page py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          {page.lede && (
            <p className="rounded-2xl border-l-[3px] border-[var(--accent)] bg-[var(--surface-2)] px-5 py-4 text-[1.02rem] leading-relaxed">
              {page.lede}
            </p>
          )}

          {/* Заголовки задаёт сам MDX — текст карточки пишется свободно */}
          <div className="prose mt-8">
            <Mdx source={page.body} />
          </div>

          {page.faq && page.faq.length > 0 && (
            <section className="mt-14">
              <h2 className="font-display text-2xl font-semibold md:text-3xl">
                {t(locale, "faq_title")}
              </h2>
              <div className="mt-6 divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
                {page.faq.map((item, i) => (
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

          {page.sources && page.sources.length > 0 && (
            <section className="mt-14">
              <h2 className="font-display text-2xl font-semibold">{t(locale, "sources_title")}</h2>
              <ol className="mt-4 space-y-2 text-[0.92rem] text-[var(--ink-soft)]">
                {page.sources.map((s, i) => (
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

          <aside className="mt-12 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-5">
            <p className="font-semibold">⚕️ {t(locale, "disclaimer_title")}</p>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
              {t(locale, "disclaimer_text")}
            </p>
          </aside>

          <div className="mt-8 border-t border-[var(--line)] pt-6">
            <ShareBar url={url} title={page.title} locale={locale} />
          </div>

          <AdSlot placement="article-end" locale={locale} className="mt-10" seed={item.slug} />
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="border-b border-[var(--line)] pb-4 text-2xl md:text-[2rem]">
              {t(locale, "tools_related")}
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((a) => (
                <ArticleCard key={a.url} article={a} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section className="mt-16">
            <h2 className="border-b border-[var(--line)] pb-4 text-2xl">
              {t(locale, "reference_other")}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {others.map((o) => {
                const oc = getCategory(o.category);
                return (
                  <Link
                    key={o.slug}
                    href={`/${locale}/reference/${o.slug}`}
                    data-accent={oc?.accent}
                    className="card card-hover flex items-start gap-4 p-5"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--accent-tint)] text-xl">
                      {o.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-[1.1rem] font-semibold">
                        {o.name[locale]}
                      </span>
                      <span className="mt-1 block text-[0.88rem] leading-relaxed text-[var(--ink-soft)]">
                        {o.tagline[locale]}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-8">
              <Link
                href={`/${locale}/reference`}
                className="inline-flex items-center gap-1.5 text-[0.92rem] font-semibold text-[var(--brand-strong)] hover:underline"
              >
                {locale === "ru" ? "Весь справочник добавок" : "The whole supplement guide"}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
        )}

        <section className="mt-20">
          <Newsletter locale={locale} />
        </section>
      </div>

      <JsonLd
        data={[
          supplementLd({
            name: item.name[locale],
            description: page.description,
            url: `/${locale}/reference/${item.slug}`,
            locale,
            category: item.category,
            aka: page.aka,
            recommendedIntake: page.recommendedIntake,
            safety: page.safety,
            updated: page.updated,
          }),
          page.faq?.length ? faqLd(page.faq) : null,
          breadcrumbLd([
            { name: t(locale, "breadcrumb_home"), url: `/${locale}` },
            { name: t(locale, "reference_title"), url: `/${locale}/reference` },
            { name: item.name[locale], url: `/${locale}/reference/${item.slug}` },
          ]),
        ]}
      />
    </div>
  );
}
