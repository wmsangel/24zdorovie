/**
 * Расчётная часть калькулятора витамина D.
 *
 * Здесь три независимых вопроса, которые обычно путают в один:
 *
 *   1. Где человек сейчас — трактовка 25(OH)D по порогам.
 *   2. Как быстро подняться до нормы, если есть дефицит, — насыщающая доза
 *      по формуле van Groningen (Eur J Endocrinol, 2010), единственной
 *      валидированной схеме, которая учитывает массу тела.
 *   3. Что принимать дальше — поддерживающая доза из доза-ответа
 *      с поправкой на массу тела (Ekwaru, PLoS One, 2014).
 *
 * Все внутренние расчёты — в нмоль/л и МЕ в сутки. Перевод в нг/мл
 * только на границе, при вводе и выводе.
 */

/* ==========================================================================
   Единицы и пороги
   ========================================================================== */

/** 1 нг/мл 25(OH)D = 2,496 нмоль/л. В обиходе округляют до 2,5 */
export const NGML_TO_NMOL = 2.496;

export const toNmol = (ngml: number) => ngml * NGML_TO_NMOL;
export const toNgml = (nmol: number) => nmol / NGML_TO_NMOL;

export type Unit = "ngml" | "nmol";

export type VitaminDStatus =
  | "severe"
  | "deficient"
  | "insufficient"
  | "target"
  | "above"
  | "toxic";

/**
 * Пороги 25(OH)D в нмоль/л.
 *
 * Нижняя граница нормы — предмет давнего спора. Institute of Medicine
 * считает достаточными 50 нмоль/л (20 нг/мл): этого хватает для здоровья
 * костей у 97,5% населения. Endocrine Society ориентируется на 75 нмоль/л
 * (30 нг/мл). Калькулятор берёт целью 75 — как в клинических рекомендациях
 * по коррекции дефицита, — но показывает и границу IOM, чтобы человек
 * с уровнем 60 нмоль/л не считал себя больным.
 */
export const THRESHOLDS = {
  severe: 25,
  deficient: 50,
  insufficient: 75,
  target: 125,
  above: 250,
} as const;

/** Целевой уровень, к которому считается доза */
export const TARGET_NMOL = 75;

/** Порог достаточности по IOM — вторая точка отсчёта на шкале */
export const IOM_SUFFICIENT_NMOL = 50;

export function classify(nmol: number): VitaminDStatus {
  if (nmol < THRESHOLDS.severe) return "severe";
  if (nmol < THRESHOLDS.deficient) return "deficient";
  if (nmol < THRESHOLDS.insufficient) return "insufficient";
  if (nmol < THRESHOLDS.target) return "target";
  if (nmol < THRESHOLDS.above) return "above";
  return "toxic";
}

/* ==========================================================================
   Дозы и пределы
   ========================================================================== */

/**
 * Верхний безопасный уровень длительного самостоятельного приёма:
 * 4000 МЕ в сутки для взрослых (IOM, 2011; EFSA, 2012).
 * Всё, что выше, — курс под контролем анализов, а не режим по умолчанию.
 */
export const UL_DAILY = 4000;

/** Потолок суточной насыщающей дозы, выше которого схему не предлагаем */
export const LOADING_DAILY_CAP = 10_000;

/**
 * Прирост 25(OH)D на каждые 1000 МЕ в сутки при выходе на плато
 * (8–12 недель приёма). Диапазон отражает реальный разброс между людьми:
 * ответ тем меньше, чем выше исходный уровень.
 */
export const RESPONSE_PER_1000 = { low: 7, mid: 10, high: 17 } as const;

/**
 * Поправка на массу тела (Ekwaru et al., PLoS One, 2014): витамин D
 * жирорастворим и распределяется в жировой ткани, поэтому при одной и той же
 * дозе прирост в крови у человека с ожирением в 2–3 раза меньше.
 */
export function bodyFactor(bmi: number): number {
  if (bmi < 25) return 1;
  if (bmi < 30) return 1.5;
  if (bmi < 35) return 2;
  return 2.5;
}

export const bmiOf = (weight: number, height: number) =>
  weight / Math.pow(Math.max(120, height) / 100, 2);

/** Дозы округляем до 500 МЕ — мельче не бывает ни капель, ни капсул */
const roundDose = (iu: number) => Math.round(iu / 500) * 500;

/* ==========================================================================
   Сводный расчёт
   ========================================================================== */

export type VitaminDInput = {
  /** Масса тела, кг */
  weight: number;
  /** Рост, см — нужен только для поправки на состав тела */
  height: number;
  age: number;
  /** Текущий 25(OH)D в нмоль/л; undefined — анализа нет */
  level?: number;
  /** Сколько МЕ в сутки человек принимает прямо сейчас */
  currentDose: number;
};

