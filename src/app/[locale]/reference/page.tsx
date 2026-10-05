import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { CATEGORIES, getCategory } from "@/config/categories";
import { LOCALES, SITE, type Locale } from "@/config/site";
import { REFERENCE } from "@/config/reference";
import { isLocale, t } from "@/lib/i18n";
import { absolute, breadcrumbLd, buildMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/** Meta метит в запрос «справочник добавок / какие витамины пить»,
 *  H1 на странице остаётся коротким (reference_title). */
const META = {
  ru: {
    title: "Справочник добавок: что доказано, а что реклама",
    description:
      "Доказательный справочник витаминов, минералов и БАДов: по каждой добавке — что реально доказано, рабочая доза с источником, пищевые источники и разбор мифов. Без взаимодействий с лекарствами и диагнозов.",
  },
  en: {
    title: "Supplement Guide: What's Proven and What's Marketing",
    description:
      "An evidence-based guide to vitamins, minerals and supplements: for each one, what is actually proven, the working dose with its source, food sources and the myths debunked. No drug interactions, no diagnosis.",
  },
} as const;

const FAQ: Record<Locale, { q: string; a: string }[]> = {
  ru: [
    {
      q: "Чем этот справочник отличается от рекламы добавок?",
      a: "Каждая карточка опирается на опубликованные исследования и метаанализы, а не на обещания производителя. Мы честно разделяем «доказано» и «раздуто» и под каждой добавкой указываем источники. Цель — помочь не переплачивать за бесполезное.",
    },
    {
      q: "Это замена консультации врача?",
      a: "Нет. Это образовательный материал. Он не учитывает вашу историю болезни, лекарства и анализы и не ставит диагноз. Перед приёмом добавок, особенно при хронических болезнях и беременности, обсудите это с врачом.",
    },
    {
      q: "Почему нет информации о взаимодействии с лекарствами?",
      a: "Намеренно. Взаимодействия добавок с лекарствами и подбор доз при болезнях — зона ответственности врача и фармацевта, а не общедоступной карточки. Мы даём доказательную базу по эффективности и безопасности у здоровых взрослых.",
    },
  ],
  en: [
    {
      q: "How is this different from supplement marketing?",
      a: "Every card is built on published studies and meta-analyses, not on a manufacturer's promises. We clearly separate 'proven' from 'hyped' and cite the sources under each supplement. The goal is to help you not overpay for things that don't work.",
    },
    {
      q: "Does this replace a doctor?",
      a: "No. This is educational material. It doesn't know your medical history, medications or lab results, and it doesn't diagnose. Before taking supplements — especially with chronic conditions or during pregnancy — discuss it with your doctor.",
    },
    {
      q: "Why is there no drug-interaction information?",
      a: "Deliberately. Drug–supplement interactions and dosing in disease are the responsibility of a doctor and pharmacist, not of a public card. We give the evidence on efficacy and safety in healthy adults.",
    },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return buildMetadata({
    locale,
    path: "/reference",
    title: META[locale].title,
    description: META[locale].description,
  });
}

export default async function ReferenceIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const groups = CATEGORIES.map((cat) => ({
    cat,
    items: REFERENCE.filter((item) => item.category === cat.slug),
  })).filter((g) => g.items.length > 0);

  const faq = FAQ[locale];
  const faqTitle = locale === "ru" ? "Частые вопросы" : "Frequently asked questions";

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--brand-tint)]">
        <div
          className="organic-blob right-[-4rem] top-[-6rem] h-72 w-72 bg-[var(--brand)]"
          aria-hidden="true"
        />
        <div className="container-page relative py-10 md:py-14">
          <Breadcrumbs locale={locale} items={[{ label: t(locale, "reference_title") }]} />
          <div className="mt-6 max-w-2xl">
            <h1 className="text-[2.2rem] leading-tight md:text-[3rem]">
              {t(locale, "reference_title")}
            </h1>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-[var(--ink-soft)]">
              {t(locale, "reference_lede")}
            </p>
          </div>
        </div>
      </section>

      <div className="container-page py-12">
        {groups.map(({ cat, items }) => (
          <section key={cat.slug} className="mb-12 last:mb-0">
            <h2 className="mb-6 flex items-center gap-2.5 font-display text-[1.5rem] font-semibold">
              <span aria-hidden="true">{cat.emoji}</span>
              {cat.name[locale]}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.slug}
                  href={`/${locale}/reference/${item.slug}`}
                  data-accent={cat.accent}
                  className="card card-hover flex flex-col p-6"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-tint)] text-2xl">
                    {item.emoji}
                  </span>
                  <h3 className="mt-5 font-display text-[1.35rem] font-semibold leading-snug">
                    {item.name[locale]}
                  </h3>
                  <p className="mt-2.5 flex-1 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
                    {item.tagline[locale]}
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
              ))}
            </div>
          </section>
        ))}

        <section className="mt-14 max-w-3xl">
          <h2 className="font-display text-[1.6rem] font-semibold">{faqTitle}</h2>
          <dl className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {faq.map((item) => (
              <div key={item.q} className="py-5">
                <dt className="font-semibold text-[var(--ink)]">{item.q}</dt>
                <dd className="mt-2 text-[0.96rem] leading-relaxed text-[var(--ink-soft)]">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: t(locale, "reference_title"),
            description: META[locale].description,
            url: absolute(`/${locale}/reference`),
            inLanguage: locale,
            isPartOf: { "@id": `${SITE.url}/#website` },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: REFERENCE.length,
              itemListElement: REFERENCE.map((item, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absolute(`/${locale}/reference/${item.slug}`),
                name: item.name[locale],
              })),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          },
          breadcrumbLd([
            { name: t(locale, "breadcrumb_home"), url: `/${locale}` },
            { name: t(locale, "reference_title"), url: `/${locale}/reference` },
          ]),
        ]}
      />
    </div>
  );
}
