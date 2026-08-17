/**
 * Расчётная часть калькулятора суточной нормы белка.
 *
 * Вынесена из компонента, чтобы коэффициенты можно было читать и проверять
 * отдельно от разметки. Все числа — г белка на кг массы тела в сутки,
 * из систематических обзоров и позиционных документов, а не «на глаз».
 */

export type Sex = "male" | "female";

/** Уровень активности задаёт базовый диапазон г/кг */
export type Activity = "sedentary" | "active" | "endurance" | "strength";

/** Цель сдвигает диапазон вверх (дефицит и набор мышц требуют больше) */
export type Goal = "maintain" | "lose" | "gain";

export type ProteinInput = {
  /** Масса тела, кг */
  weight: number;
  /** Возраст, лет — после 65 минимум поднимается (саркопения) */
  age: number;
  sex: Sex;
  activity: Activity;
  goal: Goal;
};

/**
 * Базовые диапазоны г/кг по уровню активности.
 *
 * - sedentary: RDA 0.8 — минимум против дефицита, не оптимум (WHO/FAO 2007)
 * - active: 1.2–1.6 — общая рекомендация для физически активных (ISSN 2017)
 * - endurance: 1.2–1.6 — выносливость, потребность чуть выше сидячей
 * - strength: 1.6–2.2 — силовые и набор массы; в мета-анализе Morton 2018
 *   прирост мышц выходит на плато около 1.6 г/кг, 2.2 взято как верх диапазона
 */
const BASE_RANGE: Record<Activity, [number, number]> = {
  sedentary: [0.8, 1.0],
  active: [1.2, 1.6],
  endurance: [1.2, 1.6],
  strength: [1.6, 2.2],
};

/**
 * Поправка на цель, г/кг, прибавляется к обеим границам диапазона.
 *
 * - lose: в дефиците калорий белок сохраняет мышцы; для тренированных
 *   в дефиците рекомендуют 1.6–2.4 г/кг (Helms 2014) — поэтому сдвиг вверх
 * - gain: набор массы держат у верхней границы силового диапазона
 */
const GOAL_SHIFT: Record<Goal, number> = {
  maintain: 0,
  lose: 0.3,
  gain: 0.2,
};

/** Нижний порог для пожилых: PROT-AGE рекомендует минимум 1.0–1.2 г/кг после 65 */
const OLDER_AGE = 65;
const OLDER_MIN = 1.0;

export type ProteinResult = {
  /** Нижняя и верхняя границы суточной нормы, г */
  low: number;
  high: number;
  /** Середина диапазона, г — показывается как основная цифра */
  mid: number;
  /** Использованный диапазон г/кг (для объяснения) */
  perKg: [number, number];
  /** Рекомендуемое число приёмов с белком */
  meals: number;
  /** Белок на один приём, г (~0.4 г/кг за раз, но не ниже практичного минимума) */
  perMeal: number;
};

/** Округление до 5 г — точнее считать смысла нет, разброс потребности выше */
function round5(n: number): number {
  return Math.round(n / 5) * 5;
}

export function proteinNeeds(v: ProteinInput): ProteinResult {
  let [lowKg, highKg] = BASE_RANGE[v.activity];
  const shift = GOAL_SHIFT[v.goal];
  lowKg += shift;
  highKg += shift;

  // Пожилым не опускаемся ниже 1.0 г/кг даже при сидячем образе жизни
  if (v.age >= OLDER_AGE) {
    lowKg = Math.max(lowKg, OLDER_MIN);
    highKg = Math.max(highKg, OLDER_MIN + 0.2);
  }

  const low = round5(v.weight * lowKg);
  const high = round5(v.weight * highKg);
  const mid = round5((low + high) / 2);

  // Синтез мышечного белка максимально стимулируется порцией ~0.4 г/кг
  // (Schoenfeld & Aragon 2018); отсюда число приёмов под середину нормы
  const perMealTarget = Math.max(20, round5(v.weight * 0.4));
  const meals = Math.min(6, Math.max(3, Math.round(mid / perMealTarget)));
  const perMeal = round5(mid / meals);

  return { low, high, mid, perKg: [lowKg, highKg], meals, perMeal };
}

/**
 * Сколько белка в стандартной порции продукта, г.
 * Для блока «чем набрать»: числа по USDA FoodData Central, округлены.
 */
export const PROTEIN_FOODS: { id: string; grams: number }[] = [
  { id: "chickenBreast", grams: 31 }, // 100 г куриной грудки
  { id: "cottage", grams: 17 }, // 100 г творога 5%
  { id: "eggs", grams: 13 }, // 2 яйца
  { id: "lentils", grams: 9 }, // 100 г варёной чечевицы
  { id: "greekYogurt", grams: 10 }, // 100 г греческого йогурта
  { id: "tofu", grams: 8 }, // 100 г тофу
  { id: "whey", grams: 24 }, // 1 мерная ложка сывороточного протеина
];
