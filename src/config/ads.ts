import type { Locale } from "./site";

/**
 * Единая точка управления рекламой.
 *
 * Как включить AdSense:
 *   1. вписать client: "ca-pub-XXXXXXXXXXXXXXX"
 *   2. enabled: true — этого достаточно, чтобы загрузчик появился в <head>
 *      на всех страницах: так работают автоматические объявления и так же
 *      Google проверяет сайт при подключении
 *   3. для ручных плейсментов дополнительно проставить slot-id в SLOTS
 *
 * Пока slot-id не заданы, ручные блоки не рендерятся вовсе: пустой <ins>
 * без слота даёт ошибку в консоли и «дыру» в вёрстке. В dev на их месте
 * рисуется плейсхолдер, в проде место не занимает вертикаль.
 *
 * Не забыть про public/ads.txt — без него AdSense ограничивает показы.
 */
export const ADS = {
  adsense: {
    enabled: true,
    client: "ca-pub-5535516142831006",
  },
  /** Яндекс.РСЯ — альтернатива/дополнение для RU-локали */
  yandex: {
    enabled: false,
    blockIds: {} as Partial<Record<AdPlacement, string>>,
  },
  /** Показывать плейсхолдеры блоков в режиме разработки */
  showPlaceholders: true,
} as const;

export type AdPlacement =
  | "header" // горизонтальный баннер под шапкой
  | "in-feed" // между карточками в ленте
  | "in-article" // внутри текста статьи
  | "article-end" // после текста статьи
  | "sidebar"; // липкий блок в сайдбаре статьи

export const SLOTS: Record<AdPlacement, { adsense?: string; minHeight: number; label: string }> = {
  header: { minHeight: 90, label: "Header 970×90" },
  "in-feed": { minHeight: 250, label: "In-feed 300×250" },
  "in-article": { minHeight: 250, label: "In-article" },
  "article-end": { minHeight: 280, label: "Article end" },
  sidebar: { minHeight: 600, label: "Sidebar 300×600" },
};

/**
 * Прямые баннеры — продаются напрямую, не требуют внешних скриптов.
 * Работают как fallback: если для плейсмента есть активный прямой баннер,
 * он выигрывает у сетевой рекламы (у прямых продаж выше CPM).
 */
export type DirectBanner = {
  id: string;
  placement: AdPlacement;
  locales: Locale[];
  href: string;
  /** Путь в /public или абсолютный URL */
  image: string;
  imageDark?: string;
  alt: string;
  width: number;
  height: number;
  /** ISO-дата окончания показа; после неё баннер не выводится */
  until?: string;
  sponsored?: boolean;
  /**
   * Токен маркировки из ОРД. У партнёрских баннеров вшит в креатив, но по
   * закону должен быть и на самом размещении — выводим подписью под картинкой.
   */
  erid?: string;
  /** Рекламодатель: выводится подписью под баннером рядом с erid */
  advertiser?: string;
};

export const DIRECT_BANNERS: DirectBanner[] = [
  // СберЗдоровье (ДОКДОК) — Admitad, только RU. Креативы вшиты с «Реклама»,
  // противопоказаниями и 18+; erid дублируем подписью через AdSlot.
  {
    id: "sber-sidebar-160x600",
    placement: "sidebar",
    locales: ["ru"],
    href: "https://yknhc.com/g/77wmol9wye1d9ff0ed903cdca90c0a/?i=4&erid=2bL9aMPo2e49hMef4rrTs88WFr",
    image: "/ads/sber-160x600.jpg",
    alt: "СберЗдоровье — запись к врачу со скидкой до 50%",
    width: 160,
    height: 600,
    sponsored: true,
    erid: "2bL9aMPo2e49hMef4rrTs88WFr",
    advertiser: "СберЗдоровье (ДОКДОК)",
  },
  {
    id: "sber-infeed-300x250",
    placement: "in-feed",
    locales: ["ru"],
    href: "https://yknhc.com/g/p1fauyxvi91d9ff0ed903cdca90c0a/?i=4&erid=2bL9aMPo2e49hMef4rrTs88WLF",
    image: "/ads/sber-300x250.jpg",
    alt: "СберЗдоровье — запись к врачу со скидкой до 50%",
    width: 300,
    height: 250,
    sponsored: true,
    erid: "2bL9aMPo2e49hMef4rrTs88WLF",
    advertiser: "СберЗдоровье (ДОКДОК)",
  },
];

export function pickDirectBanner(placement: AdPlacement, locale: Locale): DirectBanner | undefined {
  const now = Date.now();
  return DIRECT_BANNERS.find(
    (b) =>
      b.placement === placement &&
      b.locales.includes(locale) &&
      (!b.until || +new Date(b.until) >= now),
  );
}

/**
 * Домовые баннеры — кросс-промо собственных проектов.
 *
 * Пока AdSense не начал приносить показы (аккаунт на модерации), незанятые
 * плейсменты логично залить рекламой своих же сайтов. Когда `enabled: true`,
 * домовый баннер выигрывает у AdSense; как только сеть заработает —
 * поставить `enabled: false`, и всё вернётся на AdSense без других правок.
 *
 * Это не картинки, а адаптивные CSS-карточки (см. AdSlot): рисовать креативы
 * не нужно, они сами подхватывают тему и размер плейсмента.
 *
 * Ссылки помечаются rel="sponsored" и меткой «Реклама» — чтобы перелинковка
 * между своими сайтами не читалась поисковиком как ссылочная схема.
 */
