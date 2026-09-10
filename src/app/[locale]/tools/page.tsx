import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { CATEGORIES, getCategory } from "@/config/categories";
import { LOCALES, SITE, type Locale } from "@/config/site";
import { TOOLS } from "@/config/tools";
import { isLocale, t } from "@/lib/i18n";
import { absolute, breadcrumbLd, buildMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/** Meta-заголовок и описание метят в head-запрос «калькуляторы здоровья»,
 *  тогда как H1 на странице остаётся коротким (tools_title). */
const META = {
  ru: {
    title: "Калькуляторы здоровья онлайн — бесплатные и по формулам",
    description:
      "Бесплатные онлайн-калькуляторы здоровья: ИМТ и состав тела, калории и БЖУ, биологический возраст, риск для сердца, давление, сон, вода. По опубликованным формулам, расчёт в браузере — данные никуда не уходят.",
  },
  en: {
    title: "Health Calculators Online — Free and Evidence-Based",
    description:
      "Free online health calculators: BMI and body composition, calories and macros, biological age, heart risk, blood pressure, sleep and water. Built on published formulas, all maths runs in your browser — your data never leaves it.",
  },
} as const;

/** FAQ используется и в разметке, и в FAQPage-схеме. */
const FAQ: Record<Locale, { q: string; a: string }[]> = {
  ru: [
    {
      q: "Точны ли онлайн-калькуляторы здоровья?",
      a: "Наши считают по опубликованным научным формулам (Mifflin-St Jeor для калорий, Levine PhenoAge для биовозраста, SCORE2 для риска ССЗ и т. д.), и под каждым инструментом указан источник. Это ориентир, а не диагноз: калькулятор не учитывает всей вашей истории и не заменяет врача.",
    },
    {
      q: "Это бесплатно и без регистрации?",
      a: "Да. Все калькуляторы и тесты бесплатны, регистрация не нужна, реклама не мешает расчёту.",
    },
    {
      q: "Сохраняются ли мои данные?",
      a: "Нет. Расчёт идёт прямо в браузере — введённые цифры (вес, рост, анализы) не отправляются на сервер и нигде не сохраняются.",
    },
    {
      q: "Заменяют ли калькуляторы врача?",
      a: "Нет. Они помогают понять свои цифры и задать врачу правильные вопросы, но не ставят диагноз и не назначают лечение. При тревожных симптомах обращайтесь к специалисту.",
    },
  ],
  en: [
    {
      q: "Are online health calculators accurate?",
      a: "Ours use published scientific formulas (Mifflin-St Jeor for calories, Levine PhenoAge for biological age, SCORE2 for cardiovascular risk, and so on), with the source stated under each tool. They're a guide, not a diagnosis: a calculator can't see your full history or replace a doctor.",
    },
    {
      q: "Is it free and without sign-up?",
      a: "Yes. Every calculator and test is free, no registration is needed, and ads never get in the way of the result.",
    },
    {
      q: "Is my data stored?",
      a: "No. The maths runs right in your browser — the numbers you enter (weight, height, lab results) are never sent to a server or stored anywhere.",
    },
    {
      q: "Do calculators replace a doctor?",
      a: "No. They help you understand your numbers and ask better questions, but they don't diagnose or prescribe. See a professional for worrying symptoms.",
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
    path: "/tools",
    title: META[locale].title,
    description: META[locale].description,
  });
}

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  // Группировка инструментов по рубрикам в порядке CATEGORIES — даёт
  // ключевые H2 и структуру вместо одной плоской сетки.
  const groups = CATEGORIES.map((cat) => ({
    cat,
    tools: TOOLS.filter((tool) => tool.category === cat.slug),
  })).filter((g) => g.tools.length > 0);

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
          <Breadcrumbs locale={locale} items={[{ label: t(locale, "tools_title") }]} />
          <div className="mt-6 max-w-2xl">
            <h1 className="text-[2.2rem] leading-tight md:text-[3rem]">
              {t(locale, "tools_title")}
            </h1>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-[var(--ink-soft)]">
              {t(locale, "tools_lede")}
            </p>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
              {locale === "ru"
                ? `${TOOLS.length} инструментов сгруппированы по темам. У каждого — короткий ответ над расчётом, прозрачная формула с источником и честная оговорка о том, чего он не умеет.`
                : `${TOOLS.length} tools, grouped by topic. Each has a short answer above the calculation, a transparent formula with its source, and an honest note on what it can't tell you.`}
            </p>
          </div>
        </div>
      </section>

      <div className="container-page py-12">
        {groups.map(({ cat, tools }) => (
          <section key={cat.slug} className="mb-12 last:mb-0">
            <h2 className="mb-6 flex items-center gap-2.5 font-display text-[1.5rem] font-semibold">
              <span aria-hidden="true">{cat.emoji}</span>
              {cat.name[locale]}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/${locale}/tools/${tool.slug}`}
                  data-accent={cat.accent}
                  className="card card-hover flex flex-col p-6"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-tint)] text-2xl">
                    {tool.emoji}
                  </span>
                  <h3 className="mt-5 font-display text-[1.35rem] font-semibold leading-snug">
                    {tool.name[locale]}
                  </h3>
                  <p className="mt-2.5 flex-1 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
                    {tool.tagline[locale]}
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

        <p className="mt-10 text-[0.88rem] text-[var(--ink-faint)]">
          🔒 {t(locale, "tools_privacy")}
        </p>

        {/* FAQ */}
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
            name: t(locale, "tools_title"),
            description: META[locale].description,
            url: absolute(`/${locale}/tools`),
            inLanguage: locale,
            isPartOf: { "@id": `${SITE.url}/#website` },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: TOOLS.length,
              itemListElement: TOOLS.map((tool, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absolute(`/${locale}/tools/${tool.slug}`),
                name: tool.name[locale],
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
            { name: t(locale, "tools_title"), url: `/${locale}/tools` },
          ]),
        ]}
      />
    </div>
  );
}
