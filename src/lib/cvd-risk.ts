/**
 * Расчёт 10-летнего риска сердечно-сосудистых заболеваний по SCORE2 (2021).
 *
 * Вынесен из компонента, чтобы коэффициенты можно было читать и проверять
 * отдельно от разметки. Все числа — из публикации SCORE2 Working Group,
 * European Heart Journal 2021 (сверено с исходником пакета RiskScorescvd).
 *
 * Модель предсказывает 10-летний риск фатального и нефатального инфаркта
 * и инсульта у людей 40–69 лет БЕЗ установленного ССЗ, диабета и ХБП.
 * Для 70+ используется отдельная модель SCORE2-OP, здесь она не реализована.
 */

export type Sex = "male" | "female";

/**
 * Регион калибровки по классификации ESC 2021.
 * Россия, Украина, Беларусь и большинство стран СНГ отнесены к «очень
 * высокому» риску — поэтому для RU-локали это значение по умолчанию.
 */
export type RiskRegion = "low" | "moderate" | "high" | "veryHigh";

export type CvdInput = {
  sex: Sex;
  /** Возраст, лет — модель валидна для 40–69 */
  age: number;
  smoker: boolean;
  /** Систолическое АД, мм рт. ст. */
  sbp: number;
  /** Общий холестерин, ммоль/л */
  totalChol: number;
  /** Холестерин ЛПВП, ммоль/л */
  hdl: number;
  region: RiskRegion;
};

type SexCoef = {
  age: number;
  smoking: number;
  sbp: number;
  tchol: number;
  hdl: number;
  ageSmoking: number;
  ageSbp: number;
  ageTchol: number;
  ageHdl: number;
  /** Базовая 10-летняя выживаемость S0 */
  s0: number;
};

/** Коэффициенты линейного предиктора, таблица SCORE2 (EHJ 2021, доп. материалы) */
const COEF: Record<Sex, SexCoef> = {
  male: {
    age: 0.3742,
    smoking: 0.6012,
    sbp: 0.2777,
    tchol: 0.1458,
    hdl: -0.2698,
    ageSmoking: -0.0755,
    ageSbp: -0.0255,
    ageTchol: -0.0281,
    ageHdl: 0.0426,
    s0: 0.9605,
  },
  female: {
    age: 0.4648,
    smoking: 0.7744,
    sbp: 0.3131,
    tchol: 0.1002,
    hdl: -0.2606,
    ageSmoking: -0.1088,
    ageSbp: -0.0277,
    ageTchol: -0.0226,
    ageHdl: 0.0613,
    s0: 0.9776,
  },
};

/** Калибровочные шкалы по региону и полу (те же доп. материалы SCORE2) */
const SCALES: Record<Sex, Record<RiskRegion, { s1: number; s2: number }>> = {
  male: {
    low: { s1: -0.5699, s2: 0.7476 },
    moderate: { s1: -0.1565, s2: 0.8009 },
    high: { s1: 0.3207, s2: 0.936 },
    veryHigh: { s1: 0.5836, s2: 0.8294 },
  },
  female: {
    low: { s1: -0.738, s2: 0.7019 },
    moderate: { s1: -0.3143, s2: 0.7701 },
    high: { s1: 0.571, s2: 0.9369 },
    veryHigh: { s1: 0.9412, s2: 0.8329 },
  },
};

/** Три категории риска ESC 2021: низкий-умеренный, высокий, очень высокий */
export type CvdCategory = "lowMod" | "high" | "veryHigh";

export type CvdResult = {
  /** 10-летний риск ССЗ, доля 0..1 */
  risk: number;
  /** Тот же риск в процентах, округлён до 0,1 */
  percent: number;
  /** Категория риска по возрастным порогам ESC 2021 */
  category: CvdCategory;
};

/**
 * Возрастные пороги категорий риска (ESC 2021):
 * до 50 лет границы ниже, чем в 50–69, потому что тот же процент
 * в молодом возрасте означает более высокий пожизненный риск.
 */
function categorize(percent: number, age: number): CvdCategory {
  if (age < 50) {
    if (percent < 2.5) return "lowMod";
    if (percent < 7.5) return "high";
    return "veryHigh";
  }
  // 50–69
  if (percent < 5) return "lowMod";
  if (percent < 10) return "high";
  return "veryHigh";
}

/**
 * 10-летний риск ССЗ по SCORE2.
 * Возвращает null за пределами валидного возраста модели (40–69).
 */
export function cvdRisk(v: CvdInput): CvdResult | null {
  if (v.age < 40 || v.age > 69) return null;

  const c = COEF[v.sex];

  // Преобразование предикторов, как в оригинале
  const cage = (v.age - 60) / 5;
  const csbp = (v.sbp - 120) / 20;
  const ctchol = v.totalChol - 6;
  const chdl = (v.hdl - 1.3) / 0.5;
  const smoke = v.smoker ? 1 : 0;

  const x =
    c.age * cage +
    c.smoking * smoke +
    c.sbp * csbp +
    c.tchol * ctchol +
    c.hdl * chdl +
    c.ageSmoking * cage * smoke +
    c.ageSbp * cage * csbp +
    c.ageTchol * cage * ctchol +
    c.ageHdl * cage * chdl;

  // Некалиброванный риск
  const uncalibrated = 1 - Math.pow(c.s0, Math.exp(x));

  // Калибровка под регион
  const { s1, s2 } = SCALES[v.sex][v.region];
  const risk = 1 - Math.exp(-Math.exp(s1 + s2 * Math.log(-Math.log(1 - uncalibrated))));

  if (!Number.isFinite(risk) || risk <= 0 || risk >= 1) return null;

  const percent = Math.round(risk * 1000) / 10;
  return { risk, percent, category: categorize(percent, v.age) };
}

/** ммоль/л ← мг/дл для холестерина: делить на 38.67 */
export const CHOL_MGDL_TO_MMOL = 38.67;
