/**
 * Расчётная часть калькулятора нормы воды.
 *
 * Главное, что нужно понимать про этот расчёт: «нормы воды» как точного
 * числа не существует. Есть рекомендуемое поступление (adequate intake) —
 * медиана того, сколько пьют здоровые люди, у которых нет признаков
 * обезвоживания. Это ориентир популяции, а не потребность организма,
 * и жажда регулирует поступление точнее любой формулы.
 *
 * Всё внутри — миллилитры и килограммы.
 */

export type Sex = "male" | "female";

/* ==========================================================================
   Базовая потребность
   ========================================================================== */

/**
 * Рекомендуемое суточное поступление воды (всего, включая воду из еды),
 * EFSA Panel on Dietetic Products, EFSA Journal, 2010.
 */
export const EFSA_TOTAL: Record<Sex, number> = {
  male: 2500,
  female: 2000,
};

/**
 * Institute of Medicine (2004) даёт заметно больше — 3700 и 2700 мл.
 * Разница не в физиологии, а в выборке: американцы пьют больше европейцев,
 * а обе цифры получены как медиана фактического потребления.
 * Расхождение полезно показать: оно и есть мера точности «нормы».
 */
export const IOM_TOTAL: Record<Sex, number> = {
  male: 3700,
  female: 2700,
};

/**
 * Расчёт от массы тела: 30–35 мл на килограмм.
 *
 * Ориентир из клинической практики (ESPEN guidelines on clinical nutrition
 * and hydration in geriatrics, 2019); с возрастом норма на килограмм
 * снижается — и потому, что падает доля воды в организме, и потому,
 * что почки хуже концентрируют мочу.
 */
export function mlPerKg(age: number): number {
  if (age < 30) return 35;
  if (age <= 55) return 33;
  return 30;
}

export function baselineWater(weight: number, age: number): number {
  return weight * mlPerKg(age);
}

/* ==========================================================================
   Надбавки
   ========================================================================== */

/**
 * Потери с потом, мл в час нагрузки.
 *
 * Диапазон у людей огромный: от 0,3 до 2,4 л/ч (Barnes et al.,
 * Sports Med, 2019). Сетка ниже — практическая середина; точное число
 * даёт только взвешивание до и после тренировки.
 */
export const SWEAT_RATES = {
  light: 400,
  moderate: 700,
  intense: 1200,
} as const;

export type Intensity = keyof typeof SWEAT_RATES;

/**
 * Климат. Жара и сухой воздух увеличивают как потоотделение,
 * так и незаметные потери через дыхание и кожу.
 */
export const CLIMATE_BONUS = {
  cool: 0,
  temperate: 0,
  hot: 500,
  veryHot: 1000,
} as const;

export type Climate = keyof typeof CLIMATE_BONUS;

/**
 * Доля воды, поступающей с едой. EFSA оценивает её в 20–30% —
 * овощи, фрукты, супы, каши. У человека, который живёт на сухих
 * продуктах и полуфабрикатах, доля ближе к нижней границе.
 */
export const FOOD_SHARE = 0.22;

/**
 * Предел усвоения: почки здорового взрослого выводят примерно
 * 0,8–1,0 л в час. Устойчивое превышение — механизм гипонатриемии,
 * от которой погибали и участники марафонов, и участники конкурсов
 * «кто больше выпьет» (Almond et al., NEJM, 2005).
 */
export const MAX_HOURLY_INTAKE = 800;

/* ==========================================================================
   Сводный расчёт
   ========================================================================== */

export type HydrationInput = {
  sex: Sex;
  /** Масса тела, кг */
  weight: number;
  /** Возраст, полных лет */
  age: number;
  /** Минут физической нагрузки в день */
  exerciseMinutes: number;
  intensity: Intensity;
  climate: Climate;
  /** Часов бодрствования — на них распределяется питьё */
  wakingHours: number;
  /** Беременность или лактация: EFSA даёт +300 и +700 мл соответственно */
  stage?: "none" | "pregnant" | "breastfeeding";
};

export type HydrationResult = {
  /** Вся вода за сутки, включая воду из еды, мл */
  total: number;
  /** Сколько из этого нужно выпить, мл */
  fromDrinks: number;
  /** Сколько приходит с едой, мл */
  fromFood: number;
  /** Разбивка надбавок для показа пользователю */
  breakdown: { id: "base" | "exercise" | "climate" | "stage"; ml: number }[];
  /** Ориентир на час бодрствования, мл */
  perHour: number;
  /** Эквивалент в стаканах по 250 мл */
  glasses: number;
  /** Норма EFSA для сравнения, мл */
  reference: number;
  /** Расчёт разошёлся с EFSA больше чем в полтора раза — повод усомниться */
  farFromReference: boolean;
  /** Разовая порция выходит за предел усвоения */
  exceedsHourlyLimit: boolean;
};

const STAGE_BONUS = { none: 0, pregnant: 300, breastfeeding: 700 } as const;

export function hydrationNeeds(input: HydrationInput): HydrationResult {
  const { sex, weight, age, exerciseMinutes, intensity, climate, wakingHours, stage = "none" } = input;

  const base = baselineWater(weight, age);
  const exercise = (Math.max(0, exerciseMinutes) / 60) * SWEAT_RATES[intensity];
  const climateBonus = CLIMATE_BONUS[climate];
  const stageBonus = sex === "female" ? STAGE_BONUS[stage] : 0;

  const total = base + exercise + climateBonus + stageBonus;
  const fromFood = total * FOOD_SHARE;
  const fromDrinks = total - fromFood;

  const hours = Math.max(1, wakingHours);
  const perHour = fromDrinks / hours;
  const reference = EFSA_TOTAL[sex];

  return {
    total,
    fromDrinks,
    fromFood,
    breakdown: [
      { id: "base", ml: base },
      { id: "exercise", ml: exercise },
      { id: "climate", ml: climateBonus },
      { id: "stage", ml: stageBonus },
    ].filter((b) => b.ml > 0) as HydrationResult["breakdown"],
    perHour,
    glasses: fromDrinks / 250,
    reference,
    farFromReference: total > reference * 1.5 || total < reference * 0.6,
    exceedsHourlyLimit: perHour > MAX_HOURLY_INTAKE,
  };
}

/* ==========================================================================
   Цвет мочи — единственный бытовой признак с доказанной связью
   ========================================================================== */

/**
 * Шкала Armstrong (Int J Sport Nutr, 1994): цвет мочи коррелирует
 * с осмоляльностью и удельным весом. Оттенки 1–3 соответствуют
 * нормальной гидратации, 4–6 — дефициту, 7–8 — выраженному
 * обезвоживанию. Утренняя порция всегда темнее — это не показатель.
 */
export const URINE_SCALE = [
  { id: 1, hex: "#f7f2c8", status: "hydrated" },
  { id: 2, hex: "#f5eba4", status: "hydrated" },
  { id: 3, hex: "#f2df7c", status: "hydrated" },
  { id: 4, hex: "#eccf55", status: "mild" },
  { id: 5, hex: "#e0b93c", status: "mild" },
  { id: 6, hex: "#cf9d2a", status: "mild" },
  { id: 7, hex: "#b87d1c", status: "dehydrated" },
  { id: 8, hex: "#9a5d15", status: "dehydrated" },
] as const;

export type UrineStatus = (typeof URINE_SCALE)[number]["status"];
