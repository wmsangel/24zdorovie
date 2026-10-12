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
  {
    id: "sberhealth-priem",
    // Под медкалькуляторами, где «записаться к врачу / сдать анализы» — логичный
    // следующий шаг: биовозраст → чек-ап, риск ССЗ → кардиолог/анализы,
    // симптомы → онлайн-консультация.
    tools: [
      "biological-age-calculator",
      "cvd-risk-calculator",
      "cold-flu-covid-checker",
      "blood-test-unit-converter",
      "blood-pressure-checker",
    ],
    locales: ["ru"],
    kind: "medical",
    title: {
      ru: "Запись к врачу и онлайн-консультация — СберЗдоровье",
      en: "Doctor's appointment and online consultation — SberHealth",
    },
    description: {
      ru: "Онлайн-консультации, анализы и запись на приём: 8000+ клиник и 120 000 врачей по России, скидка до 50% на первый приём.",
      en: "Online consultations, tests and appointments across Russia.",
    },
    cta: { ru: "Записаться", en: "Book" },
    href: "https://yknhc.com/g/j121kp52md1d9ff0ed903cdca90c0a/?erid=2bL9aMPo2e49hMef4rqyS8BgEh",
    price: { ru: "скидка до 50% на первый приём", en: "up to 50% off the first visit" },
    erid: "2bL9aMPo2e49hMef4rqyS8BgEh",
    advertiser: "ООО «ДокДок», ИНН 9710011437",
  },
  // Doctronic (tsygg.com) убран 2026-10-12: программа приостановлена (Program is
  // suspended) и пропала из подключённых в Admitad. Был EN-оффер на мед-калькуляторах.
  // Вернуть, если программа возобновится и снова появится в advcampaigns.
  {
    id: "iherb-supplements",
    // Под калькуляторами добавок/питания: витамин D → купить витамин D,
    // белок → протеин, клетчатка → псиллиум. Медкалькуляторы заняты Сбером —
    // здесь конфликта нет. iHerb.group — RU (доставка по РФ, рос. карты).
    tools: ["vitamin-d-calculator", "protein-calculator", "fiber-calculator"],
    locales: ["ru"],
    kind: "supplement",
    title: {
      ru: "Витамины и добавки — iHerb",
      en: "Vitamins & supplements — iHerb",
    },
    description: {
      ru: "35 000+ товаров: витамины B, C, D, E, омега-3, протеин, клетчатка. Доставка по России, оплата российскими картами.",
      en: "Vitamins, omega-3, protein and more, delivered across Russia.",
    },
    cta: { ru: "Смотреть", en: "Shop" },
    href: "https://xnmik.com/g/ncvzabqdgm1d9ff0ed9062343b7806/?erid=2bL9aMPo2e49hMef4pfzYmiQPz",
    erid: "2bL9aMPo2e49hMef4pfzYmiQPz",
    advertiser: "ООО «Форест», ИНН 7814817732",
  },
  // СпросиВрача (rkdro.com) убрана 2026-10-05: программа приостановлена в сети
  // (Program is suspended) — не крутим рекламу с erid на неработающую программу.
  // Вернуть вместе с inline-ProductCard в статьях RU, если программа возобновится.
  {
    id: "polza-diet-delivery",
    // Под калькуляторами питания/веса, где «рассчитал рацион → закажи готовое
    // диетпитание» — логичный следующий шаг. Медкалькуляторы заняты Сбером,
    // добавки — iHerb; здесь конфликта нет. Польза — медицинские диеты
    // (Стол №5 при ЖКТ, Стол №9 при диабете), гео Москва и СПб.
    tools: ["calorie-macro-calculator", "bmi-calculator", "ideal-weight-calculator"],
    locales: ["ru"],
    kind: "goods",
    title: {
      ru: "Готовое питание по диете — Польза",
      en: "Ready diet meals — Polza",
    },
    description: {
      ru: "Доставка готового рациона на день по медицинским диетам: Стол №5 при болезнях ЖКТ, Стол №9 при диабете, варианты 1200–2000 ккал без глютена и лактозы. Москва и СПб.",
      en: "Ready-made medical-diet meals delivered across Moscow and St. Petersburg.",
    },
    cta: { ru: "Смотреть рационы", en: "See plans" },
    href: "https://tywhh.com/g/l7h3l7fb7d1d9ff0ed90b6fd49dbd9/?erid=2bL9aMPo2e49hMef4peznKd8xa",
    erid: "2bL9aMPo2e49hMef4peznKd8xa",
    advertiser: "ООО «ГПК», ИНН 7813650417",
  },
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
