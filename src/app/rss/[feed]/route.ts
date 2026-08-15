import { LOCALES, SITE_META, type Locale } from "@/config/site";
import { getArticles } from "@/lib/content";
import { absolute } from "@/lib/seo";
import { isLocale } from "@/lib/i18n";

export const dynamicParams = false;
/** Статический экспорт: фид собирается на этапе сборки, не по запросу */
export const dynamic = "force-static";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ feed: `${locale}.xml` }));
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET(_request: Request, { params }: { params: Promise<{ feed: string }> }) {
  const { feed } = await params;
  const locale = feed.replace(/\.xml$/, "");
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });

  const meta = SITE_META[locale as Locale];
  const articles = getArticles(locale).slice(0, 30);

  const items = articles
    .map(
      (a) => `    <item>
      <title>${escape(a.title)}</title>
      <link>${absolute(a.url)}</link>
      <guid isPermaLink="true">${absolute(a.url)}</guid>
      <description>${escape(a.description)}</description>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
      <category>${escape(a.category)}</category>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(meta.title)} — ${escape(meta.tagline)}</title>
    <link>${absolute(`/${locale}`)}</link>
    <description>${escape(meta.description)}</description>
    <language>${locale}</language>
    <lastBuildDate>${new Date(articles[0]?.date ?? Date.now()).toUTCString()}</lastBuildDate>
    <atom:link href="${absolute(`/rss/${locale}.xml`)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
