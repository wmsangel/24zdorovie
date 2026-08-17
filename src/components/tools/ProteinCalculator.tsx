"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  proteinNeeds,
  PROTEIN_FOODS,
  type Activity,
  type Goal,
  type Sex,
} from "@/lib/protein";

/**
 * Калькулятор суточной нормы белка.
 *
 * Даёт не одну цифру, а диапазон г/кг под уровень активности и цель —
 * потому что «норма белка» и есть диапазон, а не точка. Рядом всегда
 * показывается, из чего этот диапазон получен, и как разложить его по
 * приёмам. Формулы — в src/lib/protein.ts.
 */

const COPY = {
  ru: {
    weight: "Вес",
    kg: "кг",
    age: "Возраст",
    years: "лет",
    sex: "Пол",
    male: "Мужчина",
    female: "Женщина",
    activity: "Активность",
    activities: {
      sedentary: "Сидячий образ жизни",
      active: "Регулярные тренировки",
      endurance: "Выносливость — бег, вело, плавание",
      strength: "Силовые — набор или сохранение мышц",
    } as Record<Activity, string>,
    goal: "Цель",
    goals: {
      maintain: "Поддержание",
      lose: "Снижение жира (дефицит калорий)",
      gain: "Набор мышечной массы",
    } as Record<Goal, string>,
    resultTitle: "Белка в день",
    grams: "г",
    rangeNote: (low: string, high: string) => `Рабочий диапазон — ${low}–${high} г в сутки.`,
    perKgNote: (low: string, high: string) => `Это ${low}–${high} г на килограмм массы тела.`,
    mealsTitle: "Как разложить по приёмам",
    mealsNote: (meals: string, perMeal: string) =>
      `Около ${meals} приёмов по ${perMeal} г. Порция 0,3–0,4 г/кг за раз максимально стимулирует синтез мышечного белка; больше за один присест почти не даёт прибавки.`,
    foodsTitle: "Чем набрать середину нормы",
    foods: {
      chickenBreast: "Куриная грудка, 100 г",
      cottage: "Творог 5%, 100 г",
      eggs: "Два яйца",
      lentils: "Чечевица варёная, 100 г",
      greekYogurt: "Греческий йогурт, 100 г",
      tofu: "Тофу, 100 г",
      whey: "Протеин, 1 порция",
    } as Record<string, string>,
    olderNote:
      "После 65 лет минимум поднят: с возрастом мышцы хуже реагируют на белок, и для защиты от саркопении нужно не меньше 1,0–1,2 г/кг.",
    disclaimer:
      "Диапазон рассчитан для здоровых взрослых. При хронической болезни почек белок ограничивают, и норму задаёт врач — она может быть заметно ниже. Беременность, диализ и ряд состояний тоже меняют потребность.",
  },
  en: {
    weight: "Weight",
    kg: "kg",
    age: "Age",
    years: "years",
    sex: "Sex",
    male: "Male",
    female: "Female",
    activity: "Activity",
    activities: {
      sedentary: "Sedentary",
      active: "Regular training",
      endurance: "Endurance — running, cycling, swimming",
      strength: "Strength — building or keeping muscle",
    } as Record<Activity, string>,
    goal: "Goal",
    goals: {
      maintain: "Maintenance",
      lose: "Fat loss (calorie deficit)",
      gain: "Muscle gain",
    } as Record<Goal, string>,
    resultTitle: "Protein per day",
    grams: "g",
    rangeNote: (low: string, high: string) => `Working range is ${low}–${high} g per day.`,
    perKgNote: (low: string, high: string) => `That is ${low}–${high} g per kilogram of body mass.`,
    mealsTitle: "How to split it across meals",
    mealsNote: (meals: string, perMeal: string) =>
      `About ${meals} servings of ${perMeal} g. A dose of 0.3–0.4 g/kg per meal maximally stimulates muscle protein synthesis; much more in one sitting adds little.`,
    foodsTitle: "What covers the mid-range",
    foods: {
      chickenBreast: "Chicken breast, 100 g",
      cottage: "Cottage cheese 5%, 100 g",
      eggs: "Two eggs",
      lentils: "Cooked lentils, 100 g",
      greekYogurt: "Greek yogurt, 100 g",
      tofu: "Tofu, 100 g",
      whey: "Protein, 1 scoop",
    } as Record<string, string>,
    olderNote:
      "The minimum is raised after 65: ageing muscle responds less to protein, and guarding against sarcopenia takes at least 1.0–1.2 g/kg.",
    disclaimer:
      "This range is for healthy adults. In chronic kidney disease protein is restricted and the target comes from a doctor — it can be considerably lower. Pregnancy, dialysis and some conditions also change the need.",
  },
} as const;