export type VitaminDResult = {
  bmi: number;
  factor: number;
  /** Прирост на 1000 МЕ с поправкой на массу тела, нмоль/л */
  response: { low: number; mid: number; high: number };
  status?: VitaminDStatus;
  /** Уровень без учёта принимаемой добавки — от него считается доза */
  baseline?: number;
  /** Поддерживающая доза, МЕ/сутки */
  maintenance: number;
  /** Расчётная поддерживающая доза упёрлась в верхний предел */
  maintenanceCapped: boolean;
  /** Схема насыщения — только при уровне ниже целевого */
  loading?: {
    /** Суммарная доза курса, МЕ */
    total: number;
    /** Суточная доза при курсе 8 недель, МЕ */
    daily: number;
    /** Эквивалент еженедельного приёма по 50 000 МЕ, недель */
    weeks: number;
    /** Суточная доза вышла за 10 000 МЕ — только по назначению врача */
    aboveCap: boolean;
  };
  /** Ожидаемый уровень через 8–12 недель на поддерживающей дозе, нмоль/л */
  projected: { low: number; mid: number; high: number };
  /** Доля поддерживающей дозы от верхнего безопасного предела, 0–1 */
  ulShare: number;
  /** Анализ нужен до начала приёма: доза заметно выше профилактической */
  needsTest: boolean;
};

/**
 * Профилактическая доза без анализа: 800–2000 МЕ для взрослого
 * (NIH ODS, клинические рекомендации Endocrine Society). Берём середину
 * диапазона и поднимаем после 70 лет — синтез в коже к этому возрасту
 * падает примерно вчетверо.
 */
function preventiveDose(age: number): number {
  return age >= 70 ? 2000 : 1500;
}

export function vitaminDPlan(input: VitaminDInput): VitaminDResult {
  const { weight, height, age, level, currentDose } = input;

  const bmi = bmiOf(weight, height);
  const factor = bodyFactor(bmi);
  const response = {
    low: RESPONSE_PER_1000.low / factor,
    mid: RESPONSE_PER_1000.mid / factor,
    high: RESPONSE_PER_1000.high / factor,
  };

  /**
   * Анализ отражает и еду, и солнце, и уже принимаемую добавку.
   * Чтобы не назначить дозу поверх той, что уже работает, вычитаем
   * её вклад и считаем от «чистого» уровня.
   */
  const baseline =
    level === undefined ? undefined : Math.max(0, level - (currentDose / 1000) * response.mid);

  let maintenance: number;
  if (baseline === undefined) {
    maintenance = roundDose(preventiveDose(age) * factor);
  } else {
    const gap = Math.max(0, TARGET_NMOL - baseline);
    maintenance = roundDose((gap / response.mid) * 1000);
    // Даже при достигнутой цели уровень держится только приёмом:
    // отменив добавку, человек вернётся к baseline за пару месяцев.
    if (maintenance === 0) maintenance = roundDose(preventiveDose(age) * factor);
  }

  const maintenanceCapped = maintenance > UL_DAILY;
  if (maintenanceCapped) maintenance = UL_DAILY;

  let loading: VitaminDResult["loading"];
  if (level !== undefined && level < TARGET_NMOL) {
    /**
     * van Groningen L, et al. Cholecalciferol loading dose guideline
     * for vitamin D-deficient adults. Eur J Endocrinol, 2010:
     * суммарная доза (МЕ) = 40 × (75 − текущий уровень) × масса тела.
     */
    const total = 40 * (TARGET_NMOL - level) * weight;
    const daily = roundDose(total / 56);
    loading = {
      total: Math.round(total / 1000) * 1000,
      daily: Math.min(daily, LOADING_DAILY_CAP),
      weeks: Math.max(1, Math.round(total / 50_000)),
      aboveCap: daily > LOADING_DAILY_CAP,
    };
  }

  const start = baseline ?? 0;
  const projected = {
    low: start + (maintenance / 1000) * response.low,
    mid: start + (maintenance / 1000) * response.mid,
    high: start + (maintenance / 1000) * response.high,
  };

  return {
    bmi,
    factor,
    response,
    status: level === undefined ? undefined : classify(level),
    baseline,
    maintenance,
    maintenanceCapped,
    loading,
    projected,
    ulShare: Math.min(1, maintenance / UL_DAILY),
    needsTest: maintenance > 2000 || (level !== undefined && level < THRESHOLDS.deficient),
  };
}

/* ==========================================================================
   Бытовые эквиваленты
   ========================================================================== */

/**
 * Во что доза превращается в аптеке. Капля масляного раствора —
 * стандартные 500 МЕ, капсулы обычно 1000 или 2000 МЕ.
 */
export const DROP_IU = 500;

/**
 * Сколько витамина D дают продукты, МЕ на порцию (USDA FoodData Central).
 * Нужны не как альтернатива добавке, а как масштаб: закрыть едой
 * даже профилактическую дозу практически невозможно.
 */
export const FOOD_SOURCES = [
  { id: "salmon", iu: 800 },
  { id: "herring", iu: 300 },
  { id: "sardines", iu: 250 },
  { id: "codLiverOil", iu: 425 },
  { id: "egg", iu: 30 },
  { id: "milk", iu: 110 },
  { id: "mushrooms", iu: 350 },
] as const;
