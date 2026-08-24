import type { Locale } from "@/config/site";

/**
 * Пересчёт единиц анализов крови: СИ (ммоль/л, мкмоль/л, ммоль/моль) ↔
 * традиционные (мг/дл, %). Формулы вынесены сюда, чтобы числа были
 * проверяемы без чтения разметки — источники в content/tools.
 *
 * Модель связи единиц — аффинная: conv = si · m + b.
 *   - для липидов и глюкозы b = 0, m — это «мг/дл на 1 ммоль/л»
 *     (равно молярной массе / 10);
 *   - для HbA1c связь IFCC↔NGSP со сдвигом: % = ммоль/моль / 10.929 + 2.15.
 *
 * Обратный перевод: si = (conv − b) / m.
 */
export type BloodAnalyte = {
  id: string;
  name: Record<Locale, string>;
  /** Единица СИ (первичная в РФ/ЕС) */
  siUnit: Record<Locale, string>;
  /** Традиционная единица (США) */
  convUnit: Record<Locale, string>;
  /** conv = si · m + b */
  m: number;
  b: number;
  siDecimals: number;
  convDecimals: number;
  /** Шаг ввода в единицах СИ */
  siStep: number;
  /** Значение по умолчанию в единицах СИ */
  siDefault: number;
  /**
   * Ориентир нормы у взрослого, в единицах СИ. Для наглядности, не диагноз:
   * зависит от лаборатории, пола и возраста — об этом сказано в подписи.
   */
  ref?: { low?: number; high?: number };
  note?: Record<Locale, string>;
};

/**
 * Коэффициенты — из молярных масс, значения общеприняты в лабораторной
 * практике (см. источники на странице инструмента):
 *   холестерин  386.65 г/моль → 38.67 мг/дл на ммоль/л
 *   триглицериды 885.4 г/моль → 88.57
 *   глюкоза     180.16 г/моль → 18.02
 *   мочевая к-та 168.11 г/моль → 1 мг/дл = 59.48 мкмоль/л
 *   креатинин   113.12 г/моль → 1 мг/дл = 88.42 мкмоль/л
 *   HbA1c: NGSP% = IFCC(ммоль/моль) / 10.929 + 2.15
 */
