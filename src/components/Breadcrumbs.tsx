import Link from "next/link";
import type { Locale } from "@/config/site";
import { t } from "@/lib/i18n";

export type Crumb = { href?: string; label: string };

export function Breadcrumbs({ items, locale }: { items: Crumb[]; locale: Locale }) {
  const all: Crumb[] = [{ href: `/${locale}`, label: t(locale, "breadcrumb_home") }, ...items];

  return (
    <nav aria-label={t(locale, "a11y_nav_breadcrumb")} className="text-[0.82rem] text-[var(--ink-faint)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden="true" className="opacity-50">
                /
              </span>
            )}
            {item.href && i < all.length - 1 ? (
              <Link href={item.href} className="transition-colors hover:text-[var(--brand-strong)]">
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--ink-soft)]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
