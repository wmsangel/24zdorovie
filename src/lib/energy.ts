/**
 * Расчётная часть калькулятора калорий и БЖУ.
 *
 * Вынесена из компонента по тем же соображениям, что и biological-age.ts:
 * каждое число здесь должно быть проверяемо без чтения разметки.
 *
 * Всё внутри — метрическая система: килограммы, сантиметры, годы.
 * Перевод из фунтов и футов делает компонент, формулы о нём не знают.
 */

export type Sex = "male" | "female";

/* ==========================================================================
   Основной обмен
   ========================================================================== */

export type BmrInput = {
  sex: Sex;
  /** Масса тела, кг */
  weight: number;
  /** Рост, см */
  height: number;
  /** Возраст, полных лет */
  age: number;
  /** Доля жира в теле, % — необязательно; включает более точную формулу */
  bodyFat?: number | null;
};

/**
 * Mifflin-St Jeor, Am J Clin Nutr 1990.
 *
 * Выбрана как основная, потому что при сравнении на здоровых взрослых
 * попадает в ±10% от измеренного непрямой калориметрией чаще остальных
 * (Frankenfield et al., J Am Diet Assoc 2005). Harris-Benedict, который
 * до сих пор стоит в большинстве калькуляторов, систематически завышает
 * результат примерно на 5%: он выведен в 1919 году на выборке, чей состав
 * тела не похож на современный.
 */
export function mifflinStJeor({ sex, weight, height, age }: BmrInput): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

/**
 * Katch-McArdle: считает от сухой массы и потому не спрашивает пол —
 * различие между мужчинами и женщинами в основном и есть различие
 * в доле жира. Точнее Mifflin, но только если процент жира измерен,
 * а не назван на глаз: ошибка в 5 процентных пунктов сдвигает результат
 * примерно на 80 ккал.
 */
export function katchMcArdle(weight: number, bodyFat: number): number {
  const leanMass = weight * (1 - bodyFat / 100);
  return 370 + 21.6 * leanMass;
}

/** Katch-McArdle, если известен процент жира; иначе Mifflin-St Jeor */
export function basalRate(input: BmrInput): { value: number; formula: "katch" | "mifflin" } {
  const { bodyFat, weight } = input;
  if (bodyFat != null && bodyFat >= 3 && bodyFat <= 60) {
    return { value: katchMcArdle(weight, bodyFat), formula: "katch" };
  }
  return { value: mifflinStJeor(input), formula: "mifflin" };
}

/* ==========================================================================
   Суточный расход
   ========================================================================== */

/**
 * Коэффициенты физической активности (PAL). Диапазон 1,4–2,4 у FAO/WHO/UNU
 * (Human energy requirements, 2004); приведённая сетка — принятая
 * практическая интерполяция внутри него.
 *
 * Это самый неточный вход во всём расчёте. Люди систематически
 * переоценивают свою активность, и разница между «умеренно» и «высоко» —
 * около 300 ккал в день, то есть больше любого эффекта от подбора БЖУ.
 * Если сомневаетесь между двумя уровнями, берите нижний.
 */
export const ACTIVITY_LEVELS = [
  { id: "sedentary", pal: 1.2 },
  { id: "light", pal: 1.375 },
  { id: "moderate", pal: 1.55 },
  { id: "high", pal: 1.725 },
  { id: "athlete", pal: 1.9 },
] as const;

export type ActivityId = (typeof ACTIVITY_LEVELS)[number]["id"];

export function palOf(id: ActivityId): number {
  return ACTIVITY_LEVELS.find((a) => a.id === id)?.pal ?? 1.375;
}

/* ==========================================================================
   Цель и темп
   ========================================================================== */

export type Goal = "lose" | "maintain" | "gain";

