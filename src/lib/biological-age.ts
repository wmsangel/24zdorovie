/**
 * Расчётная часть калькулятора биологического возраста.
 *
 * Вынесена из компонента, чтобы формулы можно было читать и проверять
 * отдельно от разметки: это единственное место, где числа имеют значение.
 */

/* ==========================================================================
   PhenoAge — Levine et al., Aging (Albany NY), 2018
   ========================================================================== */

/** Единицы совпадают с оригинальной публикацией и менять их нельзя */
export type PhenoAgeInput = {
  /** Возраст, лет */
  age: number;
  /** Альбумин, г/л */
  albumin: number;
  /** Креатинин, мкмоль/л */
  creatinine: number;
  /** Глюкоза, ммоль/л */
  glucose: number;
  /** С-реактивный белок, мг/дл (лаборатории обычно дают мг/л — делить на 10) */
  crp: number;
  /** Лимфоциты, % */
  lymphocytes: number;
  /** Средний объём эритроцита MCV, фл */
  mcv: number;
  /** Ширина распределения эритроцитов RDW, % */
  rdw: number;
  /** Щелочная фосфатаза, Ед/л */
  alp: number;
  /** Лейкоциты, ×10⁹/л (численно равно ×10³/мкл) */
  wbc: number;
};

/** Параметр Гомпертца из оригинальной модели */
const GOMPERTZ = 0.0076927;

/**
 * Взвешенная сумма девяти биомаркеров и возраста.
 * Коэффициенты — из таблицы 1 публикации Levine 2018, отобраны
 * Cox-регрессией по смертности в NHANES III (n = 9926).
 */
function linearCombination(v: PhenoAgeInput): number {
  return (
    -19.9067 -
    0.0336 * v.albumin +
    0.0095 * v.creatinine +
    0.1953 * v.glucose +
    0.0954 * Math.log(v.crp) -
    0.012 * v.lymphocytes +
    0.0268 * v.mcv +
    0.3306 * v.rdw +
    0.00188 * v.alp +
    0.0554 * v.wbc +
    0.0804 * v.age
  );
}

/**
 * PhenoAge в годах: возраст, при котором средняя смертность в популяции
 * равна вашей расчётной. Совпадение с хронологическим возрастом означает
 * «стареете со средней скоростью», а не «здоровы».
 *
 * Проверка вменяемости: средние показатели 50-летнего дают ≈50,6 года,
 * заметно нарушенные — ≈71,7.
 */
export function phenoAge(v: PhenoAgeInput): number | null {
  // ln(CRP) при нуле уходит в −∞ и ломает расчёт; ниже 0,01 мг/дл лаборатории не измеряют
  if (v.crp <= 0 || v.age <= 0) return null;

  const xb = linearCombination(v);
  const mortalityRisk =
    1 - Math.exp((-Math.exp(xb) * (Math.exp(120 * GOMPERTZ) - 1)) / GOMPERTZ);

  // Риск, вплотную подошедший к единице, обращать обратно уже нечем
  if (!(mortalityRisk > 0) || mortalityRisk >= 1) return null;

  const result = 141.50225 + Math.log(-0.00553 * Math.log(1 - mortalityRisk)) / 0.09165;
  return Number.isFinite(result) ? result : null;
}

/* ==========================================================================
   Конвертация единиц: лаборатории в СНГ пишут СИ, в США — традиционные
   ========================================================================== */

export const CONVERT = {
  /** г/дл → г/л */
  albuminFromGdl: (v: number) => v * 10,
  /** мг/дл → мкмоль/л */
  creatinineFromMgdl: (v: number) => v * 88.4,
  /** мг/дл → ммоль/л */
  glucoseFromMgdl: (v: number) => v / 18.016,
  /** мг/л → мг/дл (формуле нужны мг/дл) */
  crpFromMgl: (v: number) => v / 10,
} as const;

/* ==========================================================================
   Оценка по образу жизни
   ========================================================================== */

