import type { Locale } from "./site";

/**
 * Spotlight — внутренний ротационный промо-слот. Раз в неделю показывает одно
 * наше промо (новый инструмент / недооценённый старый / важная статья / support),
 * чтобы продвигать собственные страницы без закупки трафика.
 *
 * Ротация детерминированная: индекс = ISO-неделя % длина пула. Так все читатели
 * в одну неделю видят одно и то же, а набор меняется сам каждую неделю без правок.
 *
 * Ручной форс: у записи можно задать `from`/`until` (YYYY-MM-DD) — пока «сегодня»
 * в этом окне, показывается именно она, минуя ротацию. Удобно подсветить запуск.
 */
export type SpotlightItem = {
  /** Уникальный id — уходит в аналитику (spotlight_click, data-track-item) */
  id: string;
  icon: string;
  /** Разные слаги в локалях, поэтому ссылка задаётся на каждую */
  href: Record<Locale, string>;
  title: Record<Locale, string>;
  blurb: Record<Locale, string>;
  cta: Record<Locale, string>;
  /** Необязательное окно ручного форса (ISO-дата YYYY-MM-DD, включительно) */
  from?: string;
  until?: string;
};

export const SPOTLIGHT: SpotlightItem[] = [
  {
    id: "phq9",
    icon: "🧠",
    href: { ru: "/ru/tools/phq-9-depression-test", en: "/en/tools/phq-9-depression-test" },
    title: { ru: "Тест на депрессию (PHQ-9)", en: "Depression Test (PHQ-9)" },
    blurb: {
      ru: "Валидированная 2-минутная самопроверка настроения. Не диагноз — ориентир.",
      en: "A validated 2-minute mood self-check. Not a diagnosis — a guide.",
    },
    cta: { ru: "Пройти", en: "Take it" },
  },
  {
    id: "gad7",
    icon: "😮‍💨",
    href: { ru: "/ru/tools/gad-7-anxiety-test", en: "/en/tools/gad-7-anxiety-test" },
    title: { ru: "Тест на тревожность (GAD-7)", en: "Anxiety Test (GAD-7)" },
    blurb: {
      ru: "Короткий опросник уровня тревоги — помогает понять, нужна ли помощь.",
      en: "A short anxiety-level questionnaire — helps you see if to seek help.",
    },
    cta: { ru: "Пройти", en: "Take it" },
  },
  {
    id: "findrisc",
    icon: "🩸",
    href: { ru: "/ru/tools/findrisc-calculator", en: "/en/tools/findrisc-calculator" },
    title: { ru: "Риск диабета (FINDRISC)", en: "Diabetes Risk (FINDRISC)" },
    blurb: {
      ru: "Оцените риск диабета 2 типа без анализов — по валидированной шкале.",
      en: "Gauge your type 2 diabetes risk with no blood test, on a validated scale.",
    },
    cta: { ru: "Рассчитать", en: "Calculate" },
  },
  {
    id: "bioage",
    icon: "⏳",
    href: {
      ru: "/ru/tools/biological-age-calculator",
      en: "/en/tools/biological-age-calculator",
    },
    title: { ru: "Калькулятор биовозраста", en: "Biological Age Calculator" },
    blurb: {
      ru: "Насколько привычки вас старят или молодят — цифра за 2 минуты.",
      en: "How much your habits age or rejuvenate you — a number in 2 minutes.",
    },
    cta: { ru: "Узнать", en: "Find out" },
  },
  {
    id: "reference",
    icon: "💊",
    href: { ru: "/ru/reference", en: "/en/reference" },
    title: { ru: "Справочник добавок", en: "Supplement Guide" },
    blurb: {
      ru: "Что доказано, а что реклама — коротко, по полкам и с источниками.",
      en: "What's proven vs marketing — short, structured and with sources.",
    },
    cta: { ru: "Открыть", en: "Open" },
    // Ручной форс: две недели раскручиваем новый раздел, минуя ротацию.
    from: "2026-10-08",
    until: "2026-10-21",
  },
  {
    id: "insulin-resistance",
    icon: "📉",
    href: { ru: "/ru/weight/insulinorezistentnost", en: "/en/weight/insulin-resistance" },
    title: { ru: "Инсулинорезистентность", en: "Insulin Resistance" },
    blurb: {
      ru: "Обратимое состояние задолго до диабета — и что с ним делать.",
      en: "A reversible state years before diabetes — and what to do about it.",
    },
    cta: { ru: "Читать", en: "Read" },
  },
  {
    id: "support",
    icon: "☕",
    href: { ru: "/ru/support", en: "/en/support" },
    title: { ru: "Поддержать проект", en: "Support the project" },
    blurb: {
      ru: "Если материалы полезны — помогите выпускать их дальше.",
      en: "If this is useful, help us keep publishing it.",
    },
    cta: { ru: "Поддержать", en: "Support" },
  },
  {
    id: "creatine",
    icon: "💪",
    href: { ru: "/ru/reference/creatine", en: "/en/reference/creatine" },
    title: { ru: "Креатин: без мифов", en: "Creatine, myth-free" },
    blurb: {
      ru: "Самая изученная добавка: что доказано, доза и почему не вредит почкам.",
      en: "The most-researched supplement: what's proven, the dose, and the kidney myth.",
    },
    cta: { ru: "Читать", en: "Read" },
  },
  {
    id: "cvd-risk",
    icon: "❤️",
    href: {
      ru: "/ru/heart/kak-snizit-serdechno-sosudistyy-risk",
      en: "/en/heart/how-to-lower-cardiovascular-risk",
    },
    title: { ru: "Как снизить риск для сердца", en: "How to lower cardiovascular risk" },
    blurb: {
      ru: "Что реально работает против инфаркта и инсульта — по доказательной базе.",
      en: "What actually works against heart attack and stroke, by the evidence.",
    },
    cta: { ru: "Читать", en: "Read" },
  },
  {
    id: "caffeine",
    icon: "☕",
    href: { ru: "/ru/tools/caffeine-calculator", en: "/en/tools/caffeine-calculator" },
    title: { ru: "Калькулятор кофеина", en: "Caffeine Calculator" },
    blurb: {
      ru: "Сколько кофеина останется ко сну и до какого часа можно пить кофе.",
      en: "How much caffeine is left at bedtime and the latest hour to drink coffee.",
    },
    cta: { ru: "Рассчитать", en: "Calculate" },
  },
];

