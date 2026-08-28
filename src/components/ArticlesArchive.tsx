import { Fragment } from "react";
import { AdSlot } from "@/components/AdSlot";
import { ArticleCard } from "@/components/ArticleCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Pagination } from "@/components/Pagination";
import type { Locale } from "@/config/site";
import { getArticles } from "@/lib/content";
import { plural, t } from "@/lib/i18n";
import { paginate } from "@/lib/paginate";
import { breadcrumbLd, collectionLd } from "@/lib/seo";

/**
 * Архив всех статей — общий рендер для /{locale}/articles/
 * и /{locale}/articles/page/{n}/. Отличаются страницы только номером,
 * поэтому обе страницы-роута сводятся к вызову этого компонента.
 */
export function ArticlesArchive({ locale, page }: { locale: Locale; page: number }) {
  const all = getArticles(locale);
  const p = paginate(all, page);
  const title = t(locale, "all_articles");
  const base = `/${locale}/articles`;

  const heading = p.page === 1 ? title : `${title} — ${t(locale, "pagination_page")} ${p.page}`;

  return (
    <div className="container-page py-10 md:py-14">
      <Breadcrumbs
        locale={locale}
        items={
          p.page === 1
            ? [{ label: title }]
            : [
                { href: base, label: title },
                { label: `${t(locale, "pagination_page")} ${p.page}` },
              ]
        }
      />
      <h1 className="mt-6 text-[2.2rem] md:text-[3rem]">{heading}</h1>
      <p className="mt-3 text-[var(--ink-soft)]">
        {locale === "ru"
          ? `${p.total} ${plural(p.total, ["материал", "материала", "материалов"])} в архиве`
          : `${p.total} articles in the archive`}
        {p.pages > 1 && (
          <>
            {" · "}
            {t(locale, "pagination_page")} {p.page} {t(locale, "pagination_of")} {p.pages}
          </>
        )}
      </p>

      {p.items.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-[var(--line)] p-12 text-center text-[var(--ink-soft)]">
          {t(locale, "empty_category")}
        </p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {p.items.map((article, i) => (
            <Fragment key={article.url}>
              {/* priority только на первой странице: там карточки в первом экране */}
              <ArticleCard article={article} locale={locale} priority={p.page === 1 && i < 3} />
              {(i + 1) % 6 === 0 && (
                <AdSlot placement="in-feed" locale={locale} className="h-full" seed={article.slug} />
              )}
            </Fragment>
          ))}
        </div>
      )}

      <Pagination base={base} page={p.page} pages={p.pages} locale={locale} />

      <JsonLd
        data={[
          collectionLd({
            name: heading,
            description: heading,
            url: p.page === 1 ? base : `${base}/page/${p.page}`,
            locale,
            items: p.items,
          }),
          breadcrumbLd([
            { name: t(locale, "breadcrumb_home"), url: `/${locale}` },
            { name: title, url: base },
            ...(p.page === 1
              ? []
              : [
                  {
                    name: `${t(locale, "pagination_page")} ${p.page}`,
                    url: `${base}/page/${p.page}`,
                  },
                ]),
          ]),
        ]}
      />
    </div>
  );
}
