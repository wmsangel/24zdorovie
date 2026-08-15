/**
 * Расчётная часть калькулятора ИМТ и состава тела.
 *
 * Вынесена из компонента по тем же соображениям, что и energy.ts:
 * каждое число здесь должно быть проверяемо без чтения разметки.
 *
 * Всё внутри — метрическая система: килограммы и сантиметры.
 * Перевод из фунтов и дюймов делает компонент, формулы о нём не знают.
 */

export type Sex = "male" | "female";

/* ==========================================================================
   Индекс массы тела
   ========================================================================== */

/** ИМТ = кг / м². Кетле, 1832; как показатель ожирения популяризован Keys, 1972 */
export function bmi(weight: number, height: number): number {
  const m = height / 100;
  return m > 0 ? weight / (m * m) : 0;
}

export type BmiCategory =
  | "underweight"
  | "normal"
  | "overweight"
  | "obese1"
  | "obese2"
  | "obese3";

/**
 * Пороги ИМТ.
 *
 * `standard` — классификация ВОЗ 1995 года, выведенная на европеоидных
 * популяциях. `asian` — пороги из отчёта экспертной консультации ВОЗ
 * (Lancet, 2004): у выходцев из Южной и Восточной Азии при том же ИМТ
 * выше доля жира и риск диабета 2 типа, поэтому избыточная масса
 * начинается с 23, а ожирение — с 27,5.
 */
export type BmiScale = "standard" | "asian";

const BMI_CUTOFFS: Record<BmiScale, { overweight: number; obese1: number; obese2: number; obese3: number }> = {
  standard: { overweight: 25, obese1: 30, obese2: 35, obese3: 40 },
  asian: { overweight: 23, obese1: 27.5, obese2: 32.5, obese3: 37.5 },
};

export function bmiCategory(value: number, scale: BmiScale = "standard"): BmiCategory {
  const c = BMI_CUTOFFS[scale];
  if (value < 18.5) return "underweight";
  if (value < c.overweight) return "normal";
  if (value < c.obese1) return "overweight";
  if (value < c.obese2) return "obese1";
  if (value < c.obese3) return "obese2";
  return "obese3";
}

/** Границы «нормального» ИМТ в килограммах для данного роста */
export function healthyWeightRange(height: number, scale: BmiScale = "standard") {
  const m = height / 100;
  const upper = BMI_CUTOFFS[scale].overweight;
  return { min: 18.5 * m * m, max: upper * m * m };
}

/* ==========================================================================
   Окружность талии: то, чего ИМТ не видит
   ========================================================================== */

export type RiskLevel = "healthy" | "increased" | "high";

/**
 * Абсолютная окружность талии, пороги ВОЗ (2008) для европеоидных популяций.
 * У выходцев из Азии пороги ниже: 90 см у мужчин и 80 см у женщин (IDF).
 */
const WAIST_CUTOFFS: Record<Sex, { increased: number; high: number }> = {
  male: { increased: 94, high: 102 },
  female: { increased: 80, high: 88 },
};

export function waistCategory(waist: number, sex: Sex): RiskLevel {
  const c = WAIST_CUTOFFS[sex];
  if (waist >= c.high) return "high";
  if (waist >= c.increased) return "increased";
  return "healthy";
}

/**
 * Отношение талии к росту (WHtR).
 *
 * В метаанализе Ashwell и соавт. (Obes Rev, 2012) предсказывает
 * кардиометаболический риск лучше ИМТ и лучше одной только талии,
 * а с 2022 года входит в рекомендации NICE. Практическое правило:
 * окружность талии должна быть меньше половины роста.
 */
export function waistToHeight(waist: number, height: number): number {
  return height > 0 ? waist / height : 0;
}

export type WhtrCategory = "low" | "healthy" | "increased" | "high";

export function whtrCategory(ratio: number): WhtrCategory {
  if (ratio < 0.4) return "low";
  if (ratio < 0.5) return "healthy";
  if (ratio < 0.6) return "increased";
  return "high";
}

/** Отношение талии к бёдрам; пороги ВОЗ 2008: 0,90 у мужчин, 0,85 у женщин */
export function waistToHip(waist: number, hip: number): number {
  return hip > 0 ? waist / hip : 0;
}

export function whrCategory(ratio: number, sex: Sex): RiskLevel {
  const limit = sex === "male" ? 0.9 : 0.85;
  if (ratio >= limit + 0.05) return "high";
  if (ratio >= limit) return "increased";
  return "healthy";
}

/* ==========================================================================
   Доля жира по обхватам (метод ВМФ США)
   ========================================================================== */

export type NavyInput = {
  sex: Sex;
  /** Рост, см */
  height: number;
  /** Окружность шеи, см */
  neck: number;
  /** Окружность талии на уровне пупка, см */
  waist: number;
  /** Окружность бёдер, см — нужна только для женщин */
  hip?: number | null;
};

/**
 * Hodgdon & Beckett, 1984 — уравнение, по которому ВМФ США до сих пор
 * оценивает состав тела у личного состава.
 *
 * Точность честно средняя: типичная ошибка 3–4 процентных пункта против
 * DXA, и она растёт на краях диапазона. Зато метод не требует ничего,
 * кроме сантиметровой ленты, и хорошо ловит динамику: если через два
 * месяца число упало, талия действительно уменьшилась.
 */