/**
 * Это НЕ биологический возраст. Это сумма поправок к ожидаемой
 * продолжительности жизни от факторов с известным размером эффекта.
 * Складывать такие оценки строго говоря нельзя — факторы коррелируют
 * между собой, — поэтому результат показывается как порядок величины
 * и всегда вместе с разбивкой по факторам.
 *
 * Цифры округлены вниз относительно источников: у наблюдательных данных
 * эффекты завышены остаточным конфаундингом.
 */
export type LifestyleFactor = {
  id: string;
  /** Годы, прибавляемые к хронологическому возрасту; отрицательные — вычитаются */
  options: { id: string; years: number }[];
};

export const LIFESTYLE_FACTORS: LifestyleFactor[] = [
  {
    // Jha et al., NEJM 2013: курильщики теряют ≥10 лет, отказ до 40 возвращает почти всё
    id: "smoking",
    options: [
      { id: "never", years: 0 },
      { id: "quit-long", years: 0.5 },
      { id: "quit-recent", years: 2 },
      { id: "current", years: 7 },
    ],
  },
  {
    // Moore et al., PLoS Med 2012: от нуля до 22,5 МЕТ-ч/нед разница ≈4,2 года
    id: "activity",
    options: [
      { id: "high", years: -2.5 },
      { id: "moderate", years: -1.5 },
      { id: "low", years: 0.5 },
      { id: "sedentary", years: 2 },
    ],
  },
  {
    // Prospective Studies Collaboration, Lancet 2009: ИМТ 30–35 → минус 2–4 года, 40–45 → минус 8–10
    id: "bmi",
    options: [
      { id: "under", years: 1 },
      { id: "normal", years: 0 },
      { id: "over", years: 0.5 },
      { id: "obese1", years: 2.5 },
      { id: "obese2", years: 4 },
      { id: "obese3", years: 8 },
    ],
  },
  {
    // Wood et al., Lancet 2018: >350 г/нед в 40 лет ≈ минус 4–5 лет
    id: "alcohol",
    options: [
      { id: "none", years: 0 },
      { id: "light", years: 0.5 },
      { id: "moderate", years: 1.5 },
      { id: "heavy", years: 4.5 },
    ],
  },
  {
    // Оценка занижена намеренно: моделирование Fadnes 2022 даёт заметно больше
    id: "diet",
    options: [
      { id: "good", years: -1.5 },
      { id: "mixed", years: -0.5 },
      { id: "poor", years: 1.5 },
    ],
  },
  {
    // Cappuccio et al., Sleep 2010: короткий сон HR 1,12, длинный HR 1,30
    id: "sleep",
    options: [
      { id: "optimal", years: 0 },
      { id: "short", years: 0.5 },
      { id: "very-short", years: 1.5 },
      { id: "long", years: 1 },
    ],
  },
  {
    // PSC, Lancet 2002: каждые +20 мм рт. ст. систолического удваивают риск смерти от ССЗ
    id: "bp",
    options: [
      { id: "optimal", years: -0.5 },
      { id: "normal", years: 0 },
      { id: "high1", years: 2 },
      { id: "high2", years: 4 },
    ],
  },
  {
    // Holt-Lunstad et al., PLoS Med 2010: сильные социальные связи — OR 1,5 на выживание
    id: "social",
    options: [
      { id: "strong", years: -1.5 },
      { id: "some", years: 0 },
      { id: "isolated", years: 2 },
    ],
  },
];

export type LifestyleAnswers = Record<string, string>;

export function lifestyleOffset(answers: LifestyleAnswers) {
  const breakdown = LIFESTYLE_FACTORS.map((factor) => {
    const chosen = factor.options.find((o) => o.id === answers[factor.id]);
    return { factor: factor.id, option: chosen?.id ?? null, years: chosen?.years ?? 0 };
  });

  return {
    breakdown,
    total: breakdown.reduce((sum, b) => sum + b.years, 0),
  };
}
