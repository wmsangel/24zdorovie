import { ADS } from "@/config/ads";
import { pickOffer, type Offer, type OfferKind } from "@/config/offers";
import type { Locale } from "@/config/site";
import { t, type TranslationKey } from "@/lib/i18n";

const NOTE_KEY: Record<OfferKind, TranslationKey> = {
  supplement: "offer_note_supplement",
  medical: "offer_note_medical",
  goods: "offer_note_goods",
};

/**
 * Партнёрский блок под результатом калькулятора.
 *
 * Три вещи, которые тут сделаны намеренно и которые нельзя «почистить»:
 *
 * 1. Пометка «Реклама» и erid стоят видимо, а не мелким шрифтом в углу.
 *    Требование закона, но и просто честнее: человек только что получил
 *    медицинскую цифру и вправе понимать, где кончается расчёт и начинается
 *    коммерция.
 * 2. Обязательная приписка выбирается по типу оффера, а не пишется руками
 *    в каждом объекте — забыть её структурно нельзя.
 * 3. rel="sponsored" — иначе поисковик считает ссылку редакционной
 *    рекомендацией, а на медицинском сайте это прямой путь под фильтр.
 *
 * Офферы задаются в src/config/offers.ts. Если подходящего нет, блок
 * не рендерится вовсе — кроме dev, где показывается образец вёрстки.
 */
export function OfferBlock({ toolSlug, locale }: { toolSlug: string; locale: Locale }) {
  const offer = pickOffer(toolSlug, locale) ?? devSample(locale);
  if (!offer) return null;

  return (
    <aside
      className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
      aria-label={t(locale, "ad_label")}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface-2)] px-5 py-2">
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
          {t(locale, "ad_label")}
        </span>
        {offer.erid && (
          <span className="text-[0.7rem] text-[var(--ink-faint)] tabular-nums">
            erid: {offer.erid}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="font-display text-[1.15rem] font-semibold leading-snug">
            {offer.title[locale]}
          </p>
          <p className="mt-1.5 text-[0.94rem] leading-relaxed text-[var(--ink-soft)]">
            {offer.description[locale]}
          </p>
          {offer.price && (
            <p className="mt-2 text-[0.95rem] font-bold text-[var(--brand-strong)]">
              {offer.price[locale]}
            </p>
          )}
        </div>
        <a
          href={offer.href}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="btn btn-primary shrink-0 self-start sm:self-center"
        >
          {offer.cta[locale]}
        </a>
      </div>

      <div className="space-y-1 border-t border-[var(--line)] bg-[var(--surface-2)] px-5 py-3 text-[0.72rem] leading-relaxed text-[var(--ink-faint)]">
        <p>{t(locale, NOTE_KEY[offer.kind])}</p>
        <p>{t(locale, "affiliate_note")}</p>
        {offer.advertiser && <p>{offer.advertiser}</p>}
      </div>
    </aside>
  );
}

/**
 * Образец для разработки: живых партнёрских ссылок ещё нет, а вёрстку блока
 * видеть надо. В прод не попадает — как и плейсхолдеры рекламных мест.
 */
function devSample(locale: Locale): Offer | undefined {
  if (process.env.NODE_ENV === "production" || !ADS.showPlaceholders) return undefined;

  return {
    id: "dev-sample",
    tools: [],
    locales: [locale],
    kind: "medical",
    title: {
      ru: "Образец оффера (виден только в dev)",
      en: "Sample offer (dev only)",
    },
    description: {
      ru: "Так блок выглядит с заполненным оффером. Настоящие задаются в src/config/offers.ts.",
      en: "This is how the block looks with an offer. Real ones live in src/config/offers.ts.",
    },
    cta: { ru: "Перейти", en: "Open" },
    href: "#",
    price: { ru: "от 3 900 ₽", en: "from $49" },
    erid: "2Vfnxxxxxxxxxxxxxxx",
    advertiser: "ООО «Рекламодатель», ИНН 0000000000",
  };
}
