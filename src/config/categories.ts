import type { Locale } from "./site";

export type Category = {
  /** Слаг — общий для обеих локалей, участвует в URL */
  slug: string;
  /** Accent-токен из design system: определяет цвет карточек и бейджей */
  accent: "leaf" | "citrus" | "berry" | "ocean" | "clay" | "lavender" | "amber" | "moss";
  emoji: string;
  name: Record<Locale, string>;
  /** Короткое описание для листинга и meta description рубрики */
  description: Record<Locale, string>;
};

export const CATEGORIES: Category[] = [
  {
    slug: "nutrition",
    accent: "leaf",
    emoji: "🥗",
    name: { ru: "Питание", en: "Nutrition" },
    description: {
      ru: "Как устроена еда: белки, жиры, углеводы, микронутриенты и рабочие принципы рациона без диетических крайностей.",
      en: "How food actually works: macros, micronutrients and practical eating principles without diet extremes.",
    },
  },
  {
    slug: "recipes",
    accent: "citrus",
    emoji: "🍋",
    name: { ru: "Рецепты", en: "Recipes" },
    description: {
      ru: "Простые блюда с подсчитанной пищевой ценностью — то, что реально готовят в будний вечер.",
      en: "Simple dishes with calculated nutrition facts — the kind you actually cook on a weeknight.",
    },
  },
  {
    slug: "fitness",
    accent: "ocean",
    emoji: "🏃",
    name: { ru: "Фитнес и движение", en: "Fitness & Movement" },
    description: {
      ru: "Силовые, кардио, мобильность и восстановление: программы и техника для любого уровня подготовки.",
      en: "Strength, cardio, mobility and recovery: programming and technique for every level.",
    },
  },
  {
    slug: "sleep",
    accent: "lavender",
    emoji: "🌙",
    name: { ru: "Сон и восстановление", en: "Sleep & Recovery" },
    description: {
      ru: "Циркадные ритмы, гигиена сна и восстановление нервной системы — что работает, а что маркетинг.",
      en: "Circadian rhythms, sleep hygiene and nervous-system recovery — what works and what is marketing.",
    },
  },
  {
    slug: "mental-health",
    accent: "berry",
    emoji: "🧠",
    name: { ru: "Ментальное здоровье", en: "Mental Health" },
    description: {
      ru: "Стресс, тревога, выгорание и внимание: доказательные техники саморегуляции и когда идти к специалисту.",
      en: "Stress, anxiety, burnout and focus: evidence-based self-regulation and when to seek help.",
    },
  },
  {
    slug: "supplements",
    accent: "amber",
    emoji: "💊",
    name: { ru: "Витамины и БАДы", en: "Supplements" },
    description: {
      ru: "Разбор добавок по доказательной базе: что имеет смысл, в каких дозах и кому противопоказано.",
      en: "Supplements reviewed against the evidence: what is worth it, at what dose and who should avoid it.",
    },
  },
  {
    slug: "weight",
    accent: "clay",
    emoji: "⚖️",
    name: { ru: "Вес и метаболизм", en: "Weight & Metabolism" },
    description: {
      ru: "Дефицит калорий, гормоны, плато и устойчивые привычки вместо очередного марафона похудения.",
      en: "Calorie deficit, hormones, plateaus and sustainable habits instead of another crash diet.",
    },
  },
  {
    slug: "longevity",
    accent: "moss",
    emoji: "🌱",
    name: { ru: "Долголетие", en: "Longevity" },
    description: {
      ru: "Профилактика, чекапы, биомаркеры и привычки, которые реально влияют на продолжительность здоровой жизни.",
      en: "Prevention, check-ups, biomarkers and the habits that genuinely extend healthy lifespan.",
    },
  },
  {
    slug: "heart",
    accent: "berry",
    emoji: "❤️",
    name: { ru: "Здоровье сердца", en: "Heart Health" },
    description: {
      ru: "Давление, холестерин, пульс и сосуды: как читать свои цифры и снижать сердечно-сосудистый риск без паники.",
      en: "Blood pressure, cholesterol, heart rate and vessels: how to read your numbers and cut cardiovascular risk.",
    },
  },
  {
    slug: "gut",
    accent: "moss",
    emoji: "🦠",
    name: { ru: "Здоровье кишечника", en: "Gut Health" },
    description: {
      ru: "Микробиом, пищеварение, вздутие и ферментированные продукты: что реально влияет на кишечник, а что маркетинг.",
      en: "Microbiome, digestion, bloating and fermented foods: what genuinely affects the gut and what is hype.",
    },
  },
  {
    slug: "womens-health",
    accent: "lavender",
    emoji: "🌸",
    name: { ru: "Женское здоровье", en: "Women's Health" },
    description: {
      ru: "Цикл, гормоны, менопауза и дефициты: как физиология женщины влияет на питание, тренировки и самочувствие.",
      en: "Cycle, hormones, menopause and deficiencies: how female physiology shapes nutrition, training and wellbeing.",
    },
  },
  {
    slug: "immunity",
    accent: "amber",
    emoji: "🛡️",
    name: { ru: "Иммунитет", en: "Immunity" },
    description: {
      ru: "Что действительно поддерживает иммунитет — сон, питание, движение — и почему большинство «иммуностимуляторов» не работают.",
      en: "What actually supports immunity — sleep, nutrition, movement — and why most immune boosters do nothing.",
    },
  },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
