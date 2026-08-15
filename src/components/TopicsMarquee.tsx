import Link from "next/link";
import { getCategory } from "@/config/categories";
import type { Article } from "@/lib/content";

/**
 * Бегущая строка со свежими заголовками — полноширинная полоса под hero.
 *
 * Едет за счёт CSS-анимации: список рендерится дважды, дорожка сдвигается
 * ровно на половину своей ширины, и склейка получается незаметной. JS не
 * участвует — сайт собирается статикой (output: export).
 *
 * Второй список — чисто декоративный дубль: он скрыт от скринридеров и
 * выключен из таб-порядка, иначе каждая ссылка звучала бы дважды.
 */
export function TopicsMarquee({
  articles,
  label,
}: {
  articles: Article[];
  label: string;
}) {
  if (articles.length === 0) return null;

  /**
   * Длительность цикла считается от длины строки, а не задана константой:
   * заголовки меняются с каждой новой статьёй, и при фиксированных 60 с
   * лента то летела бы, то ползла. ~10 px на символ плюс ~64 px на эмодзи,
   * точку и отступы; делим на комфортные 95 px/с.
   */
  const width = articles.reduce((sum, a) => sum + a.title.length * 10 + 64, 0);
  const duration = Math.round(width / 95);

  const row = (duplicate: boolean) => (
    <ul className="marquee-row" aria-hidden={duplicate || undefined}>
      {articles.map((article) => {
        const cat = getCategory(article.category);
        return (
          <li key={article.url} className="marquee-item">
            <Link
              href={article.url}
              tabIndex={duplicate ? -1 : undefined}
              className="inline-flex items-center gap-2 whitespace-nowrap text-[0.92rem] text-[var(--ink-soft)] transition-colors hover:text-[var(--brand-strong)]"
            >
              <span aria-hidden="true">{cat?.emoji ?? "🌿"}</span>
              {article.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      className="marquee border-y border-[var(--line)] bg-[var(--surface-2)] py-3"
      role="region"
      aria-label={label}
    >
      <div
        className="marquee-track"
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
