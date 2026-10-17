import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { LOCALES, SITE, type Locale } from "@/config/site";
import { getAllTags, tagSlug, TAG_INDEX_MIN } from "@/lib/content";
import { isLocale, localePath, plural, t } from "@/lib/i18n";
import { absolute, breadcrumbLd, buildMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Указатель тегов. Нужен, чтобы корень /{locale}/tag/ не отдавал 404
 * (страницы отдельных тегов живут глубже), а собирал потерянный там
 * краулинг-бюджет в индексируемый хаб с перелинковкой на все теги.
 */
const META = {
  ru: {
    label: "Темы",
    title: "Все темы и теги материалов — 24zdorovie",
    description:
      "Полный указатель тем сайта: питание, сон, добавки, фитнес и другое. Выберите тег — и соберёте все материалы по нужному вопросу в одном месте.",
    lede: "Все темы, по которым на сайте есть материалы. Выберите тег — и соберёте всё по нужному вопросу.",
    empty: "Пока нет тем с достаточным числом материалов.",
    count: (n: number) => `${n} ${plural(n, ["материал", "материала", "материалов"])}`,
  },
  en: {
    label: "Topics",
    title: "All topics and tags — 24zdorovie",
    description:
      "A full index of the site's topics: nutrition, sleep, supplements, fitness and more. Pick a tag to gather every article on the subject in one place.",
    lede: "Every topic the site has material on. Pick a tag to gather everything on the subject.",
    empty: "No topics with enough material yet.",
    count: (n: number) => `${n} ${n === 1 ? "article" : "articles"}`,
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return buildMetadata({
    locale,
    path: "/tag",
    title: META[locale].title,
    description: META[locale].description,
  });
}

export default async function TagIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  // В указатель берём только теги не-thin content — ровно те, что
  // индексируются и попадают в sitemap (порог TAG_INDEX_MIN). Остальные
  // (1–2 материала) дублировали бы карточку статьи и в индекс не идут.
  const tags = getAllTags(locale).filter((tg) => tg.count >= TAG_INDEX_MIN);
  const m = META[locale];

  return (
    <div className="container-page py-10 md:py-14">
      <Breadcrumbs locale={locale} items={[{ label: m.label }]} />
      <h1 className="mt-6 text-[2.2rem] md:text-[3rem]">{m.label}</h1>
      <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">{m.lede}</p>

      {tags.length === 0 ? (
        <p className="mt-10 text-[var(--ink-soft)]">{m.empty}</p>
      ) : (
        <ul className="mt-10 flex flex-wrap gap-3">
          {tags.map(({ tag, count }) => (
            <li key={tag}>
              <Link
                href={localePath(locale, `/tag/${encodeURIComponent(tagSlug(tag))}`)}
                className="card card-hover inline-flex items-baseline gap-2 px-4 py-2.5"
              >
                <span className="font-semibold">#{tag}</span>
                <span className="text-[0.85rem] tabular-nums text-[var(--ink-faint)]">{count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: m.label,
            description: META[locale].description,
            url: absolute(`/${locale}/tag`),
            inLanguage: locale,
            isPartOf: { "@id": `${SITE.url}/#website` },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: tags.length,
              itemListElement: tags.map(({ tag }, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absolute(`/${locale}/tag/${encodeURIComponent(tagSlug(tag))}`),
                name: `#${tag}`,
              })),
            },
          },
          breadcrumbLd([
            { name: t(locale, "breadcrumb_home"), url: `/${locale}` },
            { name: m.label, url: `/${locale}/tag` },
          ]),
        ]}
      />
    </div>
  );
}
