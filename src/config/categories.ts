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
  /**
   * Развёрнутое вступление-хаб для страницы рубрики. Делает её пиллар-страницей
   * под головной запрос: даёт странице собственный текст (а не только список
   * карточек) и очерчивает подтемы кластера.
   */
  intro: Record<Locale, string>;
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
    intro: {
      ru: "Питание влияет на самочувствие сильнее любой добавки, но вокруг него больше всего мифов. Здесь мы разбираем, как устроены белки, жиры и углеводы, сколько чего нужно на самом деле и как собрать рабочий рацион без запретных списков и детоксов. Каждый материал опирается на исследования, а не на моду.",
      en: "Nutrition shapes how you feel more than any supplement, yet it carries the most myths. Here we break down how protein, fat and carbs work, how much you actually need, and how to build a working diet without banned-food lists or detoxes — every piece grounded in research, not trends.",
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
    intro: {
      ru: "Здесь простые блюда с честно посчитанной пищевой ценностью — то, что реально готовят вечером буднего дня. Каждый рецепт указывает калории и БЖУ, время и число порций, чтобы его можно было вписать в свою норму, а не гадать на глаз.",
      en: "Simple dishes with honestly calculated nutrition — the kind you actually cook on a weeknight. Every recipe lists calories and macros, time and servings, so it fits your targets instead of leaving you to guess.",
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
    intro: {
      ru: "Движение — самый недооценённый инструмент здоровья, и работает оно по понятным правилам. В рубрике собраны силовые и кардио, мобильность и восстановление: как строить прогрессию нагрузки, считать пульсовые зоны, тренироваться дома и не выгорать. Техника и программы — для любого уровня, без гуру и чудо-методик.",
      en: "Movement is the most underrated health tool, and it works by clear rules. This section covers strength and cardio, mobility and recovery: how to build progressive overload, use heart-rate zones, train at home and avoid burnout — technique and programming for every level, no gurus.",
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
    intro: {
      ru: "Сон чинит то, что не под силу ни одной добавке, но и здесь хватает маркетинга. Разбираем циркадные ритмы, гигиену сна, фазы и циклы, джетлаг и влияние экранов и кофеина — что действительно улучшает сон, а что лишь продаётся под видом улучшения.",
      en: "Sleep repairs what no supplement can, yet it too is full of marketing. We cover circadian rhythms, sleep hygiene, stages and cycles, jet lag and the effect of screens and caffeine — what genuinely improves sleep and what is merely sold as such.",
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
    intro: {
      ru: "Психика — часть здоровья, а не отдельная тема «для слабых». Здесь доказательные разборы стресса, тревоги, выгорания, панических атак и внимания: техники саморегуляции, основы КПТ и понятные ориентиры, когда самопомощи мало и пора к специалисту.",
      en: "Mental health is part of health, not a separate topic 'for the weak.' Here are evidence-based looks at stress, anxiety, burnout, panic attacks and focus: self-regulation techniques, CBT basics and clear signs of when self-help is not enough and it is time to see a professional.",
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
    intro: {
      ru: "Индустрия добавок обещает многое, а доказанного мало. В рубрике каждый популярный БАД проверяется по исследованиям: что реально работает, в каких дозах и формах, кому противопоказано и где деньги уходят впустую. Витамин D, магний, омега-3, креатин, куркумин и другие — без хайпа.",
      en: "The supplement industry promises a lot and proves little. Here each popular supplement is checked against the research: what actually works, at what dose and form, who should avoid it and where money is wasted — vitamin D, magnesium, omega-3, creatine, curcumin and more, without the hype.",
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
    intro: {
      ru: "Похудение — это не марафон запретов, а понятная физиология. Разбираем дефицит калорий, роль гормонов, плато и висцеральный жир, безопасный темп снижения веса и устойчивые привычки — как менять вес без крайностей и вреда для метаболизма.",
      en: "Weight change is not a marathon of bans but understandable physiology. We cover the calorie deficit, the role of hormones, plateaus and visceral fat, a safe rate of loss and sustainable habits — how to change weight without extremes or wrecking your metabolism.",
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
    intro: {
      ru: "Долголетие — это не таблетка, а сумма скучных, но работающих привычек и вовремя пойманных проблем. Здесь профилактика и чекапы по возрастам, биомаркеры и биологический возраст, трезвый разбор модных anti-age тем — что действительно влияет на продолжительность здоровой жизни, а что просто продают.",
      en: "Longevity is not a pill but the sum of dull-but-effective habits and problems caught in time. Here are prevention and age-based check-ups, biomarkers and biological age, and a sober look at trendy anti-aging topics — what genuinely extends healthy lifespan and what is merely sold.",
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
    intro: {
      ru: "Сердечно-сосудистые болезни — причина №1 смертности, и большую часть риска можно снизить заранее. В рубрике — как читать давление и холестерин, что значат ЛПНП, триглицериды и пульс, и какие привычки реально берегут сосуды. Без паники и без «чистки сосудов».",
      en: "Cardiovascular disease is the number-one cause of death, and much of the risk can be lowered in advance. This section explains how to read blood pressure and cholesterol, what LDL, triglycerides and heart rate mean, and which habits genuinely protect your vessels — no panic, no 'artery cleansing.'",
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
    intro: {
      ru: "Кишечник влияет на пищеварение, иммунитет и самочувствие, и вокруг него много мифов. Разбираем микробиом, клетчатку, вздутие и запоры, пробиотики и ферментированные продукты — что реально помогает кишечнику, а что лишь маркетинг «детокса».",
      en: "The gut affects digestion, immunity and how you feel, and it is surrounded by myths. We cover the microbiome, fibre, bloating and constipation, probiotics and fermented foods — what genuinely helps the gut and what is just 'detox' marketing.",
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
    intro: {
      ru: "Женская физиология влияет на питание, тренировки и самочувствие сильнее, чем принято обсуждать. В рубрике — цикл и гормоны, ПМС и контрацепция, СПКЯ, менопауза, эндометриоз и типичные дефициты: как всё это устроено и что с этим делать по доказательной медицине.",
      en: "Female physiology shapes nutrition, training and wellbeing more than is usually discussed. This section covers the cycle and hormones, PMS and contraception, PCOS, menopause, endometriosis and common deficiencies — how they work and what to do about them, by the evidence.",
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
    intro: {
      ru: "«Укрепить иммунитет» обещают на каждом углу, но работает скучная база, а не чудо-стимуляторы. Разбираем, что действительно поддерживает защиту организма — сон, питание, движение, вакцинацию — и почему большинство «иммуномодуляторов» и ударных доз витаминов бесполезны.",
      en: "'Boosting immunity' is promised everywhere, but it is the dull basics that work, not miracle stimulants. We cover what genuinely supports your defences — sleep, nutrition, movement, vaccination — and why most immune modulators and megadoses of vitamins do nothing.",
    },
  },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
