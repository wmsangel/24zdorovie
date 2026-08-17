import type { Locale } from "./site";

/**
 * Интерактивные инструменты: калькуляторы и самопроверки.
 *
 * Реестр задаёт только оболочку — URL, оформление и перелинковку.
 * Текст вокруг виджета живёт в content/tools/{locale}/{slug}.mdx,
 * сам виджет — в src/components/tools и подключается по slug
 * в src/components/tools/registry.tsx.
 *
 * Добавление инструмента = запись здесь + две MDX-страницы + компонент.
 * Маршрут, sitemap, hreflang и schema.org подхватятся сами.
 */
export type Tool = {
  /** Слаг в URL: /{locale}/tools/{slug} — менять после публикации нельзя */
  slug: string;
  emoji: string;
  /**
   * Рубрика, к которой инструмент относится тематически.
   * Определяет акцентный цвет, OG-картинку и блок «читайте также».
   */
  category: string;
  name: Record<Locale, string>;
  /** Одна строка под заголовком в листинге */
  tagline: Record<Locale, string>;
  /** Статьи-компаньоны: пути без префикса локали, в порядке важности */
  related: Record<Locale, string[]>;
};

export const TOOLS: Tool[] = [
  {
    slug: "caffeine-calculator",
    emoji: "☕",
    category: "sleep",
    name: {
      ru: "Калькулятор кофеина",
      en: "Caffeine Calculator",
    },
    tagline: {
      ru: "Сколько кофеина останется в крови к моменту отбоя и до какого часа можно пить кофе",
      en: "How much caffeine is left in your body at bedtime, and the latest hour you can drink it",
    },
    related: {
      ru: ["/sleep/kofein-i-son", "/sleep/gigiena-sna", "/sleep/bessonnitsa-chto-delat"],
      en: ["/sleep/caffeine-and-sleep", "/sleep/sleep-hygiene-basics", "/sleep/insomnia-what-to-do"],
    },
  },
  {
    slug: "calorie-macro-calculator",
    emoji: "🥗",
    category: "weight",
    name: {
      ru: "Калькулятор калорий и БЖУ",
      en: "Calorie & Macro Calculator",
    },
    tagline: {
      ru: "Норма калорий по Mifflin-St Jeor и распределение белков, жиров и углеводов под вашу цель и темп",
      en: "Your calorie target from Mifflin-St Jeor, split into protein, fat and carbs for your goal and pace",
    },
    related: {
      ru: [
        "/weight/deficit-kaloriy-kak-schitat",
        "/nutrition/skolko-belka-v-den",
        "/weight/imt-i-sostav-tela",
      ],
      en: [
        "/weight/calorie-deficit-explained",
        "/nutrition/how-much-protein-per-day",
        "/weight/bmi-and-body-composition",
      ],
    },
  },
  {
    slug: "biological-age-calculator",
    emoji: "🧬",
    category: "longevity",
    name: {
      ru: "Калькулятор биологического возраста",
      en: "Biological Age Calculator",
    },
    tagline: {
      ru: "PhenoAge по девяти показателям крови — формула, валидированная по смертности, без покупки теста",
      en: "PhenoAge from nine standard blood markers — a mortality-validated formula, no test kit required",
    },
    related: {
      ru: [
        "/longevity/biologicheskiy-vozrast",
        "/longevity/chasy-horvata",
        "/longevity/chekap-po-vozrastam",
      ],
      en: [
        "/longevity/biological-age-tests",
        "/longevity/horvath-clock",
        "/longevity/health-checkups-by-age",
      ],
    },
  },
  {
    slug: "burnout-test",
    emoji: "🔥",
    category: "mental-health",
    name: {
      ru: "Тест на выгорание",
      en: "Burnout Self-Check",
    },
    tagline: {
      ru: "15 вопросов по трём измерениям выгорания: истощение, цинизм и потеря профессиональной эффективности",
      en: "15 questions across the three dimensions of burnout: exhaustion, cynicism and reduced efficacy",
    },
    related: {
      ru: [
        "/mental-health/vygoranie-priznaki",
        "/mental-health/vygoranie-i-dsm-5",
        "/mental-health/kak-spravlyatsya-so-stressom",
      ],
      en: [
        "/mental-health/burnout-signs-recovery",
        "/mental-health/burnout-dsm-5",
        "/mental-health/how-to-manage-stress",
      ],
    },
  },
  {
    slug: "bmi-calculator",
    emoji: "⚖️",
    category: "weight",
    name: {
      ru: "Калькулятор ИМТ и состава тела",
      en: "BMI & Body Composition Calculator",
    },
    tagline: {
      ru: "ИМТ, окружность талии, отношение талии к росту и доля жира по обхватам — четыре показателя вместо одного",
      en: "BMI, waist, waist-to-height ratio and body fat from a tape measure — four numbers instead of one",
    },
    related: {
      ru: [
        "/weight/imt-i-sostav-tela",
        "/weight/vistseralnyy-zhir",
        "/weight/deficit-kaloriy-kak-schitat",
      ],
      en: [
        "/weight/bmi-and-body-composition",
        "/weight/visceral-fat",
        "/weight/calorie-deficit-explained",
      ],
    },
  },
  {
    slug: "heart-rate-zones-calculator",
    emoji: "💓",
    category: "fitness",
    name: {
      ru: "Калькулятор пульсовых зон",
      en: "Heart Rate Zones Calculator",
    },
    tagline: {
      ru: "Пять зон по резерву пульса (Карвонен) с поправкой на пульс покоя — и разбивка недельного объёма по ним",
      en: "Five zones from your heart rate reserve (Karvonen), adjusted for resting pulse — plus how to split the week",
    },
    related: {
      ru: ["/fitness/pulsovye-zony-kardio", "/fitness/zona-2-trenirovki", "/heart/puls-pokoya"],
      en: ["/fitness/heart-rate-training-zones", "/fitness/zone-2-training", "/heart/resting-heart-rate"],
    },
  },
  {
    slug: "water-intake-calculator",
    emoji: "💧",
    category: "nutrition",
    name: {
      ru: "Калькулятор нормы воды",
      en: "Water Intake Calculator",
    },
    tagline: {
      ru: "Сколько пить с поправкой на вес, тренировку и жару — рядом с официальной нормой EFSA и честной мерой её точности",
      en: "How much to drink given your weight, training and the heat — next to the EFSA reference and how precise it really is",
    },
    related: {
      ru: [
        "/nutrition/skolko-vody-pit-v-den",
        "/nutrition/elektrolity-kogda-nuzhny",
        "/nutrition/sol-skolko-v-den",
      ],
      en: [
        "/nutrition/how-much-water-per-day",
        "/nutrition/electrolytes-when-you-need-them",
        "/nutrition/salt-how-much-per-day",
      ],
    },
  },
  {
    slug: "vitamin-d-calculator",
    emoji: "☀️",
    category: "supplements",
    name: {
      ru: "Калькулятор витамина D",
      en: "Vitamin D Calculator",
    },
    tagline: {
      ru: "Доза по массе тела и анализу 25(OH)D: профилактика, схема выхода из дефицита и прогноз уровня через три месяца",
      en: "A dose from your body mass and 25(OH)D result: prevention, a way out of deficiency, and where your level lands in three months",
    },
    related: {
      ru: [
        "/supplements/vitamin-d-normy-i-dozirovki",
        "/nutrition/kalciy-normy-i-istochniki",
        "/longevity/chekap-po-vozrastam",
      ],
      en: [
        "/supplements/vitamin-d-dosage",
        "/nutrition/calcium-daily-needs",
        "/longevity/health-checkups-by-age",
      ],
    },
  },
  {
    slug: "ovulation-calculator",
    emoji: "🌸",
    category: "womens-health",
    name: {
      ru: "Калькулятор овуляции и цикла",
      en: "Ovulation & Cycle Calculator",
    },
    tagline: {
      ru: "Фертильное окно, дата овуляции и прогноз ближайших циклов — с честной шириной погрешности вместо одной уверенной даты",
      en: "Your fertile window, ovulation date and the cycles ahead — with the real margin of error instead of one confident date",
    },
    related: {
      ru: [
        "/womens-health/tsikl-i-trenirovki",
        "/womens-health/pms-chto-pomogaet",
        "/womens-health/spkya-priznaki-i-lechenie",
      ],
      en: [
        "/womens-health/menstrual-cycle-training",
        "/womens-health/pms-what-helps",
        "/womens-health/pcos-explained",
      ],
    },
  },
  {
    slug: "cold-flu-covid-checker",
    emoji: "🤒",
    category: "immunity",
    name: {
      ru: "Простуда, грипп или COVID: сравнение симптомов",
      en: "Cold, Flu or COVID: Symptom Comparison",
    },
    tagline: {
      ru: "На какой паттерн больше похоже — и почему грипп и COVID по симптомам не различить без теста. С отдельным блоком тревожных признаков",
      en: "Which pattern your symptoms fit — and why flu and COVID need a test to tell apart. With a separate list of warning signs",
    },
    related: {
      ru: [
        "/immunity/chastye-prostudy-u-vzroslyh",
        "/immunity/kak-ukrepit-immunitet",
        "/immunity/vitamin-c-i-prostuda",
      ],
      en: [
        "/immunity/frequent-colds-in-adults",
        "/immunity/how-to-boost-immunity",
        "/immunity/vitamin-c-and-colds",
      ],
    },
  },
  {
    slug: "cvd-risk-calculator",
    emoji: "❤️",
    category: "heart",
    name: {
      ru: "Калькулятор риска инфаркта и инсульта",
      en: "Heart Attack & Stroke Risk Calculator",
    },
    tagline: {
      ru: "10-летний риск ССЗ по SCORE2 (2021) с калибровкой под регион — для России это «очень высокий» риск по классификации ESC",
      en: "Your 10-year cardiovascular risk from SCORE2 (2021), calibrated to your region — the current European standard",
    },
    related: {
      ru: [
        "/heart/holesterin-lpnp-lpvp",
        "/heart/arterialnoe-davlenie-normy",
        "/heart/insult-priznaki-i-profilaktika",
      ],
      en: [
        "/heart/cholesterol-explained",
        "/heart/blood-pressure-explained",
        "/heart/stroke-warning-signs",
      ],
    },
  },
  {
    slug: "fiber-calculator",
    emoji: "🌾",
    category: "gut",
    name: {
      ru: "Калькулятор клетчатки",
      en: "Fiber Intake Calculator",
    },
    tagline: {
      ru: "Норма клетчатки по полу, возрасту и калорийности — с разрывом до того, сколько её съедают на деле, и чем этот разрыв закрыть",
      en: "Your fiber target by sex, age and calories — plus the gap to what people actually eat and how to close it",
    },
    related: {
      ru: [
        "/nutrition/kletchatka-skolko-nuzhno",
        "/gut/mikrobiom-kishechnika",
        "/gut/zapor-chto-delat",
      ],
      en: [
        "/nutrition/fiber-how-much-you-need",
        "/gut/gut-microbiome-basics",
        "/gut/constipation-what-to-do",
      ],
    },
  },
  {
    slug: "protein-calculator",
    emoji: "🍗",
    category: "nutrition",
    name: {
      ru: "Калькулятор белка в день",
      en: "Daily Protein Calculator",
    },
    tagline: {
      ru: "Норма белка как диапазон г/кг под вашу активность и цель — с разбивкой по приёмам, а не одна цифра из ниоткуда",
      en: "Your protein target as a g/kg range for your activity and goal — split across meals, not one number from nowhere",
    },
    related: {
      ru: [
        "/nutrition/skolko-belka-v-den",
        "/weight/deficit-kaloriy-kak-schitat",
        "/fitness/skolko-raz-v-nedelyu-trenirovatsya",
      ],
      en: [
        "/nutrition/how-much-protein-per-day",
        "/weight/calorie-deficit-explained",
        "/fitness/training-frequency",
      ],
    },
  },
  {
    slug: "sleep-calculator",
    emoji: "🌙",
    category: "sleep",
    name: {
      ru: "Калькулятор сна",
      en: "Sleep Calculator",
    },
    tagline: {
      ru: "Во сколько ложиться и вставать по циклам сна — с окном погрешности, которое обычно скрывают",
      en: "When to go to bed and wake up by sleep cycles — with the margin of error most calculators hide",
    },
    related: {
      ru: ["/sleep/fazy-i-tsikly-sna", "/sleep/skolko-nuzhno-spat", "/sleep/gigiena-sna"],
      en: [
        "/sleep/sleep-cycles-and-stages",
        "/sleep/how-much-sleep-do-you-need",
        "/sleep/sleep-hygiene-basics",
      ],
    },
  },
];

export const TOOL_SLUGS = TOOLS.map((t) => t.slug);

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}