export function navyBodyFat({ sex, height, neck, waist, hip }: NavyInput): number | null {
  if (!(height > 0) || !(neck > 0) || !(waist > 0)) return null;

  if (sex === "male") {
    // Логарифм отрицательного аргумента ломает расчёт: талия должна быть больше шеи
    if (waist - neck <= 0) return null;
    const value =
      495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    return clampFat(value);
  }

  if (!hip || hip <= 0 || waist + hip - neck <= 0) return null;
  const value =
    495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
  return clampFat(value);
}

/** За пределами 3–70% результат уже не физиологичен и означает ошибку в замерах */
function clampFat(value: number): number | null {
  return Number.isFinite(value) && value > 3 && value < 70 ? value : null;
}

export type BodyFatCategory = "essential" | "athletic" | "fitness" | "average" | "obese";

/** Пороги American Council on Exercise — практическая шкала, а не диагноз */
const FAT_CUTOFFS: Record<Sex, { essential: number; athletic: number; fitness: number; average: number }> = {
  male: { essential: 6, athletic: 14, fitness: 18, average: 25 },
  female: { essential: 14, athletic: 21, fitness: 25, average: 32 },
};

export function bodyFatCategory(pct: number, sex: Sex): BodyFatCategory {
  const c = FAT_CUTOFFS[sex];
  if (pct < c.essential) return "essential";
  if (pct < c.athletic) return "athletic";
  if (pct < c.fitness) return "fitness";
  if (pct < c.average) return "average";
  return "obese";
}

/**
 * Индекс сухой массы (FFMI): сухая масса / м².
 *
 * Отвечает на вопрос, который ИМТ игнорирует, — сколько под жиром мышц.
 * Значения 22–23 у мужчин и 18–19 у женщин соответствуют верхней границе
 * того, что достигается без фармподдержки (Kouri et al., Clin J Sport Med, 1995).
 */
export function fatFreeMassIndex(weight: number, height: number, bodyFat: number): number {
  const m = height / 100;
  if (m <= 0) return 0;
  return (weight * (1 - bodyFat / 100)) / (m * m);
}

/* ==========================================================================
   Сводная оценка
   ========================================================================== */

export type CompositionInput = {
  sex: Sex;
  weight: number;
  height: number;
  age: number;
  scale: BmiScale;
  waist?: number | null;
  hip?: number | null;
  neck?: number | null;
};

export type CompositionResult = {
  bmi: number;
  bmiCategory: BmiCategory;
  healthyWeight: { min: number; max: number };
  /** Насколько текущий вес выходит за верхнюю границу нормы, кг; 0 — не выходит */
  excessWeight: number;
  whtr: number | null;
  whtrCategory: WhtrCategory | null;
  waistRisk: RiskLevel | null;
  whr: number | null;
  whrRisk: RiskLevel | null;
  bodyFat: number | null;
  bodyFatCategory: BodyFatCategory | null;
  ffmi: number | null;
  /**
   * Итоговый ориентир по риску — по худшему из доступных показателей.
   * Талия имеет приоритет над ИМТ: висцеральный жир опаснее общей массы.
   */
  overall: RiskLevel;
};

export function assessComposition(input: CompositionInput): CompositionResult {
  const { sex, weight, height, scale, waist, hip, neck } = input;

  const value = bmi(weight, height);
  const category = bmiCategory(value, scale);
  const healthy = healthyWeightRange(height, scale);

  const whtr = waist ? waistToHeight(waist, height) : null;
  const whr = waist && hip ? waistToHip(waist, hip) : null;
  const fat = waist && neck ? navyBodyFat({ sex, height, neck, waist, hip }) : null;

  const bmiRisk: RiskLevel =
    category === "normal" || category === "underweight"
      ? "healthy"
      : category === "overweight"
        ? "increased"
        : "high";

  const waistRisk = waist ? waistCategory(waist, sex) : null;
  const ratioRisk = whtr === null ? null : whtrRisk(whtrCategory(whtr));

  // Талия перевешивает ИМТ, если измерена: она ближе к висцеральному жиру
  const risks = [waistRisk, ratioRisk].filter(Boolean) as RiskLevel[];
  const overall = risks.length ? worst(risks) : bmiRisk;

  return {
    bmi: value,
    bmiCategory: category,
    healthyWeight: healthy,
    excessWeight: Math.max(0, weight - healthy.max),
    whtr,
    whtrCategory: whtr === null ? null : whtrCategory(whtr),
    waistRisk,
    whr,
    whrRisk: whr === null ? null : whrCategory(whr, sex),
    bodyFat: fat,
    bodyFatCategory: fat === null ? null : bodyFatCategory(fat, sex),
    ffmi: fat === null ? null : fatFreeMassIndex(weight, height, fat),
    overall,
  };
}

function whtrRisk(category: WhtrCategory): RiskLevel {
  if (category === "high") return "high";
  if (category === "increased") return "increased";
  return "healthy";
}

function worst(levels: RiskLevel[]): RiskLevel {
  if (levels.includes("high")) return "high";
  if (levels.includes("increased")) return "increased";
  return "healthy";
}