/**
 * Энергия, запасённая в килограмме жировой ткани, ккал.
 *
 * Число Wishnofsky (1958). Известно, что на длинной дистанции оно
 * переоценивает потерю: расход падает вслед за массой, и линейный прогноз
 * расходится с реальностью через несколько месяцев. Для выбора суточного
 * дефицита приближение рабочее, для прогноза сроков — оптимистичное,
 * поэтому прогноз в интерфейсе подаётся как нижняя граница.
 */
const KCAL_PER_KG = 7700;

/**
 * Безопасный темп — доля массы тела в неделю.
 *
 * Верхняя граница похудения 1%/нед: выше начинают заметно теряться
 * сухая масса и, у женщин, менструальная функция (Garthe et al., 2011).
 * Верхняя граница набора 0,5%/нед: быстрее прибавка идёт в основном жиром
 * (Garthe et al., Int J Sport Nutr Exerc Metab 2013).
 */
export const RATE_LIMITS = {
  lose: { min: 0.25, max: 1.0, default: 0.5 },
  gain: { min: 0.125, max: 0.5, default: 0.25 },
} as const;

/**
 * Целевая калорийность и то, чем за неё пришлось заплатить.
 *
 * `floored` означает, что расчётный дефицит упёрся в основной обмен
 * и был урезан: устойчиво есть меньше, чем тратит тело в покое, — это
 * уже не дефицит, а недоедание, и первым уходит не жир.
 */
export function targetCalories(args: {
  tdee: number;
  bmr: number;
  goal: Goal;
  /** Темп в % массы тела за неделю */
  ratePercent: number;
  weight: number;
}): { target: number; delta: number; floored: boolean; kgPerWeek: number } {
  const { tdee, bmr, goal, ratePercent, weight } = args;

  if (goal === "maintain") {
    return { target: tdee, delta: 0, floored: false, kgPerWeek: 0 };
  }

  const kgPerWeek = (weight * ratePercent) / 100;
  const daily = (kgPerWeek * KCAL_PER_KG) / 7;
  const signed = goal === "lose" ? -daily : daily;

  const raw = tdee + signed;
  const floor = Math.round(bmr);
  const floored = goal === "lose" && raw < floor;
  const target = floored ? floor : raw;

  return {
    target,
    delta: target - tdee,
    floored,
    // Достижимый темп после упора в пол может быть меньше запрошенного
    kgPerWeek: goal === "lose" ? (Math.abs(target - tdee) * 7) / KCAL_PER_KG : kgPerWeek,
  };
}

/* ==========================================================================
   Белки, жиры, углеводы
   ========================================================================== */

export type Macros = {
  protein: { grams: number; kcal: number; share: number; perKg: number };
  fat: { grams: number; kcal: number; share: number; perKg: number };
  carbs: { grams: number; kcal: number; share: number; perKg: number };
  fiber: number;
  /** true, если углеводов не осталось и пропорции пришлось пересобрать */
  squeezed: boolean;
};

/**
 * Норма белка, г на кг массы тела.
 *
 * Поддержание — 1,6 г/кг: метаанализ Morton и соавт. (Br J Sports Med, 2018)
 * показал, что прирост мышечной массы выходит на плато около 1,62 г/кг.
 * Дефицит — 2,0 г/кг: на дефиците потребность выше, потому что белок
 * защищает сухую массу и лучше насыщает (Helms et al., 2014, дают
 * 2,3–3,1 г/кг сухой массы, что для типичного состава тела и есть ≈2 г/кг).
 * Набор — 1,8 г/кг: больше не даёт прироста, но занимает место в рационе.
 */
const PROTEIN_PER_KG: Record<Goal, number> = {
  lose: 2.0,
  maintain: 1.6,
  gain: 1.8,
};

/**
 * Масса, от которой считается белок.
 *
 * При выраженном ожирении считать 2 г/кг от фактического веса бессмысленно:
 * жировая ткань в белке не нуждается, а цифра выходит невыполнимой.
 * Стандартный приём — брать вес, соответствующий ИМТ 25 при этом росте.
 */
