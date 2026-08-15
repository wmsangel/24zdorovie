export const SITE = {
  domain: "24zdorovie.com",
  url: "https://24zdorovie.com",
  name: "24zdorovie",
  /** Год запуска — используется в копирайте и schema.org */
  founded: 2026,
  email: "hello@24zdorovie.com",
  /**
   * Приём подписки. На статическом хостинге своего эндпоинта нет,
   * поэтому сюда вставляется полный URL формы внешнего сервиса
   * (SendPulse, Mailchimp, Buttondown). Пустая строка — форма скрыта.
   */
  newsletterEndpoint: "" as string,
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
