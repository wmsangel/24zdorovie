import { ArticleCard } from "@/components/ArticleCard";
import type { Locale } from "@/config/site";
import type { Article } from "@/lib/content";

/**
 * Горизонтальная лента статей с нативным скроллом и snap-остановками.
 *
 * tabIndex={0} стоит намеренно: скроллящийся контейнер должен получать фокус,
 * иначе с клавиатуры до карточек за краем экрана не добраться.
 * Разметка и стили — CSS-only, компонент серверный (сайт собирается статикой).
 */
export function ArticleRail({
  articles,
  locale,
  label,
}: {
  articles: Article[];
  locale: Locale;
  label: string;
}) {
  if (articles.length === 0) return null;

  return (
    <div className="rail" role="region" aria-label={label} tabIndex={0}>
      {articles.map((article) => (
        <div key={article.url} className="rail-item">
          <ArticleCard article={article} locale={locale} />
        </div>
      ))}
    </div>
  );
}
