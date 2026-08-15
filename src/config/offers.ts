import type { Locale } from "./site";

/**
 * Партнёрские офферы под результат калькулятора.
 *
 * Блок появляется сразу под виджетом — в точке, где человек уже получил цифру
 * и настроен что-то с ней делать. Это единственное место на сайте, где реклама
 * стоит осознанно рядом с медицинской темой, поэтому дисклеймеры не опция:
 * тип оффера (`kind`) сам определяет, какое предупреждение подставится.
 *
 * Как добавить оффер:
 *   1. дописать объект в OFFERS;
 *   2. указать `tools` — слаги из src/config/tools.ts, под какими показывать;
 *   3. выбрать `kind` — от него зависит обязательная приписка;
 *   4. получить `erid` в ОРД и вписать сюда (см. docs/MONETIZATION.md).
 *
 * Пустой массив = блок нигде не рендерится. В dev вместо него рисуется
 * образец, чтобы вёрстку было видно без живых партнёрских ссылок.
 */
export type OfferKind =
  /** БАД: обязательна пометка «не является лекарственным средством» */
  | "supplement"
  /** Медуслуга, приём, анализы: обязательно предупреждение о противопоказаниях */
  | "medical"
  /** Обычный товар — весы, трекер, коврик: спецтребований нет */
  | "goods";

export type Offer = {
  id: string;
  /** Слаги инструментов, под которыми показывать оффер */
  tools: string[];
  locales: Locale[];
  kind: OfferKind;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  cta: Record<Locale, string>;
  href: string;
  /** Необязательная приписка о цене: «от 2 490 ₽» */
  price?: Record<Locale, string>;
  /**
   * Токен маркировки из ОРД. Без него размещение в РФ считается
   * немаркированной рекламой — см. docs/MONETIZATION.md.
   */
  erid?: string;
  /** Рекламодатель: название и ИНН, требование к маркировке */
  advertiser?: string;
  /** ISO-дата окончания показа; после неё оффер не выводится */
  until?: string;
};

export const OFFERS: Offer[] = [
  // Пример заполнения — раскомментировать и подставить свои значения:
  // {
  //   id: "sberhealth-checkup-2026q3",
  //   tools: ["biological-age-calculator", "bmi-calculator"],
  //   locales: ["ru"],
  //   kind: "medical",
  //   title: {
  //     ru: "Чек-ап по девяти показателям крови",
  //     en: "Nine-marker blood check-up",
  //   },
  //   description: {
  //     ru: "Те же анализы, что нужны калькулятору: СРБ, альбумин, креатинин, глюкоза и остальные шесть.",
  //     en: "The same panel the calculator asks for: CRP, albumin, creatinine, glucose and six more.",
  //   },
  //   cta: { ru: "Записаться", en: "Book" },
  //   href: "https://partner.example/?utm_source=24zdorovie&utm_medium=tool",
  //   price: { ru: "от 3 900 ₽", en: "from $49" },
  //   erid: "2Vfnxxxxxxx",
  //   advertiser: "ООО «Рекламодатель», ИНН 0000000000",
  //   until: "2026-12-31",
  // },
];

/** Первый подходящий оффер для инструмента: по слагу, локали и сроку показа */
export function pickOffer(toolSlug: string, locale: Locale): Offer | undefined {
  const now = Date.now();
  return OFFERS.find(
    (o) =>
      o.tools.includes(toolSlug) &&
      o.locales.includes(locale) &&
      (!o.until || +new Date(o.until) >= now),
  );
}
