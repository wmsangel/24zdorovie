"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  ACTIVITY_LEVELS,
  RATE_LIMITS,
  basalRate,
  bmi,
  healthyWeightRange,
  macros,
  palOf,
  referenceWeight,
  targetCalories,
  waterRange,
  weeksToTarget,
  type ActivityId,
  type Goal,
  type Sex,
} from "@/lib/energy";

/**
 * Калькулятор калорий и БЖУ.
 *
 * Вся арифметика живёт в src/lib/energy.ts — здесь только ввод, вывод
 * и предупреждения. Состояние хранится в метрической системе;
 * имперские единицы существуют только на границе ввода и вывода.
 */

const COPY = {
  ru: {
    about: "Данные о себе",
    units: { metric: "кг / см", imperial: "фунты / футы" },
    sex: "Пол",
    sexes: { male: "Мужской", female: "Женский" },
    age: "Возраст",
    years: "лет",
    height: "Рост",
    heightImperial: "футы / дюймы",
    weight: "Вес",
    kg: "кг",
    bodyFat: "Процент жира",
    bodyFatHint: "Необязательно. Если знаете по DEXA или биоимпедансу — расчёт станет точнее",
    bodyFatEmpty: "не знаю",
    activity: "Активность",
    activities: {
      sedentary: "Сидячая — офис, мало ходьбы",
      light: "Лёгкая — 1–3 тренировки в неделю",
      moderate: "Умеренная — 3–5 тренировок",
      high: "Высокая — 6–7 тренировок",
      athlete: "Очень высокая — спорт или физический труд",
    },
    activityHint: "Сомневаетесь между двумя уровнями — берите нижний. Активность люди переоценивают чаще всего",

    goalTitle: "Цель",
    goals: { lose: "Похудеть", maintain: "Держать вес", gain: "Набрать массу" },
    rate: "Темп",
    ratePerWeek: (amount: string, unit: string, pct: string) =>
      `${amount} ${unit} в неделю · ${pct}% массы тела`,
    targetWeight: "Целевой вес",
    targetWeightHint: "Необязательно. Покажет срок при выбранном темпе",
    fatShare: "Доля жира в рационе",
    fatShareHint: "Углеводы считаются как остаток. Меняйте, если знаете, как вам комфортнее",

    resultTitle: "Ваша норма",
    perDay: "ккал в день",
    bmr: "Основной обмен",
    tdee: "Суточный расход",
    delta: "Разница",
    deltaSurplus: "профицит",
    deltaDeficit: "дефицит",
    formulaKatch: "Katch-McArdle, по сухой массе",
    formulaMifflin: "Mifflin-St Jeor",

    macrosTitle: "Белки, жиры, углеводы",
    protein: "Белок",
    fat: "Жиры",
    carbs: "Углеводы",
    grams: "г",
    perKgLabel: (v: string) => `${v} г/кг`,
    kcalShort: "ккал",

    extrasTitle: "Заодно",
    fiber: "Клетчатка",
    fiberBasis: "14 г на 1000 ккал",
    water: "Жидкость",
    waterBasis: "30–35 мл на кг веса",
    litersDay: "л в день",
    bmiLabel: "ИМТ",
    healthyRange: (a: string, b: string, unit: string) =>
      `норма для вашего роста: ${a}–${b} ${unit}`,

    forecastTitle: "Сколько это займёт",
    forecastText: (weeks: string, date: string, amount: string, unit: string) =>
      `При темпе ${amount} ${unit} в неделю до цели примерно ${weeks} нед. — это ${date}. Оценка нижняя: по мере снижения веса расход падает, и та же еда постепенно перестаёт быть дефицитом.`,
    forecastReached: "Целевой вес уже достигнут или очень близок.",
    months: (n: string) => `${n} мес.`,

    warnFloor:
      "Расчётный дефицит уходил ниже основного обмена, и калькулятор поднял норму до него. Есть меньше, чем тело тратит в покое, устойчиво нельзя: первым уходит не жир, а мышцы, волосы и цикл. Возьмите темп помедленнее или добавьте движения.",
    warnSqueezed:
      "При такой калорийности на углеводы почти ничего не осталось. Это признак слишком резкого дефицита, а не удачного распределения.",
    warnLowKcal:
      "Норма опустилась ниже 1200 ккал. Такие рационы применяют под наблюдением врача — самостоятельно на них не стоит переходить.",
    warnFast:
      "Темп выше 1% массы тела в неделю на длинной дистанции стоит сухой массы. Быстрее — не значит лучше: удержать результат сложнее, чем его получить.",
    warnUnderweight: "При ИМТ ниже 18,5 задача снижения веса требует обсуждения с врачом, а не калькулятора.",

    disclaimer:
      "Любая формула даёт оценку с погрешностью около 10% — это 200–250 ккал. Считайте результат отправной точкой: две недели ешьте эту норму, следите за весом и правьте цифру по факту, а не по расчёту.",
  },
  en: {
    about: "About you",
    units: { metric: "kg / cm", imperial: "lb / ft" },
    sex: "Sex",
    sexes: { male: "Male", female: "Female" },
    age: "Age",
    years: "years",
    height: "Height",
    heightImperial: "ft / in",
    weight: "Weight",
    kg: "kg",
    bodyFat: "Body fat",
    bodyFatHint: "Optional. If you know it from DEXA or a good scale, the estimate gets better",
    bodyFatEmpty: "unknown",
    activity: "Activity",
    activities: {
      sedentary: "Sedentary — desk job, little walking",
      light: "Light — 1–3 workouts a week",
      moderate: "Moderate — 3–5 workouts",
      high: "High — 6–7 workouts",
      athlete: "Very high — athlete or physical job",
    },
    activityHint: "Torn between two levels? Pick the lower one. Activity is what people overestimate most",

    goalTitle: "Goal",
    goals: { lose: "Lose fat", maintain: "Maintain", gain: "Gain muscle" },
    rate: "Rate",
    ratePerWeek: (amount: string, unit: string, pct: string) =>
      `${amount} ${unit} per week · ${pct}% of body weight`,
    targetWeight: "Goal weight",
    targetWeightHint: "Optional. Shows how long it takes at this rate",
    fatShare: "Calories from fat",
    fatShareHint: "Carbs are whatever is left. Move it if you know what suits you",

    resultTitle: "Your daily target",
    perDay: "kcal per day",
    bmr: "Basal rate",
    tdee: "Daily burn",
    delta: "Difference",
    deltaSurplus: "surplus",
    deltaDeficit: "deficit",
    formulaKatch: "Katch-McArdle, from lean mass",
    formulaMifflin: "Mifflin-St Jeor",

    macrosTitle: "Protein, fat, carbs",
    protein: "Protein",
    fat: "Fat",
    carbs: "Carbs",
    grams: "g",
    perKgLabel: (v: string) => `${v} g/kg`,
    kcalShort: "kcal",

    extrasTitle: "While you are here",
    fiber: "Fibre",
    fiberBasis: "14 g per 1000 kcal",
    water: "Fluids",
    waterBasis: "30–35 ml per kg",
    litersDay: "L per day",
    bmiLabel: "BMI",
    healthyRange: (a: string, b: string, unit: string) =>
      `healthy for your height: ${a}–${b} ${unit}`,

    forecastTitle: "How long it takes",
    forecastText: (weeks: string, date: string, amount: string, unit: string) =>
      `At ${amount} ${unit} per week you reach the goal in about ${weeks} weeks — around ${date}. Treat it as the optimistic end: as weight comes off your burn falls, and the same food slowly stops being a deficit.`,
    forecastReached: "You are already at or very near that weight.",
    months: (n: string) => `${n} months`,

    warnFloor:
      "The deficit fell below your basal rate, so the target was raised back up to it. Eating less than your body burns at rest is not sustainable — what goes first is muscle, hair and hormones, not fat. Slow the rate down or move more.",
    warnSqueezed:
      "At this intake there is almost nothing left for carbohydrates. That is a sign of too steep a deficit, not of clever macro splitting.",
    warnLowKcal:
      "The target dropped under 1200 kcal. Diets that low belong under medical supervision, not self-prescription.",
    warnFast:
      "Above 1% of body weight per week you start paying in lean mass. Faster is not better — keeping the result off is the harder half.",
    warnUnderweight: "Below a BMI of 18.5, losing weight is a conversation for a doctor, not a calculator.",

    disclaimer:
      "Every formula here carries about a 10% error — that is 200–250 kcal. Use the number as a starting point: eat it for two weeks, watch the scale, and correct from what actually happened rather than from the maths.",
  },
} as const;

