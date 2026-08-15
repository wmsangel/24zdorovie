import Image from "next/image";
import Link from "next/link";
import { getCategory } from "@/config/categories";
import type { Locale } from "@/config/site";
import type { Article } from "@/lib/content";
import { formatDate, t } from "@/lib/i18n";

/** Обложка: фото из frontmatter либо декоративная заливка в цвете рубрики */
export function CoverArt({
  article,
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, 33vw",
}: {
  article: Article;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  const cat = getCategory(article.category);
  if (article.cover) {
    return (
      <Image
        src={article.cover}
        alt={article.coverAlt ?? article.title}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`grid h-full w-full place-items-center bg-[var(--accent-tint)] ${className}`}
      aria-hidden="true"
    >
      <span
        className="absolute -right-6 -top-8 h-32 w-32 rounded-full opacity-40 blur-2xl"
        style={{ background: "var(--accent)" }}
      />
      <span className="relative text-5xl opacity-90">{cat?.emoji ?? "🌿"}</span>
    </div>
  );
}

type Variant = "default" | "hero" | "lead" | "list" | "wide";

export function ArticleCard({
  article,
  locale,
  variant = "default",
  priority = false,
}: {
  article: Article;
  locale: Locale;
  variant?: Variant;
  priority?: boolean;
}) {
  const cat = getCategory(article.category);
  const meta = (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.78rem] text-[var(--ink-faint)]">
      <time dateTime={article.date}>{formatDate(article.date, locale)}</time>
      <span aria-hidden="true">·</span>
      <span>
        {article.minutes} {t(locale, "min_read")}
      </span>
    </div>
  );

  if (variant === "list") {
    return (
      <article data-accent={cat?.accent} className="group flex gap-4">
        <Link
          href={article.url}
          className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--line)]"
          tabIndex={-1}
          aria-hidden="true"
        >
          <CoverArt article={article} sizes="96px" />
        </Link>
        <div className="min-w-0">
          <h3 className="text-[0.98rem] leading-snug">
            <Link href={article.url} className="link-underline">
              {article.title}
            </Link>
          </h3>
          <div className="mt-1.5">{meta}</div>
        </div>
      </article>
    );
  }

  if (variant === "hero") {
    return (
      <article
        data-accent={cat?.accent}
        className="card card-hover group relative overflow-hidden lg:flex"
      >
        <Link href={article.url} className="relative block aspect-[16/10] lg:aspect-auto lg:w-[54%]">
          <CoverArt article={article} priority={priority} sizes="(max-width: 1024px) 100vw, 55vw" />
        </Link>
        <div className="flex flex-col justify-center p-6 md:p-9 lg:w-[46%]">
          {cat && <span className="chip w-fit">{cat.emoji} {cat.name[locale]}</span>}
          <h2 className="mt-4 text-2xl md:text-[2rem]">
            <Link href={article.url} className="link-underline">
              {article.title}
            </Link>
          </h2>
          <p className="mt-3 line-clamp-3 text-[0.98rem] leading-relaxed text-[var(--ink-soft)]">
            {article.description}
          </p>
          <div className="mt-5">{meta}</div>
        </div>
      </article>
    );
  }

  /* Главный материал в шапке главной: обложка сверху, крупный заголовок под ней.
   * От "hero" отличается тем, что рассчитан на 2/3 ширины рядом с колонкой свежего. */
  if (variant === "lead") {
    return (
      <article
        data-accent={cat?.accent}
        className="card card-hover group flex h-full flex-col overflow-hidden"
      >
        <Link href={article.url} className="relative block aspect-[16/9] overflow-hidden">
          <CoverArt
            article={article}
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 66vw"
          />
        </Link>
        <div className="flex flex-1 flex-col p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            {cat && (
              <span className="chip">
                {cat.emoji} {cat.name[locale]}
              </span>
            )}
            {meta}
          </div>
          <h2 className="mt-4 text-[1.7rem] leading-tight md:text-[2.25rem]">
            <Link href={article.url} className="link-underline">
              {article.title}
            </Link>
          </h2>
          <p className="mt-3 line-clamp-3 text-[1rem] leading-relaxed text-[var(--ink-soft)] md:text-[1.05rem]">
            {article.description}
          </p>
          <span className="mt-6 inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-[var(--accent)]">
            {t(locale, "read_more")}
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
        </div>
      </article>
    );
  }

  if (variant === "wide") {
    return (
      <article data-accent={cat?.accent} className="card card-hover group flex overflow-hidden">
        <Link href={article.url} className="relative hidden w-44 shrink-0 sm:block">
          <CoverArt article={article} sizes="176px" />
        </Link>
        <div className="min-w-0 flex-1 p-5 md:p-6">
          {cat && <span className="chip">{cat.name[locale]}</span>}
          <h3 className="mt-3 text-lg leading-snug md:text-xl">
            <Link href={article.url} className="link-underline">
              {article.title}
            </Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
            {article.description}
          </p>
          <div className="mt-4">{meta}</div>
        </div>
      </article>
    );
  }

  return (
    <article data-accent={cat?.accent} className="card card-hover group flex flex-col overflow-hidden">
      <Link href={article.url} className="relative block aspect-[16/10] overflow-hidden">
        <CoverArt article={article} priority={priority} />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {cat && <span className="chip w-fit">{cat.name[locale]}</span>}
        <h3 className="mt-3 text-lg leading-snug">
          <Link href={article.url} className="link-underline">
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
          {article.description}
        </p>
        <div className="mt-auto pt-4">{meta}</div>
      </div>
    </article>
  );
}
