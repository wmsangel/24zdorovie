import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleRail } from "@/components/ArticleRail";
import { CategoryCard } from "@/components/CategoryCard";
import { Newsletter } from "@/components/Newsletter";
import { TopicsMarquee } from "@/components/TopicsMarquee";
import { CATEGORIES, getCategory } from "@/config/categories";
import { SITE_META, type Locale } from "@/config/site";
import { TOOLS } from "@/config/tools";
import { getAllTags, getArticles, getByCategory, getFeatured, tagSlug } from "@/lib/content";
import { isLocale, localePath, plural, translator } from "@/lib/i18n";

export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const tr = translator(locale);

  const all = getArticles(locale);
  const lead = getFeatured(locale, 1)[0];
  const rest = all.filter((a) => a.slug !== lead?.slug);
  /** Колонка рядом с главным материалом */
  const sidebar = rest.slice(0, 5);
  /** Лента с горизонтальным скроллом */
  const railItems = rest.slice(5, 17);
  /** Обычная сетка ниже — в неё же встраивается in-feed баннер */
  const gridItems = rest.slice(17, 23);
  const tags = getAllTags(locale).slice(0, 14);
  const tools = TOOLS.slice(0, 4);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="organic-blob left-[-8rem] top-[-10rem] h-[26rem] w-[26rem] bg-[var(--brand)]"
          aria-hidden="true"
        />
        <div
          className="organic-blob right-[-6rem] top-[2rem] h-[20rem] w-[20rem] bg-[#78d8a9]"
          aria-hidden="true"
        />
        <div className="container-page relative pt-12 pb-8 md:pt-16 md:pb-10">
          <div className="max-w-3xl">
            <p className="kicker">{tr("hero_kicker")}</p>
            <h1 className="mt-4 text-[2.6rem] leading-[1.04] md:text-[4rem]">
              {locale === "ru" ? (
                <>
                  Здоровье <span className="text-[var(--brand-strong)]">без мифов</span>
                </>
              ) : (
                <>
                  Health <span className="text-[var(--brand-strong)]">without the myths</span>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-[var(--ink-soft)] md:text-[1.15rem]">
              {SITE_META[locale].description}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Link href={localePath(locale, "/articles")} className="btn btn-primary">
                  {tr("hero_cta")}
                </Link>
                <Link href="#topics" className="btn btn-ghost">
                  {tr("hero_cta_secondary")}
                </Link>
              </div>
              <Stats
                locale={locale}
                articles={all.length}
                categories={CATEGORIES.length}
                tools={TOOLS.length}
              />
            </div>
          </div>
        </div>

        {/* Живая лента свежих заголовков — во всю ширину экрана */}
        <TopicsMarquee articles={all.slice(0, 12)} label={tr("section_latest")} />

        {/* Рубрики доступны сразу, до первого скролла */}
        <div className="container-page relative pt-7">
          <div
            className="rail rail-bare gap-2.5"
            role="region"
            aria-label={tr("section_categories")}
            tabIndex={0}
          >
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={localePath(locale, `/${c.slug}`)}
                data-accent={c.accent}
                className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-[0.88rem] font-semibold whitespace-nowrap transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <span aria-hidden="true">{c.emoji}</span>
                {c.name[locale]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Главное: крупная статья + колонка свежего ────────── */}
      {lead && (
        <section className="container-page mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ArticleCard article={lead} locale={locale} variant="lead" priority />
            </div>

            {sidebar.length > 0 && (
              <aside className="card flex flex-col p-5 md:p-6">
                <h2 className="flex items-center gap-2.5 text-lg">
                  <span
                    className="h-5 w-1 rounded-full bg-[var(--brand)]"
                    aria-hidden="true"
                  />
                  {tr("section_lead")}
                </h2>
                <ol className="mt-4 flex-1 space-y-4">
                  {sidebar.map((article) => (
                    <li
                      key={article.url}
                      className="border-t border-[var(--line)] pt-4 first:border-none first:pt-0"
                    >
                      <ArticleCard article={article} locale={locale} variant="list" />
                    </li>
                  ))}
                </ol>
                <Link
                  href={localePath(locale, "/articles")}
                  className="link-underline mt-5 w-fit text-[0.88rem] font-semibold text-[var(--brand-strong)]"
                >
                  {tr("all_articles")} →
                </Link>
              </aside>
            )}
          </div>
        </section>
      )}

      <div className="container-page mt-10">
        <AdSlot placement="header" locale={locale} />
      </div>

      {/* ── Свежее: горизонтальная лента ─────────────────────── */}
      {railItems.length > 0 && (
        <section className="container-page mt-16">
          <SectionHead
            title={tr("section_latest")}
            hint={tr("rail_hint")}
            href={localePath(locale, "/articles")}
            hrefLabel={tr("all_articles")}
          />
          <div className="mt-6">
            <ArticleRail articles={railItems} locale={locale} label={tr("section_latest")} />
          </div>
        </section>
      )}

      {/* ── Рубрики ──────────────────────────────────────────── */}
      <section id="topics" className="container-page mt-16 scroll-mt-24">
        <SectionHead title={tr("section_categories")} />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORIES.map((c) => (
            <CategoryCard
              key={c.slug}
              category={c}
              locale={locale}
              count={getByCategory(locale, c.slug).length}
            />
          ))}
        </div>
      </section>

      {/* ── Ещё материалы ────────────────────────────────────── */}
      {all.length === 0 && (
        <section className="container-page mt-16">
          <SectionHead title={tr("section_latest")} />
          <EmptyState locale={locale} />
        </section>
      )}

      {gridItems.length > 0 && (
        <section className="container-page mt-16">
          <SectionHead
            title={tr("section_more")}
            href={localePath(locale, "/articles")}
            hrefLabel={tr("all_articles")}
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gridItems.map((article, i) => (
              <Fragment key={article.url}>
                <ArticleCard article={article} locale={locale} />
                {i === 4 && <AdSlot placement="in-feed" locale={locale} className="h-full" />}
              </Fragment>
            ))}
          </div>
        </section>
      )}

      {/* ── Калькуляторы ─────────────────────────────────────── */}
      <section className="container-page mt-16">
        <SectionHead
          title={tr("tools_title")}
          href={localePath(locale, "/tools")}
          hrefLabel={tr("nav_tools")}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => {
            const cat = getCategory(tool.category);
            return (
              <Link
                key={tool.slug}
                href={localePath(locale, `/tools/${tool.slug}`)}
                data-accent={cat?.accent}
                className="card card-hover group flex items-start gap-4 p-5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-tint)] text-xl">
                  {tool.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[1.02rem] font-semibold leading-snug">
                    {tool.name[locale]}
                  </span>
                  <span className="mt-1.5 line-clamp-2 block text-[0.85rem] leading-relaxed text-[var(--ink-soft)]">
                    {tool.tagline[locale]}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Теги ─────────────────────────────────────────────── */}
      {tags.length > 0 && (
        <section className="container-page mt-16">
          <SectionHead title={tr("tags")} />
          <div className="mt-6 flex flex-wrap gap-2.5">
            {tags.map(({ tag, count }) => (
              <Link
                key={tag}
                href={localePath(locale, `/tag/${encodeURIComponent(tagSlug(tag))}`)}
                className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-[0.88rem] font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand-strong)]"
              >
                {tag}
                <span className="ml-1.5 text-[var(--ink-faint)]">{count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Подписка ─────────────────────────────────────────── */}
      <section className="container-page mt-16">
        <Newsletter locale={locale} />
      </section>
    </>
  );
}

/** Счётчики под hero: сколько всего материалов, рубрик и инструментов */
function Stats({
  locale,
  articles,
  categories,
  tools,
}: {
  locale: Locale;
  articles: number;
  categories: number;
  tools: number;
}) {
  const items =
    locale === "ru"
      ? [
          [articles, plural(articles, ["материал", "материала", "материалов"])],
          [categories, plural(categories, ["рубрика", "рубрики", "рубрик"])],
          [tools, plural(tools, ["калькулятор", "калькулятора", "калькуляторов"])],
        ]
      : [
          [articles, articles === 1 ? "article" : "articles"],
          [categories, categories === 1 ? "topic" : "topics"],
          [tools, tools === 1 ? "calculator" : "calculators"],
        ];

  return (
    <dl className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
      {(items as [number, string][]).map(([value, label]) => (
        <div key={label} className="flex items-baseline gap-1.5">
          <dt className="sr-only">{label}</dt>
          <dd className="flex items-baseline gap-1.5">
            <span className="font-display text-[1.6rem] font-semibold leading-none text-[var(--brand-strong)]">
              {value}
            </span>
            <span className="text-[0.85rem] text-[var(--ink-soft)]">{label}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SectionHead({
  title,
  href,
  hrefLabel,
  hint,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
      <h2 className="flex items-center gap-3 text-2xl md:text-[2rem]">
        <span className="h-7 w-1.5 rounded-full bg-[var(--brand)]" aria-hidden="true" />
        {title}
      </h2>
      <div className="flex items-center gap-4">
        {hint && (
          <span className="hidden text-[0.82rem] text-[var(--ink-faint)] sm:inline">
            {hint} →
          </span>
        )}
        {href && (
          <Link
            href={href}
            className="link-underline text-[0.9rem] font-semibold text-[var(--brand-strong)]"
          >
            {hrefLabel} →
          </Link>
        )}
      </div>
    </div>
  );
}

function EmptyState({ locale }: { locale: Locale }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-[var(--line)] p-12 text-center">
      <p className="text-[var(--ink-soft)]">
        {locale === "ru"
          ? "Первые материалы уже готовятся — загляните чуть позже."
          : "The first articles are on the way — check back soon."}
      </p>
    </div>
  );
}
