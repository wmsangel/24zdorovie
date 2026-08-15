import Link from "next/link";
import { CATEGORIES } from "@/config/categories";
import { SITE, SITE_META, type Locale } from "@/config/site";
import { TOOLS } from "@/config/tools";
import { localePath, translator } from "@/lib/i18n";
import { Logo } from "./Logo";
import { Newsletter } from "./Newsletter";

export function Footer({ locale }: { locale: Locale }) {
  const tr = translator(locale);
  const year = new Date().getFullYear();

  // Калькуляторы линкуются из футера поимённо: сквозная перелинковка
  // на страницы-инструменты заметно ускоряет их попадание в индекс
  const toolLinks = [
    { href: "/tools", label: tr("tools_title") },
    ...TOOLS.map((t) => ({ href: `/tools/${t.slug}`, label: t.name[locale] })),
  ];

  const projectLinks = [
    { href: "/about", label: locale === "ru" ? "О проекте" : "About" },
    { href: "/authors", label: locale === "ru" ? "Авторы и редполитика" : "Authors & editorial policy" },
    { href: "/contacts", label: locale === "ru" ? "Контакты" : "Contacts" },
    { href: "/advertising", label: locale === "ru" ? "Реклама на сайте" : "Advertise" },
  ];

  const legalLinks = [
    { href: "/privacy", label: locale === "ru" ? "Политика конфиденциальности" : "Privacy policy" },
    { href: "/terms", label: locale === "ru" ? "Пользовательское соглашение" : "Terms of use" },
    { href: "/disclaimer", label: locale === "ru" ? "Медицинский дисклеймер" : "Medical disclaimer" },
  ];

  return (
    <footer className="mt-24 border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="container-page py-14">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_2fr]">
          <div>
            <Logo locale={locale} />
            <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
              {SITE_META[locale].description}
            </p>
            <div className="mt-6 max-w-sm">
              <Newsletter locale={locale} variant="compact" />
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <nav aria-label={tr("footer_rubrics")}>
              <h2 className="font-display text-base font-semibold">{tr("footer_rubrics")}</h2>
              <ul className="mt-4 space-y-2.5 text-[0.9rem]">
                {CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={localePath(locale, `/${c.slug}`)}
                      className="text-[var(--ink-soft)] transition-colors hover:text-[var(--brand-strong)]"
                    >
                      {c.name[locale]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label={tr("tools_title")}>
              <h2 className="font-display text-base font-semibold">{tr("tools_title")}</h2>
              <ul className="mt-4 space-y-2.5 text-[0.9rem]">
                {toolLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={localePath(locale, l.href)}
                      className="text-[var(--ink-soft)] transition-colors hover:text-[var(--brand-strong)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label={tr("footer_project")}>
              <h2 className="font-display text-base font-semibold">{tr("footer_project")}</h2>
              <ul className="mt-4 space-y-2.5 text-[0.9rem]">
                {projectLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={localePath(locale, l.href)}
                      className="text-[var(--ink-soft)] transition-colors hover:text-[var(--brand-strong)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href={`/rss/${locale}.xml`}
                    className="text-[var(--ink-soft)] transition-colors hover:text-[var(--brand-strong)]"
                  >
                    RSS
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-label={tr("footer_legal")}>
              <h2 className="font-display text-base font-semibold">{tr("footer_legal")}</h2>
              <ul className="mt-4 space-y-2.5 text-[0.9rem]">
                {legalLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={localePath(locale, l.href)}
                      className="text-[var(--ink-soft)] transition-colors hover:text-[var(--brand-strong)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--line)] pt-6 text-[0.82rem] text-[var(--ink-faint)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.name}. {tr("footer_rights")}.
          </p>
          <p className="max-w-xl sm:text-right">{tr("disclaimer_text")}</p>
        </div>
      </div>
    </footer>
  );
}
