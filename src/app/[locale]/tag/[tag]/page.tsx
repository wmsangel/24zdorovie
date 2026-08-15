import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { LOCALES, type Locale } from "@/config/site";
import { getAllTags, getByTag, tagBySlug, tagSlug, TAG_INDEX_MIN } from "@/lib/content";
import { isLocale, plural, t } from "@/lib/i18n";
import { breadcrumbLd, buildMetadata, collectionLd } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

/**
 * В URL идёт слаг тега («силовые-тренировки»), но не закодированный:
 * Next кодирует параметры сам, а если сделать это заранее, кириллица
 * кодируется дважды и страница перестаёт находиться (404 при dynamicParams: false).
 *
 * Обратно в params слаг приходит уже закодированным — отсюда decodeURIComponent
 * ниже. Асимметрия неочевидная, но так работает роутер.
 */
export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    getAllTags(locale).map(({ tag }) => ({ locale, tag: tagSlug(tag) })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}): Promise<Metadata> {
  const { locale, tag: encoded } = await params;
  if (!isLocale(locale)) return {};
  const slug = decodeURIComponent(encoded);
  const tag = tagBySlug(locale, slug);
  if (!tag) return {};
  const count = getByTag(locale, tag).length;

  /**
   * Теги привязаны к языку: «аденозин» есть только в русских статьях.
   * Без явного списка альтернатив buildMetadata выдал бы hreflang на
   * /en/tag/аденозин — страницу, которой не существует. Поэтому локаль
   * попадает в hreflang, только если тег в ней реально что-то находит.
   */
  const alternates = Object.fromEntries(
    LOCALES.filter((l) => getByTag(l, tag).length > 0).map((l) => [l, `/tag/${slug}`]),
  ) as Partial<Record<Locale, string>>;

  return buildMetadata({
    locale,
    path: `/tag/${slug}`,
    alternates,
    title: locale === "ru" ? `${tag}: подборка материалов` : `${tag}: articles`,
    description:
      locale === "ru"
        ? `Все материалы по теме «${tag}» — ${count} ${plural(count, ["статья", "статьи", "статей"])} на 24zdorovie.`
        : `Everything tagged “${tag}” — ${count} articles on 24zdorovie.`,
    // Тег с одним материалом дублирует карточку статьи — в индекс не отдаём
    noindex: count < TAG_INDEX_MIN,
  });
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale: raw, tag: encoded } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const slug = decodeURIComponent(encoded);
  const tag = tagBySlug(locale, slug);
  const articles = tag ? getByTag(locale, tag) : [];

  if (!tag || articles.length === 0) notFound();

  return (
    <div className="container-page py-10 md:py-14">
      <Breadcrumbs locale={locale} items={[{ label: `#${tag}` }]} />
      <h1 className="mt-6 text-[2.2rem] md:text-[3rem]">#{tag}</h1>
      <p className="mt-3 text-[var(--ink-soft)]">
        {locale === "ru"
          ? `${articles.length} ${plural(articles.length, ["материал", "материала", "материалов"])}`
          : `${articles.length} articles`}
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, i) => (
          <ArticleCard key={article.url} article={article} locale={locale} priority={i < 3} />
        ))}
      </div>

      <JsonLd
        data={[
          collectionLd({
            name: `#${tag}`,
            description: tag,
            url: `/${locale}/tag/${slug}`,
            locale,
            items: articles,
          }),
          breadcrumbLd([
            { name: t(locale, "breadcrumb_home"), url: `/${locale}` },
            { name: `#${tag}`, url: `/${locale}/tag/${slug}` },
          ]),
        ]}
      />
    </div>
  );
}