/* ── Единицы ──────────────────────────────────────────────── */

const LB_PER_KG = 2.20462;
const CM_PER_IN = 2.54;

type Unit = "metric" | "imperial";

/* ── Форматирование ───────────────────────────────────────── */

/**
 * Форматируем вручную, а не через toLocaleString: страницы собираются
 * статически, и расхождение ICU между сборкой и браузером даёт
 * ошибку гидрации на ровном месте.
 */
function makeFormatter(locale: Locale) {
  const decimal = locale === "ru" ? "," : ".";
  return (n: number, digits = 0) => {
    if (!Number.isFinite(n)) return "—";
    const [int, frac] = Math.abs(n).toFixed(digits).split(".");
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const sign = n < 0 ? "−" : "";
    return sign + grouped + (frac ? decimal + frac : "");
  };
}

/** Дата через n недель — в подписи прогноза */
function dateInWeeks(weeks: number, locale: Locale): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.round(weeks * 7));
  const months =
    locale === "ru"
      ? ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"]
      : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return locale === "ru"
    ? `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
    : `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const FIELD =
  "mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 tabular-nums";
const LABEL =
  "block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]";
const HINT = "mt-1.5 text-[0.8rem] leading-snug text-[var(--ink-faint)]";

export function CalorieMacroCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;
  const nf = useMemo(() => makeFormatter(locale), [locale]);

  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(35);
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(82);
  const [bodyFat, setBodyFat] = useState<number | null>(null);
  const [activity, setActivity] = useState<ActivityId>("light");

  const [goal, setGoal] = useState<Goal>("lose");
  const [rate, setRate] = useState<number>(RATE_LIMITS.lose.default);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [fatPercent, setFatPercent] = useState(28);

  const r = useMemo(() => {
    const { value: bmrValue, formula } = basalRate({ sex, weight, height, age, bodyFat });
    const tdee = bmrValue * palOf(activity);
    const t = targetCalories({ tdee, bmr: bmrValue, goal, ratePercent: rate, weight });
    const m = macros({ calories: t.target, weight, height, goal, fatPercent });

    const weeks =
      goalWeight != null && goal !== "maintain"
        ? weeksToTarget(weight, goalWeight, t.kgPerWeek)
        : null;

    return {
      bmr: bmrValue,
      formula,
      tdee,
      ...t,
      macros: m,
      bmiValue: bmi(weight, height),
      healthy: healthyWeightRange(height),
      water: waterRange(weight),
      refWeight: referenceWeight(weight, height),
      weeks,
    };
  }, [sex, weight, height, age, bodyFat, activity, goal, rate, fatPercent, goalWeight]);

  /** Вес наружу: внутри всё в килограммах, показываем в выбранных единицах */
  const toUnit = (kg: number) => (unit === "metric" ? kg : kg * LB_PER_KG);
  const weightUnit = unit === "metric" ? c.kg : "lb";

  /** Смена цели перезадаёт темп: диапазоны у похудения и набора разные */
  function changeGoal(next: Goal) {
    setGoal(next);
    if (next !== "maintain") setRate(RATE_LIMITS[next].default);
  }

  const limits = goal === "maintain" ? RATE_LIMITS.lose : RATE_LIMITS[goal];

  const warnings = [
    r.floored && c.warnFloor,
    r.macros.squeezed && c.warnSqueezed,
    goal === "lose" && r.target < 1200 && c.warnLowKcal,
    goal === "lose" && rate >= RATE_LIMITS.lose.max && c.warnFast,
    goal === "lose" && r.bmiValue < 18.5 && c.warnUnderweight,
  ].filter(Boolean) as string[];

  const bars = [
    { key: "protein" as const, label: c.protein, data: r.macros.protein, tone: "var(--accent)" },
    { key: "fat" as const, label: c.fat, data: r.macros.fat, tone: "color-mix(in oklab, var(--accent) 55%, var(--paper))" },
    { key: "carbs" as const, label: c.carbs, data: r.macros.carbs, tone: "color-mix(in oklab, var(--accent) 28%, var(--paper))" },
  ];

  return (
    <section className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      {/* ── О себе ───────────────────────────────────────────── */}
      <div className="grid gap-6 p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={LABEL}>{c.about}</p>
          <div className="flex gap-1 rounded-full border border-[var(--line)] p-1">
            {(["metric", "imperial"] as Unit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                aria-pressed={unit === u}
                className={`rounded-full px-3 py-1 text-[0.8rem] font-semibold transition-colors ${
                  unit === u
                    ? "bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                    : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
                }`}
              >
                {c.units[u]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={LABEL}>{c.sex}</p>
            <div className="mt-2 flex gap-2">
              {(["male", "female"] as Sex[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSex(s)}
                  aria-pressed={sex === s}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-[0.9rem] font-semibold transition-colors ${
                    sex === s
                      ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                      : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {c.sexes[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="cm-age" className={LABEL}>
              {c.age}, {c.years}
            </label>
            <input
              id="cm-age"
              type="number"
              min={14}
              max={100}
              value={age}
              onChange={(e) => setAge(Math.max(14, Math.min(100, Number(e.target.value) || 0)))}
              className={FIELD}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {unit === "metric" ? (
            <div>
              <label htmlFor="cm-height" className={LABEL}>
                {c.height}, {locale === "ru" ? "см" : "cm"}
              </label>
              <input
                id="cm-height"
                type="number"
                min={120}
                max={230}
                value={Math.round(height)}
                onChange={(e) =>
                  setHeight(Math.max(120, Math.min(230, Number(e.target.value) || 0)))
                }
                className={FIELD}
              />
            </div>
          ) : (
            <div>
              <p className={LABEL}>
                {c.height}, {c.heightImperial}
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  min={4}
                  max={7}
                  aria-label={`${c.height}, ft`}
                  value={Math.floor(height / CM_PER_IN / 12)}
                  onChange={(e) => {
                    const ft = Math.max(4, Math.min(7, Number(e.target.value) || 0));
                    const inches = Math.round(height / CM_PER_IN) % 12;
                    setHeight((ft * 12 + inches) * CM_PER_IN);
                  }}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 tabular-nums"
                />
                <input
                  type="number"
                  min={0}
                  max={11}
                  aria-label={`${c.height}, in`}
                  value={Math.round(height / CM_PER_IN) % 12}
                  onChange={(e) => {
                    const inches = Math.max(0, Math.min(11, Number(e.target.value) || 0));
                    const ft = Math.floor(height / CM_PER_IN / 12);
                    setHeight((ft * 12 + inches) * CM_PER_IN);
                  }}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 tabular-nums"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="cm-weight" className={LABEL}>
              {c.weight}, {weightUnit}
            </label>
            <input
              id="cm-weight"
              type="number"
              min={unit === "metric" ? 35 : 77}
              max={unit === "metric" ? 250 : 550}
              value={unit === "metric" ? Math.round(weight) : Math.round(weight * LB_PER_KG)}
              onChange={(e) => {
                const raw = Number(e.target.value) || 0;
                const kg = unit === "metric" ? raw : raw / LB_PER_KG;
                setWeight(Math.max(35, Math.min(250, kg)));
              }}
              className={FIELD}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cm-bodyfat" className={LABEL}>
              {c.bodyFat}, %
            </label>
            <input
              id="cm-bodyfat"
              type="number"
              min={3}
              max={60}
              placeholder={c.bodyFatEmpty}
              value={bodyFat ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                setBodyFat(v === "" ? null : Math.max(3, Math.min(60, Number(v) || 0)));
              }}
              className={FIELD}
            />
            <p className={HINT}>{c.bodyFatHint}</p>
          </div>

          <div>
            <label htmlFor="cm-activity" className={LABEL}>
              {c.activity}
            </label>
            <select
              id="cm-activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityId)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5"
            >
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.id} value={a.id}>
                  {c.activities[a.id]}
                </option>
              ))}
            </select>
            <p className={HINT}>{c.activityHint}</p>
          </div>
        </div>
      </div>

      {/* ── Цель ─────────────────────────────────────────────── */}
      <div className="grid gap-6 border-t border-[var(--line)] bg-[var(--surface-2)] p-5 md:p-7">
        <div>
          <p className={LABEL}>{c.goalTitle}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["lose", "maintain", "gain"] as Goal[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => changeGoal(g)}
                aria-pressed={goal === g}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-[0.9rem] font-semibold transition-colors ${
                  goal === g
                    ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                    : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink-soft)] hover:bg-[var(--surface)]"
                }`}
              >
                {c.goals[g]}
              </button>
            ))}
          </div>
        </div>

        {goal !== "maintain" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cm-rate" className={LABEL}>
                {c.rate}
              </label>
              <input
                id="cm-rate"
                type="range"
                min={limits.min}
                max={limits.max}
                step={0.125}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--brand)]"
              />
              <p className="mt-1 text-[0.88rem] font-semibold tabular-nums">
                {c.ratePerWeek(
                  nf(toUnit((weight * rate) / 100), 2),
                  weightUnit,
                  nf(rate, 3).replace(/[.,]?0+$/, ""),
                )}
              </p>
            </div>

            <div>
              <label htmlFor="cm-goal-weight" className={LABEL}>
                {c.targetWeight}, {weightUnit}
              </label>
              <input
                id="cm-goal-weight"
                type="number"
                min={0}
                placeholder="—"
                value={
                  goalWeight == null
                    ? ""
                    : unit === "metric"
                      ? Math.round(goalWeight)
                      : Math.round(goalWeight * LB_PER_KG)
                }
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") return setGoalWeight(null);
                  const raw = Number(v) || 0;
                  const kg = unit === "metric" ? raw : raw / LB_PER_KG;
                  setGoalWeight(Math.max(30, Math.min(300, kg)));
                }}
                className={FIELD}
              />
              <p className={HINT}>{c.targetWeightHint}</p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="cm-fat-share" className={LABEL}>
            {c.fatShare}: {nf(fatPercent)}%
          </label>
          <input
            id="cm-fat-share"
            type="range"
            min={20}
            max={40}
            step={1}
            value={fatPercent}
            onChange={(e) => setFatPercent(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--brand)]"
          />
          <p className={HINT}>{c.fatShareHint}</p>
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────── */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className={LABEL}>{c.resultTitle}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[2.75rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
            {nf(r.target)}
          </span>
          <span className="text-[0.95rem] text-[var(--ink-soft)]">{c.perDay}</span>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            {
              t: c.bmr,
              v: `${nf(r.bmr)} ${c.kcalShort}`,
              s: r.formula === "katch" ? c.formulaKatch : c.formulaMifflin,
            },
            {
              t: c.tdee,
              v: `${nf(r.tdee)} ${c.kcalShort}`,
              s: `× ${nf(palOf(activity), 3).replace(/0+$/, "")}`,
            },
            {
              t: c.delta,
              v: `${r.delta > 0 ? "+" : ""}${nf(r.delta)} ${c.kcalShort}`,
              s: r.delta === 0 ? "—" : r.delta > 0 ? c.deltaSurplus : c.deltaDeficit,
            },
          ].map((item) => (
            <div
              key={item.t}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5"
            >
              <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
                {item.t}
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold tabular-nums">{item.v}</dd>
              <dd className="mt-0.5 text-[0.78rem] text-[var(--ink-faint)]">{item.s}</dd>
            </div>
          ))}
        </dl>

        {/* Макронутриенты */}
        <div className="mt-7">
          <p className={LABEL}>{c.macrosTitle}</p>

          <div className="mt-3 flex h-3 overflow-hidden rounded-full" aria-hidden="true">
            {bars.map((b) => (
              <div key={b.key} style={{ width: `${b.data.share}%`, background: b.tone }} />
            ))}
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {bars.map((b) => (
              <div
                key={b.key}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5"
              >
                <dt className="flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: b.tone }}
                  />
                  {b.label}
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold tabular-nums">
                  {nf(b.data.grams)} {c.grams}
                </dd>
                <dd className="mt-0.5 text-[0.8rem] tabular-nums text-[var(--ink-faint)]">
                  {nf(b.data.share)}% · {nf(b.data.kcal)} {c.kcalShort} ·{" "}
                  {c.perKgLabel(nf(b.data.perKg, 1))}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Сопутствующее */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { t: c.fiber, v: `${nf(r.macros.fiber)} ${c.grams}`, s: c.fiberBasis },
            {
              t: c.water,
              v: `${nf(r.water[0] / 1000, 1)}–${nf(r.water[1] / 1000, 1)} ${c.litersDay}`,
              s: c.waterBasis,
            },
            {
              t: c.bmiLabel,
              v: nf(r.bmiValue, 1),
              s: c.healthyRange(nf(toUnit(r.healthy[0])), nf(toUnit(r.healthy[1])), weightUnit),
            },
          ].map((item) => (
            <div
              key={item.t}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5"
            >
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
                {item.t}
              </p>
              <p className="mt-1 font-display text-xl font-semibold tabular-nums">{item.v}</p>
              <p className="mt-0.5 text-[0.78rem] leading-snug text-[var(--ink-faint)]">{item.s}</p>
            </div>
          ))}
        </div>

        {/* Прогноз */}
        {goalWeight != null && goal !== "maintain" && (
          <div className="mt-6 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
            <p className="font-semibold">📅 {c.forecastTitle}</p>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
              {r.weeks == null
                ? c.forecastReached
                : c.forecastText(
                    nf(r.weeks),
                    dateInWeeks(r.weeks, locale),
                    nf(toUnit(r.kgPerWeek), 2),
                    weightUnit,
                  )}
            </p>
          </div>
        )}

        {/* Предупреждения */}
        {warnings.map((w) => (
          <p
            key={w.slice(0, 24)}
            className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]"
          >
            <span aria-hidden="true">⚠️ </span>
            {w}
          </p>
        ))}

        <p className="mt-5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}
