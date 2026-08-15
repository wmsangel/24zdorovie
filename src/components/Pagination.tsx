import Link from "next/link";
import type { Locale } from "@/config/site";
import { t } from "@/lib/i18n";
import { pagePath, pageWindow } from "@/lib/paginate";

/**
 * Постраничная навигация под листингом.
 *
 * Ссылки — обычные <a> через next/link: на статическом экспорте это
 * единственный вариант, который работает без JS и виден краулеру.
 * Текущая страница выводится не ссылкой, а span с aria-current.
 */
export function Pagination({
  base,
  page,
  pages,
  locale,
  className = "",
}: {
  /** Путь листинга без номера, например "/ru/articles" */
  base: string;
  page: number;
  pages: number;
  locale: Locale;
  className?: string;
}) {
  if (pages <= 1) return null;

  const numbers = pageWindow(page, pages);
  const box =
    "grid h-11 min-w-11 place-items-center rounded-xl border px-3 text-[0.95rem] font-semibold tabular-nums transition-colors";
  const idle = "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]";

  return (
    <nav aria-label={t(locale, "pagination_label")} className={`mt-12 ${className}`}>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {page > 1 ? (
            <Link href={pagePath(base, page - 1)} rel="prev" className={`${box} ${idle}`}>
              ← {t(locale, "pagination_prev")}
            </Link>
          ) : (
            <span className={`${box} border-transparent text-[var(--ink-faint)] opacity-40`}>
              ← {t(locale, "pagination_prev")}
            </span>
          )}
        </li>

        {numbers.map((n, i) =>
          n === null ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-[var(--ink-faint)]">
              …
            </li>
          ) : (
            <li key={n}>
              {n === page ? (
                <span
                  aria-current="page"
                  className={`${box} border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-strong)]`}
                >
                  {n}
                </span>
              ) : (
                <Link href={pagePath(base, n)} className={`${box} ${idle}`}>
                  {n}
                </Link>
              )}
            </li>
          ),
        )}

        <li>
          {page < pages ? (
            <Link href={pagePath(base, page + 1)} rel="next" className={`${box} ${idle}`}>
              {t(locale, "pagination_next")} →
            </Link>
          ) : (
            <span className={`${box} border-transparent text-[var(--ink-faint)] opacity-40`}>
              {t(locale, "pagination_next")} →
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
