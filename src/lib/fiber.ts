/**
 * Расчётная часть калькулятора нормы клетчатки.
 *
 * Вынесена из компонента, чтобы нормы можно было читать и проверять
 * отдельно от разметки. Значения — из референсных документов IOM и EFSA,
 * а не подобраны на глаз.
 */

export type Sex = "male" | "female";

export type FiberInput = {
  sex: Sex;
  /** Возраст, лет — после 50 норма IOM снижается вместе с калорийностью */
  age: number;
  /** Суточная калорийность рациона, ккал — задаёт альтернативный расчёт */
  calories: number;
};

/**
 * Adequate Intake клетчатки, г/сут — Institute of Medicine (2005).
 * Выведено из соотношения 14 г на 1000 ккал и медианной калорийности:
 * мужчины 19–50 — 38 г, 51+ — 30 г; женщины 19–50 — 25 г, 51+ — 21 г.
 */
const IOM_AI: Record<Sex, { young: number; older: number }> = {
  male: { young: 38, older: 30 },
  female: { young: 25, older: 21 },
};

const OLDER_AGE = 51;

/** Ключевое соотношение IOM: 14 г клетчатки на каждые 1000 ккал рациона */
export const FIBER_PER_1000KCAL = 14;

/** Минимум для взрослых по EFSA (2010): 25 г/сут для нормальной работы кишечника */
export const EFSA_MINIMUM = 25;

/** Типичное фактическое потребление взрослого — около 15–18 г/сут (обзоры США и ЕС) */
export const TYPICAL_INTAKE = 16;

export type FiberResult = {
  /** Норма по полу и возрасту (IOM AI), г */
  aiTarget: number;
  /** Норма по калорийности (14 г/1000 ккал), г */
  calorieTarget: number;
  /** Рекомендуемая цель — большее из двух, но не ниже минимума EFSA, г */
  target: number;
  /** Разрыв с типичным потреблением, г (сколько обычно недобирают) */
  gap: number;
};

function round1(n: number): number {
  return Math.round(n);
}

export function fiberNeeds(v: FiberInput): FiberResult {
  const band = v.age >= OLDER_AGE ? IOM_AI[v.sex].older : IOM_AI[v.sex].young;
  const aiTarget = band;
  const calorieTarget = round1((v.calories / 1000) * FIBER_PER_1000KCAL);

  // Цель — большее из двух подходов, но не ниже минимума EFSA
  const target = Math.max(EFSA_MINIMUM, aiTarget, calorieTarget);
  const gap = Math.max(0, round1(target - TYPICAL_INTAKE));

  return { aiTarget, calorieTarget, target, gap };
}

/**
 * Клетчатка в стандартной порции продукта, г.
 * Числа по USDA FoodData Central, округлены.
 */
export const FIBER_FOODS: { id: string; grams: number }[] = [
  { id: "beans", grams: 7 }, // 100 г варёной фасоли
  { id: "lentils", grams: 8 }, // 100 г варёной чечевицы
  { id: "raspberries", grams: 7 }, // 100 г малины
  { id: "chia", grams: 4 }, // 1 ст. ложка семян чиа (12 г)
  { id: "oats", grams: 4 }, // 40 г овсяных хлопьев
  { id: "apple", grams: 4 }, // 1 яблоко с кожурой
  { id: "almonds", grams: 4 }, // 30 г миндаля
  { id: "wholeBread", grams: 2 }, // 1 ломоть цельнозернового хлеба
  { id: "broccoli", grams: 3 }, // 100 г брокколи
];
