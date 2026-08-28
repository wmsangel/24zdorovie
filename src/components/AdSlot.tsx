import Image from "next/image";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import {
  ADS,
  SLOTS,
  pickDirectBanner,
  pickHouseAd,
  type AdPlacement,
  type HouseAd,
} from "@/config/ads";
import type { Locale } from "@/config/site";
import { t } from "@/lib/i18n";

/**
 * Универсальное рекламное место.
 * Приоритет: прямой баннер → AdSense → плейсхолдер (только в dev).
 */
export function AdSlot({
  placement,
  locale,
  className = "",
  seed,
}: {
  placement: AdPlacement;
  locale: Locale;
  className?: string;
  /** Ключ страницы (обычно слаг) — прокручивает домовые баннеры по сайту */
  seed?: string;
}) {
  const spec = SLOTS[placement];
  const direct = pickDirectBanner(placement, locale);

  if (direct) {
    return (
      <aside
        className={`not-prose ${direct.mobileOnly ? "lg:hidden" : ""} ${className}`}
        aria-label={t(locale, "ad_label")}
      >
        <AdLabel locale={locale} />
        <a
          href={direct.href}
          rel={direct.sponsored ? "sponsored noopener" : "noopener"}
          target="_blank"
          style={{ maxWidth: direct.width }}
          className="mx-auto block overflow-hidden rounded-2xl border border-[var(--line)]"
        >
          <Image
            src={direct.image}
            alt={direct.alt}
            width={direct.width}
            height={direct.height}
            className="h-auto w-full"
          />
        </a>
        {(direct.erid || direct.advertiser) && (
          <p className="mt-1 text-[0.62rem] leading-tight text-[var(--ink-faint)]">
            {[direct.advertiser, direct.erid && `erid: ${direct.erid}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </aside>
    );
  }

  const house = pickHouseAd(placement, locale, seed);
  if (house) {
    return (
      <aside className={`not-prose ${className}`} aria-label={t(locale, "ad_label")}>
        <AdLabel locale={locale} />
        <HouseAdCard ad={house} placement={placement} locale={locale} minHeight={spec.minHeight} />
      </aside>
    );
  }

  if (ADS.adsense.enabled && ADS.adsense.client && spec.adsense) {
    return (
      <aside className={`not-prose ${className}`} aria-label={t(locale, "ad_label")}>
        <AdLabel locale={locale} />
        <AdSenseUnit
          client={ADS.adsense.client}
          slot={spec.adsense}
          minHeight={spec.minHeight}
        />
      </aside>
    );
  }

  if (process.env.NODE_ENV === "development" && ADS.showPlaceholders) {
    return (
      <aside
        className={`not-prose grid place-items-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] text-center ${className}`}
        style={{ minHeight: spec.minHeight }}
        aria-hidden="true"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
          {spec.label}
        </span>
      </aside>
    );
  }

  return null;
}

function houseHref(ad: HouseAd): string {
  const sep = ad.href.includes("?") ? "&" : "?";
  return `${ad.href}${sep}utm_source=24zdorovie&utm_medium=house&utm_campaign=cross-promo`;
}

function HouseAdCard({
  ad,
  placement,
  locale,
  minHeight,
}: {
  ad: HouseAd;
  placement: AdPlacement;
  locale: Locale;
  minHeight: number;
}) {
  const copy = ad.copy[locale]!;
  const vertical = placement === "sidebar";

  return (
    <a
      href={houseHref(ad)}
      rel="sponsored noopener"
      target="_blank"
      style={{ minHeight, ["--ad-accent" as string]: ad.accent }}
      className={`group flex overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] transition-colors hover:border-[var(--ad-accent)] ${
        vertical
          ? "flex-col items-center justify-center gap-4 p-6 text-center"
          : "flex-row items-center gap-4 p-4"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid shrink-0 place-items-center rounded-xl text-2xl ${
          vertical ? "size-16 text-3xl" : "size-12"
        }`}
        style={{
          backgroundColor: "color-mix(in srgb, var(--ad-accent) 14%, transparent)",
        }}
      >
        {ad.emoji}
      </span>

      <span className={`flex min-w-0 flex-col ${vertical ? "items-center gap-1.5" : "gap-0.5"}`}>
        <span className="text-base font-semibold text-[var(--ink)]">{copy.title}</span>
        <span className="text-sm leading-snug text-[var(--ink-soft)]">{copy.tagline}</span>
      </span>

      <span
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold text-white transition-transform group-hover:translate-x-0.5 ${
          vertical ? "mt-1" : "ml-auto"
        }`}
        style={{ backgroundColor: "var(--ad-accent)" }}
      >
        {copy.cta}
        <span aria-hidden="true">→</span>
      </span>
    </a>
  );
}

function AdLabel({ locale }: { locale: Locale }) {
  return (
    <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
      {t(locale, "ad_label")}
    </p>
  );
}
