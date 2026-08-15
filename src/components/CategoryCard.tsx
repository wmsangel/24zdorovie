import Link from "next/link";
import type { Category } from "@/config/categories";
import type { Locale } from "@/config/site";
import { localePath, plural } from "@/lib/i18n";

export function CategoryCard({
  category,
  locale,
  count,
}: {
  category: Category;
  locale: Locale;
  count: number;
}) {
  const label =
    locale === "ru"
      ? `${count} ${plural(count, ["материал", "материала", "материалов"])}`
      : `${count} ${count === 1 ? "article" : "articles"}`;

  return (
    <Link
      href={localePath(locale, `/${category.slug}`)}
      data-accent={category.accent}
      className="card card-hover group relative flex flex-col overflow-hidden p-4 sm:p-5"
    >
      {/* Акцентная полоса рубрики: единственный цветной элемент в сетке из 12 карточек */}
      <span
        className="absolute inset-x-0 top-0 h-1 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "var(--accent)" }}
        aria-hidden="true"
      />
      <span
        className="absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40"
        style={{ background: "var(--accent)" }}
        aria-hidden="true"
      />

      {/* На узких экранах карточки идут в две колонки, поэтому эмодзи и название
        * складываются в столбик, а описание прячется: 12 рубрик в один столбец
        * растягивали главную на пару экранов пустой прокрутки. */}
      <div className="relative flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--accent-tint)] text-xl sm:h-11 sm:w-11">
          {category.emoji}
        </span>
        {/* min-height в две строки: иначе в сетке 2×N карточки скачут по высоте */}
        <h3 className="min-h-[2.4rem] min-w-0 text-[0.95rem] leading-snug sm:min-h-0 sm:text-[1.05rem]">
          {category.name[locale]}
        </h3>
      </div>

      <p className="relative mt-3 hidden flex-1 text-[0.875rem] leading-relaxed text-[var(--ink-soft)] sm:line-clamp-2 sm:block">
        {category.description[locale]}
      </p>

      <span className="relative mt-3 flex items-center justify-between gap-2 text-[0.78rem] font-semibold text-[var(--accent)] sm:mt-4">
        {label}
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
          fill="none"
          aria-hidden="true"
        >
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
  );
}
