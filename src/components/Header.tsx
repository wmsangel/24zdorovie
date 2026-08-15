"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/config/categories";
import type { Locale } from "@/config/site";
import { localePath, translator } from "@/lib/i18n";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ locale }: { locale: Locale }) {
  const tr = translator(locale);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Закрываем меню при переходе на другую страницу.
  // Правим состояние прямо во время рендера, а не эффектом: React отбросит
  // текущий проход и перерисует сразу с закрытым меню, без лишнего кадра.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setMenu(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const other: Locale = locale === "ru" ? "en" : "ru";
  const featured = CATEGORIES.slice(0, 4);

  /**
   * Переключатель языка.
   *
   * Слаги переводов не совпадают (`biologicheskiy-vozrast` ↔ `biological-age-tests`),
   * поэтому подменять префикс локали в текущем пути нельзя: так получался 404
   * на каждой странице сайта.
   *
   * Точный адрес перевода уже посчитан на сервере и лежит в <link rel="alternate">.
   * Достаём его в момент клика, а не заранее: в разметке остаётся главная другой
   * локали — она существует всегда, поэтому и краулер, и открытие в новой вкладке
   * получают рабочий адрес, а не битый. Если перевода у страницы нет,
   * hreflang отсутствует и мы там же и остаёмся.
   */
  const otherHome = `/${other}`;

  const switchLanguage = (event: React.MouseEvent<HTMLAnchorElement>) => {
    /**
     * Запоминаем выбор: `.htaccess` читает эту куку на корне сайта и уводит
     * на выбранную локаль раньше, чем смотрит на Accept-Language. Пишем до
     * всех проверок ниже — клик по переключателю сам по себе есть выбор языка,
     * даже если у текущей страницы нет перевода и никуда перейти не выйдет.
     */
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `locale=${other}; path=/; max-age=31536000; SameSite=Lax${secure}`;

    // Ctrl/Cmd-клик и средняя кнопка открывают href как есть — не мешаем
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    const alt = document
      .querySelector(`link[rel="alternate"][hreflang="${other}"]`)
      ?.getAttribute("href");
    if (!alt) return;
    event.preventDefault();
    window.location.href = alt;
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--paper)_88%,transparent)] backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="container-page flex h-16 items-center gap-4 md:h-[4.5rem]">
        <Logo locale={locale} />

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label={tr("a11y_nav_main")}>
          <div
            className="relative"
            onMouseEnter={() => setMenu(true)}
            onMouseLeave={() => setMenu(false)}
          >
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-expanded={menu}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
            >
              {tr("section_categories")}
              <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform ${menu ? "rotate-180" : ""}`} fill="none" aria-hidden="true">
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {menu && (
              <div className="absolute left-0 top-full w-[34rem] pt-2">
                <div className="card animate-rise grid grid-cols-2 gap-1 p-2.5">
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c.slug}
                      href={localePath(locale, `/${c.slug}`)}
                      data-accent={c.accent}
                      className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-[var(--accent-tint)]"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-tint)] text-base">
                        {c.emoji}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{c.name[locale]}</span>
                        <span className="mt-0.5 line-clamp-1 block text-xs text-[var(--ink-faint)]">
                          {c.description[locale]}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {featured.map((c) => (
            <Link
              key={c.slug}
              href={localePath(locale, `/${c.slug}`)}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
            >
              {c.name[locale]}
            </Link>
          ))}

          <Link
            href={localePath(locale, "/tools")}
            className="rounded-full px-3.5 py-2 text-sm font-semibold text-[var(--brand-strong)] transition-colors hover:bg-[var(--brand-tint)]"
          >
            {tr("nav_tools")}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href={localePath(locale, "/search")}
            aria-label={tr("nav_search")}
            className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.4" stroke="currentColor" strokeWidth="1.8" />
              <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </Link>

          <ThemeToggle locale={locale} />

          <a
            href={otherHome}
            hrefLang={other}
            onClick={switchLanguage}
            className="hidden h-10 items-center rounded-full border border-[var(--line)] px-3.5 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)] sm:inline-flex"
          >
            {other.toUpperCase()}
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={tr("a11y_menu")}
            className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] text-[var(--ink)] lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
              {open ? (
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-[var(--line)] bg-[var(--paper)] px-5 py-6 lg:hidden">
          <div className="grid gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={localePath(locale, `/${c.slug}`)}
                data-accent={c.accent}
                className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-tint)] text-lg">
                  {c.emoji}
                </span>
                <span className="text-[0.95rem] font-semibold">{c.name[locale]}</span>
              </Link>
            ))}
          </div>
          <Link
            href={localePath(locale, "/tools")}
            className="mt-2 flex items-center gap-3 rounded-2xl border border-[var(--brand)] bg-[var(--brand-tint)] p-3"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface)] text-lg">
              🧮
            </span>
            <span className="text-[0.95rem] font-semibold text-[var(--brand-strong)]">
              {tr("nav_tools")}
            </span>
          </Link>

          <div className="mt-6 flex gap-2">
            <Link href={localePath(locale, "/articles")} className="btn btn-ghost flex-1">
              {tr("nav_all")}
            </Link>
            <a
              href={otherHome}
              hrefLang={other}
              onClick={switchLanguage}
              className="btn btn-ghost flex-1"
            >
              {tr("lang_switch")}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