export const ANALYTES: BloodAnalyte[] = [
  {
    id: "total-cholesterol",
    name: { ru: "Общий холестерин", en: "Total cholesterol" },
    siUnit: { ru: "ммоль/л", en: "mmol/L" },
    convUnit: { ru: "мг/дл", en: "mg/dL" },
    m: 38.67,
    b: 0,
    siDecimals: 2,
    convDecimals: 1,
    siStep: 0.1,
    siDefault: 5.2,
    ref: { high: 5.2 },
    note: {
      ru: "Желательный уровень — ниже 5,2 ммоль/л (200 мг/дл). Целевые значения индивидуальны и зависят от сердечно-сосудистого риска.",
      en: "Desirable is below 5.2 mmol/L (200 mg/dL). Targets are individual and depend on cardiovascular risk.",
    },
  },
  {
    id: "ldl-cholesterol",
    name: { ru: "ЛПНП («плохой» холестерин)", en: "LDL cholesterol" },
    siUnit: { ru: "ммоль/л", en: "mmol/L" },
    convUnit: { ru: "мг/дл", en: "mg/dL" },
    m: 38.67,
    b: 0,
    siDecimals: 2,
    convDecimals: 1,
    siStep: 0.1,
    siDefault: 3.0,
    ref: { high: 3.0 },
    note: {
      ru: "Целевой уровень тем ниже, чем выше риск: при очень высоком риске — ниже 1,4 ммоль/л (55 мг/дл) по рекомендациям ESC/EAS.",
      en: "The higher your risk, the lower the target: below 1.4 mmol/L (55 mg/dL) at very high risk per ESC/EAS.",
    },
  },
  {
    id: "hdl-cholesterol",
    name: { ru: "ЛПВП («хороший» холестерин)", en: "HDL cholesterol" },
    siUnit: { ru: "ммоль/л", en: "mmol/L" },
    convUnit: { ru: "мг/дл", en: "mg/dL" },
    m: 38.67,
    b: 0,
    siDecimals: 2,
    convDecimals: 1,
    siStep: 0.1,
    siDefault: 1.3,
    ref: { low: 1.0 },
    note: {
      ru: "Здесь выше — лучше. Низким считается ниже 1,0 ммоль/л (40 мг/дл) у мужчин и ниже 1,2 (46 мг/дл) у женщин.",
      en: "Here higher is better. Low is below 1.0 mmol/L (40 mg/dL) in men and below 1.2 (46 mg/dL) in women.",
    },
  },
  {
    id: "triglycerides",
    name: { ru: "Триглицериды", en: "Triglycerides" },
    siUnit: { ru: "ммоль/л", en: "mmol/L" },
    convUnit: { ru: "мг/дл", en: "mg/dL" },
    m: 88.57,
    b: 0,
    siDecimals: 2,
    convDecimals: 1,
    siStep: 0.1,
    siDefault: 1.5,
    ref: { high: 1.7 },
    note: {
      ru: "Норма натощак — ниже 1,7 ммоль/л (150 мг/дл). Сдают строго натощак: после еды значение завышается.",
      en: "Normal fasting is below 1.7 mmol/L (150 mg/dL). Measure strictly fasting — food raises it.",
    },
  },
  {
    id: "glucose",
    name: { ru: "Глюкоза крови", en: "Blood glucose" },
    siUnit: { ru: "ммоль/л", en: "mmol/L" },
    convUnit: { ru: "мг/дл", en: "mg/dL" },
    m: 18.02,
    b: 0,
    siDecimals: 1,
    convDecimals: 0,
    siStep: 0.1,
    siDefault: 5.5,
    ref: { low: 3.9, high: 5.5 },
    note: {
      ru: "Натощак норма — 3,9–5,5 ммоль/л (70–99 мг/дл). 5,6–6,9 ммоль/л — преддиабет, 7,0 и выше в двух пробах — критерий диабета.",
      en: "Fasting normal is 3.9–5.5 mmol/L (70–99 mg/dL). 5.6–6.9 is prediabetes; 7.0+ on two tests meets the diabetes criterion.",
    },
  },
  {
    id: "hba1c",
    name: { ru: "Гликированный гемоглобин (HbA1c)", en: "HbA1c (glycated haemoglobin)" },
    siUnit: { ru: "ммоль/моль", en: "mmol/mol" },
    convUnit: { ru: "%", en: "%" },
    m: 1 / 10.929,
    b: 2.15,
    siDecimals: 0,
    convDecimals: 1,
    siStep: 1,
    siDefault: 39,
    ref: { high: 39 },
    note: {
      ru: "Две шкалы: % (NGSP/DCCT) и ммоль/моль (IFCC). Норма — ниже 5,7% (39 ммоль/моль), 5,7–6,4% — преддиабет, 6,5% и выше — диабет.",
      en: "Two scales: % (NGSP/DCCT) and mmol/mol (IFCC). Normal is below 5.7% (39 mmol/mol); 5.7–6.4% prediabetes; 6.5%+ diabetes.",
    },
  },
  {
    id: "uric-acid",
    name: { ru: "Мочевая кислота", en: "Uric acid" },
    siUnit: { ru: "мкмоль/л", en: "µmol/L" },
    convUnit: { ru: "мг/дл", en: "mg/dL" },
    m: 1 / 59.48,
    b: 0,
    siDecimals: 0,
    convDecimals: 1,
    siStep: 5,
    siDefault: 350,
    ref: { low: 200, high: 420 },
    note: {
      ru: "Ориентир: примерно 200–420 мкмоль/л у мужчин и 140–360 у женщин. Риск подагры растёт выше ~360 мкмоль/л (6 мг/дл).",
      en: "Roughly 200–420 µmol/L in men and 140–360 in women. Gout risk rises above ~360 µmol/L (6 mg/dL).",
    },
  },
  {
    id: "creatinine",
    name: { ru: "Креатинин", en: "Creatinine" },
    siUnit: { ru: "мкмоль/л", en: "µmol/L" },
    convUnit: { ru: "мг/дл", en: "mg/dL" },
    m: 1 / 88.42,
    b: 0,
    siDecimals: 0,
    convDecimals: 2,
    siStep: 1,
    siDefault: 80,
    ref: { low: 60, high: 110 },
    note: {
      ru: "Ориентир взрослого — примерно 60–110 мкмоль/л (у женщин ниже). Для оценки функции почек важнее рСКФ, а не сам креатинин.",
      en: "Adult ballpark is about 60–110 µmol/L (lower in women). Kidney function is judged by eGFR, not creatinine alone.",
    },
  },
];

export function getAnalyte(id: string): BloodAnalyte | undefined {
  return ANALYTES.find((a) => a.id === id);
}

/** Единица СИ → традиционная: conv = si · m + b */
export function siToConv(a: BloodAnalyte, si: number): number {
  return si * a.m + a.b;
}

/** Традиционная → СИ: si = (conv − b) / m */
export function convToSi(a: BloodAnalyte, conv: number): number {
  return (conv - a.b) / a.m;
}

/**
 * Оценочная средняя глюкоза (eAG) по HbA1c — формула ADAG:
 * eAG(мг/дл) = 28.7 · A1c(%) − 46.7. Возвращает мг/дл и ммоль/л.
 */
export function estimatedAverageGlucose(a1cPercent: number): { mgdl: number; mmol: number } {
  const mgdl = 28.7 * a1cPercent - 46.7;
  return { mgdl, mmol: mgdl / 18.02 };
}

/** Округление до заданного числа знаков без «плавающих» хвостов */
export function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