export const HOUSE_ADS: { enabled: boolean; placements: AdPlacement[] } = {
  enabled: true,
  /**
   * Плейсменты, где домовым баннерам разрешено выигрывать. Остальные
   * уходят AdSense — так на время ревью Google видит собственные слоты
   * в теле статьи (in-article, article-end) и в шапке.
   * Пустой массив = все плейсменты (поведение до ревью, когда AdSense
   * ещё не показывает).
   */
  placements: ["sidebar", "in-feed"],
};

export type HouseAd = {
  id: string;
  /** Куда ведёт. UTM добавляется автоматически при рендере */
  href: string;
  emoji: string;
  /** Акцентный цвет карточки (hex) — бейдж, кнопка, рамка */
  accent: string;
  /** В каких локалях показывать */
  locales: Locale[];
  /** Ограничить плейсментами; пусто/не задано = во всех */
  placements?: AdPlacement[];
  /** Тексты по локалям */
  copy: Partial<Record<Locale, { title: string; tagline: string; cta: string }>>;
};

/**
 * Порядок важен: чем выше в списке, тем приоритетнее сайт при выборе для
 * плейсмента. calclumen ближе всех к теме здоровья — поэтому первым.
 */
export const HOUSE_ADS_INVENTORY: HouseAd[] = [
  {
    id: "calclumen",
    href: "https://calclumen.com/",
    emoji: "🔥",
    accent: "#2563eb",
    locales: ["ru", "en"],
    copy: {
      ru: {
        title: "CalcLumen",
        tagline: "Калькуляторы калорий, BMR и нормы здоровья — бесплатно",
        cta: "Посчитать",
      },
      en: {
        title: "CalcLumen",
        tagline: "Free calorie, BMR & everyday health calculators",
        cta: "Calculate",
      },
    },
  },
  {
    id: "thecryptotools",
    href: "https://thecryptotools.com/",
    emoji: "₿",
    accent: "#f7931a",
    locales: ["ru", "en"],
    copy: {
      ru: {
        title: "The Crypto Tools",
        tagline: "Бесплатные калькуляторы и инструменты для крипты",
        cta: "Открыть",
      },
      en: {
        title: "The Crypto Tools",
        tagline: "Free calculators & tools for crypto",
        cta: "Open",
      },
    },
  },
  {
    id: "iznkit",
    href: "https://iznkit.com/",
    emoji: "🧰",
    accent: "#475569",
    locales: ["ru", "en"],
    copy: {
      ru: {
        title: "iznkit",
        tagline: "21+ инструмент: счета, калькуляторы и документы в аккуратный PDF",
        cta: "Открыть",
      },
      en: {
        title: "iznkit",
        tagline: "21+ tools that turn forms into clean, branded PDFs",
        cta: "Open",
      },
    },
  },
  {
    id: "costtrek",
    href: "https://costtrek.com/",
    emoji: "🌍",
    accent: "#0d9488",
    locales: ["ru", "en"],
    copy: {
      ru: {
        title: "CostTrek",
        tagline: "Стоимость жизни в городах мира и зарплата, нужная для переезда",
        cta: "Сравнить",
      },
      en: {
        title: "CostTrek",
        tagline: "Compare the cost of living between cities and the salary you'd need",
        cta: "Compare",
      },
    },
  },
  {
    id: "izngames",
    href: "https://izngames.com/",
    emoji: "🎮",
    accent: "#7c3aed",
    locales: ["ru", "en"],
    copy: {
      ru: {
        title: "izn.games",
        tagline: "Бесплатные браузерные игры — без загрузок и регистрации",
        cta: "Играть",
      },
      en: {
        title: "izn.games",
        tagline: "Free browser games — no downloads, no sign-up",
        cta: "Play",
      },
    },
  },
  {
    id: "prodom-expert",
    href: "https://prodom-expert.ru/",
    emoji: "🏠",
    accent: "#d97706",
    locales: ["ru"],
    copy: {
      ru: {
        title: "Про Дом Эксперт",
        tagline: "Ремонт, стройка и уют — без дорогих ошибок",
        cta: "Узнать",
      },
    },
  },
];

const PLACEMENT_ORDER: AdPlacement[] = [
  "header",
  "in-feed",
  "in-article",
  "article-end",
  "sidebar",
];

/**
 * Детерминированный выбор домового баннера под плейсмент и локаль.
 * Сдвиг по индексу плейсмента разводит сайты по разным блокам одной
 * страницы: в шапке и внутри статьи не окажется один и тот же проект.
 */
export function pickHouseAd(placement: AdPlacement, locale: Locale): HouseAd | undefined {
  if (!HOUSE_ADS.enabled) return undefined;
  // Плейсмент вне allow-list отдаётся AdSense (пустой список = все разрешены)
  if (HOUSE_ADS.placements.length > 0 && !HOUSE_ADS.placements.includes(placement)) {
    return undefined;
  }
  const eligible = HOUSE_ADS_INVENTORY.filter(
    (ad) =>
      ad.locales.includes(locale) &&
      ad.copy[locale] &&
      (!ad.placements || ad.placements.includes(placement)),
  );
  if (eligible.length === 0) return undefined;
  const offset = Math.max(0, PLACEMENT_ORDER.indexOf(placement));
  return eligible[offset % eligible.length];
}