const nf = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function ProteinCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [sex, setSex] = useState<Sex>("male");
  const [weight, setWeight] = useState(75);
  const [age, setAge] = useState(35);
  const [activity, setActivity] = useState<Activity>("active");
  const [goal, setGoal] = useState<Goal>("maintain");

  const r = useMemo(
    () => proteinNeeds({ weight, age, sex, activity, goal }),
    [weight, age, sex, activity, goal]
  );

  const maxFood = Math.max(...PROTEIN_FOODS.map((f) => f.grams), 1);

  return (
    <section
      data-accent="leaf"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* ── Ввод ─────────────────────────────────────────────── */}
      <div className="grid gap-6 p-5 md:p-7">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="protein-weight"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.weight}, {c.kg}
            </label>
            <input
              id="protein-weight"
              type="number"
              min={35}
              max={250}
              value={weight}
              onChange={(e) => setWeight(Math.max(35, Math.min(250, Number(e.target.value) || 0)))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
            />
          </div>
          <div>
            <label
              htmlFor="protein-age"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.age}, {c.years}
            </label>
            <input
              id="protein-age"
              type="number"
              min={16}
              max={100}
              value={age}
              onChange={(e) => setAge(Math.max(16, Math.min(100, Number(e.target.value) || 0)))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
            />
          </div>
          <div>
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {c.sex}
            </p>
            <div className="mt-2 flex gap-2">
              {(["male", "female"] as Sex[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSex(s)}
                  aria-pressed={sex === s}
                  className={`flex-1 rounded-xl border px-2.5 py-2.5 text-[0.88rem] font-semibold transition-colors ${
                    sex === s
                      ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                      : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {s === "male" ? c.male : c.female}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="protein-activity"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.activity}
            </label>
            <select
              id="protein-activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value as Activity)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5"
            >
              {(["sedentary", "active", "endurance", "strength"] as Activity[]).map((k) => (
                <option key={k} value={k}>
                  {c.activities[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="protein-goal"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.goal}
            </label>
            <select
              id="protein-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value as Goal)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5"
            >
              {(["maintain", "lose", "gain"] as Goal[]).map((k) => (
                <option key={k} value={k}>
                  {c.goals[k]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────── */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {c.resultTitle}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[2.75rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
            {nf(r.mid)} {c.grams}
          </span>
          <span className="text-[0.95rem] text-[var(--ink-soft)]">
            {c.rangeNote(nf(r.low), nf(r.high))}
          </span>
        </div>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
          {c.perKgNote(nf(r.perKg[0], 1), nf(r.perKg[1], 1))}
        </p>
        {age >= 65 && (
          <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">{c.olderNote}</p>
        )}

        {/* Разложение по приёмам */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.mealsTitle}
          </p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
            {c.mealsNote(nf(r.meals), nf(r.perMeal))}
          </p>
        </div>

        {/* Чем набрать */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.foodsTitle}
          </p>
          <div className="mt-3 grid gap-2.5">
            {PROTEIN_FOODS.map((f) => (
              <div key={f.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div>
                  <p className="text-[0.88rem]">{c.foods[f.id]}</p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${(f.grams / maxFood) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <span className="font-display text-[1.05rem] font-semibold tabular-nums">
                  {nf(f.grams)} {c.grams}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}
