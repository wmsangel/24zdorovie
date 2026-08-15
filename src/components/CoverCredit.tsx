import type { CoverCredit as Credit } from "@/lib/content";
import type { Locale } from "@/config/site";

/**
 * Подпись под обложкой: автор, источник и лицензия.
 * Лицензии Unsplash и Pexels не требуют атрибуции, но для YMYL-тематики
 * честное указание источника — дешёвый сигнал доверия, поэтому выводим всегда.
 */
export function CoverCredit({ credit, locale }: { credit: Credit; locale: Locale }) {
  const label = locale === "ru" ? "Фото" : "Photo";
  const name = credit.source ? `${credit.author} / ${credit.source}` : credit.author;

  return (
    <figcaption className="mt-2 text-right text-[0.78rem] text-[var(--ink-faint)]">
      {label}:{" "}
      {credit.url ? (
        <a
          href={credit.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="underline decoration-[var(--line)] underline-offset-2 transition-colors hover:decoration-[var(--brand)]"
        >
          {name}
        </a>
      ) : (
        name
      )}
      {credit.license ? ` · ${credit.license}` : ""}
    </figcaption>
  );
}
