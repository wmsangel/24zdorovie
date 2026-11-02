export const SITE = {
  domain: "24zdorovie.com",
  url: "https://24zdorovie.com",
  name: "24zdorovie",
  /** Год запуска — используется в копирайте и schema.org */
  founded: 2026,
  email: "info@24zdorovie.com",
  /**
   * Email-рассылка через MailerLite (встраиваемая форма, universal.js).
   * Своего бэкенда на статике нет, поэтому форму рендерит сам MailerLite.
   * Заполнить ДВА значения из аккаунта MailerLite:
   *   account — ID из сниппета `ml('account','XXXXXXX')` (Sites/Forms → embed);
   *   form    — код встраиваемой формы из `<div class="ml-embedded" data-form="YYYYYYY">`.
   * Пока любое из полей пустое — блок подписки не рендерится (ничего не ломается).
   *
   * Встраиваемая форма одноязычная: её тексты (кнопка, согласие) задаются в
   * кабинете MailerLite. `form` используется по умолчанию для обеих локалей.
   * Если завести отдельную русскую форму — положить её код в `formRu`, и на
   * RU-страницах покажется она; пусто — везде используется `form`.
   */
  newsletter: {
    account: "2685197" as string,
    form: "UXgHTM" as string,
    formRu: "" as string,
  },
  /** Уходит в sameAs организации в schema.org — только живые профили */
  social: {
    telegramRu: "https://t.me/zdorovie24Ru",
    telegramEn: "https://t.me/zdorovie24En",
    instagram: "",
    youtube: "",
  },
  /** Аналитика — пустая строка = отключено */
  analytics: {
    gaId: "G-XDC4L8ZBQ5",
    yandexMetrikaId: "111156412",
  },
} as const;

/**
 * Боевой хост. Счётчики и реклама считают только на нём; зеркало на
 * `*.pages.dev`, превью и локальная сборка отдают тот же HTML и иначе
 * слились бы в ту же проперти GA/Метрики. См. src/components/Analytics.tsx
 * (клиентская проверка) и functions/_middleware.js (301 с зеркала).
 */
export const PROD_HOST = "24zdorovie.com";

/**
 * ЕЭЗ плюс Великобритания и Швейцария — там аналитические и рекламные cookies
 * требуют согласия. GA4/AdSense получают этот список в Consent Mode (region-
 * параметр) и сами уходят в режим без cookies; у Яндекс.Метрики region-
 * параметра нет, поэтому страну спрашиваем у Cloudflare (`/cdn-cgi/trace`) и
 * в этих странах не грузим её вовсе. Описание для людей — на странице privacy,
 * держать синхронно.
 */
export const CONSENT_REQUIRED_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV",
  "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
] as const;

export type Locale = "ru" | "en";

export const LOCALES: Locale[] = ["ru", "en"];
export const DEFAULT_LOCALE: Locale = "ru";

/** Соответствие локали и языкового кода для hreflang / og:locale */
export const OG_LOCALE: Record<Locale, string> = {
  ru: "ru_RU",
  en: "en_US",
};

export const SITE_META: Record<Locale, { title: string; tagline: string; description: string }> = {
  ru: {
    title: "24zdorovie",
    tagline: "Здоровье без мифов",
    description:
      "Питание, движение, сон и ментальное здоровье — понятные разборы, рецепты и практические протоколы, основанные на доказательной медицине.",
  },
  en: {
    title: "24zdorovie",
    tagline: "Health without the myths",
    description:
      "Nutrition, movement, sleep and mental health — clear explainers, recipes and practical protocols grounded in evidence-based science.",
  },
};
