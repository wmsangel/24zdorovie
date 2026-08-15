import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/config/site";

export function isLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value);
}

/** Путь внутри локали → полный путь. localePath("en", "/nutrition") → "/en/nutrition" */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path === "/" ? "" : path.replace(/\/$/, "");
  return `/${locale}${clean}` || `/${locale}`;
}

const DICT = {
  ru: {
    nav_home: "Главная",
    nav_all: "Все статьи",
    nav_about: "О проекте",
    nav_search: "Поиск",
    nav_tools: "Инструменты",
    tools_title: "Калькуляторы и тесты",
    tools_lede:
      "Считают по опубликованным формулам, а не по выдуманным шкалам: под каждым инструментом расписано, откуда взяты коэффициенты и чего он не умеет. Ничего не отправляется на сервер — расчёт идёт прямо в браузере.",
    tools_related: "Материалы по теме",
    tools_other: "Другие инструменты",
    tools_open: "Открыть",
    tools_privacy: "Данные не покидают ваш браузер",
    a11y_nav_main: "Основная навигация",
    a11y_nav_breadcrumb: "Хлебные крошки",
    a11y_menu: "Меню",
    a11y_theme_light: "Включить светлую тему",
    a11y_theme_dark: "Включить тёмную тему",
    search_placeholder: "Найти статью, продукт, симптом…",
    search_empty: "Ничего не нашлось. Попробуйте другой запрос.",
    search_hint: "Начните вводить запрос",
    search_results: "Найдено материалов",
    hero_kicker: "Доказательный подход",
    hero_cta: "Читать статьи",
    hero_cta_secondary: "Выбрать рубрику",
    section_latest: "Свежее",
    section_lead: "Новое на сайте",
    section_more: "Ещё материалы",
    section_featured: "Читают сейчас",
    section_categories: "Рубрики",
    rail_hint: "Листайте вбок",
    section_related: "Читайте также",
    section_popular: "Популярное",
    all_articles: "Все статьи",
    read_more: "Читать",
    min_read: "мин чтения",
    updated: "Обновлено",
    published: "Опубликовано",
    author: "Автор",
    reviewed_by: "Проверил",
    toc: "Содержание",
    tags: "Теги",
    share: "Поделиться",
    copy_link: "Скопировать ссылку",
    copied: "Скопировано",
    in_category: "В рубрике",
    articles_count: "материалов",
    newsletter_title: "Раз в неделю — одно письмо",
    newsletter_text: "Короткий разбор одного исследования и что с ним делать на практике. Без спама.",
    newsletter_placeholder: "your@email.com",
    newsletter_cta: "Подписаться",
    newsletter_done: "Готово! Проверьте почту.",
    newsletter_privacy: "Отписаться можно в один клик.",
    disclaimer_title: "Это не медицинская консультация",
    disclaimer_text:
      "Материал носит информационный характер и не заменяет консультацию врача. При симптомах и хронических состояниях обратитесь к специалисту.",
    ad_label: "Реклама",
    affiliate_note: "Ссылка партнёрская: цена для вас не меняется, мы получаем комиссию.",
    offer_title: "Что с этим делать дальше",
    offer_note_supplement:
      "БАД, не является лекарственным средством. Есть противопоказания, перед применением проконсультируйтесь со специалистом.",
    offer_note_medical:
      "Есть противопоказания. Необходима консультация специалиста — расчёт калькулятора её не заменяет.",
    offer_note_goods: "Товар подобран под результат расчёта, а не назначен вам.",
    footer_rubrics: "Рубрики",
    footer_project: "Проект",
    footer_legal: "Документы",
    footer_rights: "Все права защищены",
    not_found_title: "Страница не найдена",
    not_found_text: "Возможно, материал переехал. Загляните в рубрики или воспользуйтесь поиском.",
    back_home: "На главную",
    breadcrumb_home: "Главная",
    lang_switch: "English",
    recipe_time: "Время",
    recipe_servings: "Порций",
    recipe_kcal: "ккал / порция",
    faq_title: "Частые вопросы",
    sources_title: "Источники",
    prev_article: "Предыдущая",
    next_article: "Следующая",
    pagination_label: "Постраничная навигация",
    pagination_prev: "Назад",
    pagination_next: "Дальше",
    pagination_page: "Страница",
    pagination_of: "из",
    empty_category: "Здесь скоро появятся материалы.",
  },
  en: {
    nav_home: "Home",
    nav_all: "All articles",
    nav_about: "About",
    nav_search: "Search",
    nav_tools: "Tools",
    tools_title: "Calculators & tests",
    tools_lede:
      "Built on published formulas rather than invented scales: every tool spells out where its coefficients come from and what it cannot tell you. Nothing is sent to a server — the maths runs in your browser.",
    tools_related: "Related reading",
    tools_other: "More tools",
    tools_open: "Open",
    tools_privacy: "Your data never leaves your browser",
    a11y_nav_main: "Main navigation",
    a11y_nav_breadcrumb: "Breadcrumb",
    a11y_menu: "Menu",
    a11y_theme_light: "Switch to light theme",
    a11y_theme_dark: "Switch to dark theme",
    search_placeholder: "Search articles, foods, symptoms…",
    search_empty: "Nothing found. Try a different query.",
    search_hint: "Start typing to search",
    search_results: "Results",
    hero_kicker: "Evidence-based",
    hero_cta: "Read articles",
    hero_cta_secondary: "Browse topics",
    section_latest: "Latest",
    section_lead: "Just published",
    section_more: "More reading",
    section_featured: "Trending now",
    section_categories: "Topics",
    rail_hint: "Scroll sideways",
    section_related: "Read next",
    section_popular: "Popular",
    all_articles: "All articles",
    read_more: "Read",
    min_read: "min read",
    updated: "Updated",
    published: "Published",
    author: "Author",
    reviewed_by: "Reviewed by",
    toc: "Contents",
    tags: "Tags",
    share: "Share",
    copy_link: "Copy link",
    copied: "Copied",
    in_category: "In",
    articles_count: "articles",
    newsletter_title: "One email a week",
    newsletter_text: "One study broken down, plus what to actually do about it. No spam.",
    newsletter_placeholder: "your@email.com",
    newsletter_cta: "Subscribe",
    newsletter_done: "Done! Check your inbox.",
    newsletter_privacy: "Unsubscribe in one click.",
    disclaimer_title: "This is not medical advice",
    disclaimer_text:
      "This article is for information only and does not replace a consultation with a physician. See a professional for symptoms or chronic conditions.",
    ad_label: "Advertisement",
    affiliate_note: "Affiliate link: your price stays the same, we earn a commission.",
    offer_title: "What to do with this",
    offer_note_supplement:
      "A dietary supplement, not a medicine. Check with a clinician before taking it.",
    offer_note_medical:
      "Not medical advice. A calculator result does not replace a consultation.",
    offer_note_goods: "Picked to match your result — this is not a prescription.",
    footer_rubrics: "Topics",
    footer_project: "Project",
    footer_legal: "Legal",
    footer_rights: "All rights reserved",
    not_found_title: "Page not found",
    not_found_text: "This page may have moved. Try the topics or use search.",
    back_home: "Back home",
    breadcrumb_home: "Home",
    lang_switch: "Русский",
    recipe_time: "Time",
    recipe_servings: "Servings",
    recipe_kcal: "kcal / serving",
    faq_title: "FAQ",
    sources_title: "References",
    prev_article: "Previous",
    next_article: "Next",
    pagination_label: "Pagination",
    pagination_prev: "Back",
    pagination_next: "Next",
    pagination_page: "Page",
    pagination_of: "of",
    empty_category: "Articles are coming soon.",
  },
} as const;

export type TranslationKey = keyof (typeof DICT)["ru"];

export function t(locale: Locale, key: TranslationKey): string {
  return DICT[locale]?.[key] ?? DICT[DEFAULT_LOCALE][key];
}

/** Готовый переводчик, привязанный к локали: const tr = translator(locale); tr("nav_home") */
export function translator(locale: Locale) {
  return (key: TranslationKey) => t(locale, key);
}

export function formatDate(date: string, locale: Locale): string {
  return new Date(date).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Русская плюрализация: plural(3, ["материал","материала","материалов"]) */
export function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
