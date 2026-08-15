/**
 * Расчётная часть калькулятора пульсовых зон.
 *
 * Вынесена из компонента, чтобы формулы можно было проверить отдельно
 * от разметки: в кардиотренировках вся польза калькулятора — в том,
 * какие именно уравнения он использует.
 */

export type Sex = "male" | "female";

/* ==========================================================================
   Максимальный пульс
   ========================================================================== */

export type MaxHrFormula = "tanaka" | "gulati" | "fox";

/**
 * Tanaka et al., J Am Coll Cardiol 2001 — метаанализ 351 исследования
 * и проверка на 514 здоровых испытуемых. Стандартное отклонение всё равно
 * около 7 уд/мин, но систематического смещения по возрасту у неё нет.
 */
export function tanakaMax(age: number): number {
  return 208 - 0.7 * age;
}

/**
 * Gulati et al., Circulation 2010 — выведена на 5437 женщинах
 * (St. James Women Take Heart Project). У женщин классические уравнения
 * завышают максимум, поэтому для них это уточнение по умолчанию.
 */
export function gulatiMax(age: number): number {
  return 206 - 0.88 * age;
}

/**
 * «220 − возраст». Уравнение никогда не публиковалось как исследование:
 * это линия, проведённая на глаз по чужим данным в 1970-х (Robergs &
 * Landwehr, 2002 разбирают его происхождение). У молодых занижает,
 * после 40 лет систематически завышает максимум. Оставлено только
 * для сравнения — калькулятор показывает, насколько оно расходится.
 */
export function foxMax(age: number): number {
  return 220 - age;
}

export function maxHeartRate(age: number, sex: Sex, formula: MaxHrFormula = "tanaka"): number {
  if (formula === "fox") return foxMax(age);
  if (formula === "gulati") return gulatiMax(age);
  return sex === "female" ? gulatiMax(age) : tanakaMax(age);
}

/* ==========================================================================
   Зоны
   ========================================================================== */

/**
 * Пятизонная модель. Границы даны в долях резерва пульса (%HRR).
 *
 * Именно резерв, а не процент от максимума: метод Карвонена
 * (Karvonen et al., Ann Med Exp Biol Fenn, 1957) учитывает пульс покоя,
 * а он между людьми различается на 30 и более ударов. У человека
 * с пульсом покоя 45 и у человека с 75 «70% от максимума» — это
 * совершенно разная физиологическая нагрузка.
 */
export const ZONES = [
  { id: "z1", from: 0.5, to: 0.6 },
  { id: "z2", from: 0.6, to: 0.7 },
  { id: "z3", from: 0.7, to: 0.8 },
  { id: "z4", from: 0.8, to: 0.9 },
  { id: "z5", from: 0.9, to: 1.0 },
] as const;

export type ZoneId = (typeof ZONES)[number]["id"];

/** Метод расчёта границ: по резерву пульса или по проценту от максимума */
export type ZoneMethod = "karvonen" | "percent-max";

/**
 * Карвонен: ЧСС = пульс покоя + доля × (максимум − пульс покоя).
 * Процент от максимума: ЧСС = доля × максимум.
 */
export function targetHr(
  share: number,
  hrMax: number,
  hrRest: number,
  method: ZoneMethod
): number {
  if (method === "percent-max") return share * hrMax;
  return hrRest + share * (hrMax - hrRest);
}

export type Zone = {
  id: ZoneId;
  from: number;
  to: number;
  /** Доля от максимального пульса — для сверки с нагрудным датчиком */
  shareOfMax: { from: number; to: number };
};

export function zoneTable(hrMax: number, hrRest: number, method: ZoneMethod): Zone[] {
  return ZONES.map((z) => {
    const from = targetHr(z.from, hrMax, hrRest, method);
    const to = targetHr(z.to, hrMax, hrRest, method);
    return {
      id: z.id,
      from: Math.round(from),
      to: Math.round(to),
      shareOfMax: { from: from / hrMax, to: to / hrMax },
    };
  });
}

/** Резерв пульса: пространство между покоем и максимумом */
export function heartRateReserve(hrMax: number, hrRest: number): number {
  return Math.max(0, hrMax - hrRest);
}

/** В какую зону попадает конкретный пульс; null — ниже первой зоны */
export function zoneForHr(hr: number, zones: Zone[]): ZoneId | null {
  for (const z of zones) {
    if (hr >= z.from && hr <= z.to) return z.id;
  }
  return hr > zones[zones.length - 1].to ? "z5" : null;
}

/* ==========================================================================
   Пульс покоя как показатель здоровья
   ========================================================================== */

export type RestingCategory = "athletic" | "excellent" | "good" | "average" | "high";

/**
 * Ориентиры по пульсу покоя у взрослых. Норма — 60–100 уд/мин, но внутри
 * этого коридора значения не равноценны: в когорте Copenhagen City Heart
 * Study (Jensen et al., Heart, 2013) каждые лишние 10 уд/мин покоя
 * сопровождались ростом смертности примерно на 16% независимо
 * от физической формы и других факторов риска.
 */
export function restingCategory(hrRest: number): RestingCategory {
  if (hrRest < 50) return "athletic";
  if (hrRest < 60) return "excellent";
  if (hrRest < 70) return "good";
  if (hrRest < 80) return "average";
  return "high";
}

/* ==========================================================================
   Распределение недельного объёма
   ========================================================================== */

/**
 * Поляризованная модель: около 80% времени в первой-второй зонах,
 * около 20% — в четвёртой-пятой, а третья остаётся почти пустой.
 *
 * Так тренируются выносливостные спортсмены высокого уровня
 * (Seiler & Kjerland, Scand J Med Sci Sports, 2006), и для любителя
 * смысл тот же: третья зона слишком тяжела, чтобы набирать объём,
 * и слишком легка, чтобы поднимать МПК. У любителей типичная ошибка
 * зеркальная — почти вся работа делается именно в ней.
 */
export const POLARIZED_SPLIT: { id: ZoneId; share: number }[] = [
  { id: "z1", share: 0.35 },
  { id: "z2", share: 0.45 },
  { id: "z3", share: 0.05 },
  { id: "z4", share: 0.1 },
  { id: "z5", share: 0.05 },
];

/** Минуты в каждой зоне при заданном недельном объёме */
export function weeklyPlan(totalMinutes: number) {
  return POLARIZED_SPLIT.map((s) => ({ id: s.id, minutes: Math.round(totalMinutes * s.share) }));
}