/** ISO-номер недели (1..53) по дате */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Пн=0 … Вс=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // ближайший четверг
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const diff = d.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
}

const stripSlash = (s: string) => s.replace(/\/+$/, "");

/**
 * Выбор промо на дату. Сперва активный ручной форс (from/until), иначе —
 * детерминированная ротация по ISO-неделе по ВСЕМУ набору (from/until — только
 * временный override, элемент продолжает участвовать в ротации вне своего окна).
 *
 * `excludePath` — путь текущей страницы (с локалью, без хвостового слэша): если
 * выбранное промо ведёт ровно на неё, берём следующее, чтобы не рекламировать
 * страницу саму на себе (напр. биовозраст-калькулятор в «неделю биовозраста»).
 */
export function pickSpotlight(now: Date, excludePath?: string): SpotlightItem | null {
  if (SPOTLIGHT.length === 0) return null;
  const self = excludePath ? stripSlash(excludePath) : "";
  const matches = (s: SpotlightItem) =>
    self !== "" && (stripSlash(s.href.ru) === self || stripSlash(s.href.en) === self);

  const forced = SPOTLIGHT.find(
    (s) =>
      s.from &&
      s.until &&
      now >= new Date(`${s.from}T00:00:00`) &&
      now <= new Date(`${s.until}T23:59:59`) &&
      !matches(s),
  );
  if (forced) return forced;

  let idx = isoWeek(now) % SPOTLIGHT.length;
  if (matches(SPOTLIGHT[idx])) idx = (idx + 1) % SPOTLIGHT.length;
  return SPOTLIGHT[idx];
}
