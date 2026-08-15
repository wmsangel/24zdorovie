import Link from "next/link";
import { CATEGORIES } from "@/config/categories";
import { DEFAULT_LOCALE } from "@/config/site";
import { localePath, t } from "@/lib/i18n";

export default function NotFound() {
  const locale = DEFAULT_LOCALE;

  return (
    <div className="container-page py-24 text-center">
      <p className="kicker">404</p>
      <h1 className="mt-4 text-[2.4rem] md:text-[3.2rem]">{t(locale, "not_found_title")}</h1>
      <p className="mx-auto mt-4 max-w-lg text-[1.05rem] leading-relaxed text-[var(--ink-soft)]">
        {t(locale, "not_found_text")}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={localePath(locale)} className="btn btn-primary">
          {t(locale, "back_home")}
        </Link>
        <Link href={localePath(locale, "/search")} className="btn btn-ghost">
          {t(locale, "nav_search")}
        </Link>
      </div>

      <div className="mx-auto mt-14 flex max-w-3xl flex-wrap justify-center gap-2.5">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={localePath(locale, `/${c.slug}`)}
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-[0.88rem] font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand-strong)]"
          >
            {c.emoji} {c.name[locale]}
          </Link>
        ))}
      </div>
    </div>
  );
}
