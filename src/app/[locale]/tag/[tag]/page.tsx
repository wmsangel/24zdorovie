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

/**
 * Описание тег-страницы из заголовков её статей.
 *
 * Раньше здесь был шаблон «Все материалы по теме X — N статей», из-за чего
 * десятки тег-страниц читались как почти-дубли (Bing это отмечает). Теперь
 * подставляем сами заголовки — сколько влезает в ~155 символов, остаток
 * сворачиваем в «и ещё N». Первый заголовок берём всегда (при нужде обрезаем),
 * чтобы описание не выродилось в один хвост «и ещё N материалов».
 */
function tagDescription(locale: Locale, tag: string, titles: string[]): string {
  const count = titles.length;
  const prefix = locale === "ru" ? `«${tag}» на 24zdorovie: ` : `“${tag}” on 24zdorovie: `;
  // Лимит на заголовочную часть; поверх ляжет суффикс «…и ещё N материалов»,
  // поэтому держим MAX ниже 160, чтобы итог остался в рамках сниппета.
  const MAX = 138;

  const picked: string[] = [];
  for (const title of titles) {
    const candidate = picked.length ? `${prefix}${[...picked, title].join(" · ")}` : `${prefix}${title}`;
    if (candidate.length > MAX) break;
    picked.push(title);
  }
  if (picked.length === 0 && titles[0]) {
    // единственный заголовок длиннее лимита — обрезаем по слову
    const room = MAX - prefix.length - 1;
    picked.push(`${titles[0].slice(0, Math.max(0, room)).replace(/\s+\S*$/, "")}…`);
  }

  // Каждый элемент picked = одна статья (полный заголовок или усечённый первый).
  const rest = count - picked.length;
  let body = `${prefix}${picked.join(" · ")}`;
  if (rest > 0) {
    body +=
      locale === "ru"
        ? ` и ещё ${rest} ${plural(rest, ["материал", "материала", "материалов"])}`
        : ` and ${rest} more`;
  }
  return `${body}.`;
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
  const tagged = getByTag(locale, tag);
  const count = tagged.length;

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
    // Описание собираем из реальных заголовков статей тега, а не из шаблона:
    // так каждая тег-страница уникальна по содержанию (не «почти дубль»)
    // и заодно информативнее в выдаче.
    description: tagDescription(
      locale,
      tag,
      tagged.map((a) => a.title),
    ),
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