export function referenceWeight(weight: number, height: number): number {
  const capped = 25 * (height / 100) ** 2;
  return weight > capped ? capped : weight;
}

/**
 * Минимум жира, г на кг массы тела. Ниже ≈0,5 г/кг страдает синтез половых
 * гормонов и усвоение жирорастворимых витаминов; 0,8 — рабочий нижний край
 * с запасом. Верхнюю границу не задаём: она вопрос предпочтений, а не здоровья.
 */
const FAT_FLOOR_PER_KG = 0.8;

/** Клетчатка: 14 г на 1000 ккал — норма Institute of Medicine (2005) */
const FIBER_PER_1000 = 14;

export function macros(args: {
  calories: number;
  weight: number;
  height: number;
  goal: Goal;
  /** Доля калорий из жира, % — обычно 20–40 */
  fatPercent: number;
}): Macros {
  const { calories, weight, height, goal, fatPercent } = args;

  const refWeight = referenceWeight(weight, height);
  const proteinGrams = PROTEIN_PER_KG[goal] * refWeight;
  const proteinKcal = proteinGrams * 4;

  const fatFloor = FAT_FLOOR_PER_KG * refWeight;
  let fatGrams = Math.max((calories * fatPercent) / 100 / 9, fatFloor);
  let carbKcal = calories - proteinKcal - fatGrams * 9;

  // Жёсткий дефицит у крупного человека может не оставить углеводов вовсе.
  // Тогда сначала опускаем жир до пола, и только если и этого мало —
  // урезаем белок: без углеводов жить можно, без незаменимых аминокислот нет.
  let squeezed = false;
  if (carbKcal < 0) {
    squeezed = true;
    fatGrams = fatFloor;
    carbKcal = calories - proteinKcal - fatGrams * 9;
    if (carbKcal < 0) carbKcal = 0;
  }

  const carbGrams = carbKcal / 4;
  const total = proteinKcal + fatGrams * 9 + carbGrams * 4;
  const share = (kcal: number) => (total > 0 ? (kcal / total) * 100 : 0);

  return {
    protein: {
      grams: proteinGrams,
      kcal: proteinKcal,
      share: share(proteinKcal),
      perKg: weight > 0 ? proteinGrams / weight : 0,
    },
    fat: {
      grams: fatGrams,
      kcal: fatGrams * 9,
      share: share(fatGrams * 9),
      perKg: weight > 0 ? fatGrams / weight : 0,
    },
    carbs: {
      grams: carbGrams,
      kcal: carbGrams * 4,
      share: share(carbGrams * 4),
      perKg: weight > 0 ? carbGrams / weight : 0,
    },
    fiber: (calories / 1000) * FIBER_PER_1000,
    squeezed,
  };
}

/* ==========================================================================
   Сопутствующие ориентиры
   ========================================================================== */

export function bmi(weight: number, height: number): number {
  return weight / (height / 100) ** 2;
}

/** Границы веса для ИМТ 18,5–25 при данном росте, кг */
export function healthyWeightRange(height: number): [number, number] {
  const m2 = (height / 100) ** 2;
  return [18.5 * m2, 25 * m2];
}

/**
 * Ориентир по жидкости: 30–35 мл на кг массы тела в сутки, включая воду
 * из еды и напитков. Тренировки добавляют примерно 0,5 л на час нагрузки.
 */
export function waterRange(weight: number): [number, number] {
  return [weight * 30, weight * 35];
}

/**
 * Недель до целевого веса при выбранном темпе.
 *
 * Считается по постоянному темпу и потому занижает срок: по мере потери
 * массы расход падает, и тот же дефицит даёт всё меньший результат.
 * Возвращает null, если цель уже достигнута или темп нулевой.
 */
export function weeksToTarget(current: number, target: number, kgPerWeek: number): number | null {
  const diff = Math.abs(current - target);
  if (diff < 0.1 || kgPerWeek <= 0) return null;
  return diff / kgPerWeek;
}
