"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  fiberNeeds,
  FIBER_FOODS,
  EFSA_MINIMUM,
  TYPICAL_INTAKE,
  type Sex,
} from "@/lib/fiber";

/**
 * Калькулятор суточной нормы клетчатки.
 *
 * Считает норму двумя способами — по полу и возрасту (IOM) и по
 * калорийности (14 г/1000 ккал) — и показывает разрыв с тем, сколько
 * клетчатки обычно съедают на деле. Формулы — в src/lib/fiber.ts.
 */

const COPY = {
  ru: {
    sex: "Пол",
    male: "Мужчина",
    female: "Женщина",
    age: "Возраст",
    years: "лет",
    calories: "Калорийность рациона",
    kcal: "ккал",
    resultTitle: "Клетчатки в день",
    grams: "г",
    targetNote: (efsa: string) =>
      `Не ниже минимума EFSA — ${efsa} г/сут. Больше — лучше: снижение риска продолжается примерно до 30 г.`,
    methodsTitle: "Откуда цифра",
    methodAi: "По полу и возрасту (IOM)",
    methodCal: "По калорийности, 14 г на 1000 ккал",
    gapTitle: "Сколько обычно недобирают",
    gapNote: (gap: string, typical: string) =>
      `Средний взрослый съедает около ${typical} г — это примерно вдвое меньше нормы. Ваш разрыв — ${gap} г в день.`,
    gapZero: (typical: string) =>
      `Средний взрослый съедает около ${typical} г клетчатки в день — вдвое меньше нормы. Если вы уже в цели — это редкость и хороший знак.`,
    foodsTitle: "Чем закрыть разрыв",
    foods: {
      beans: "Фасоль варёная, 100 г",
      lentils: "Чечевица варёная, 100 г",
      raspberries: "Малина, 100 г",
      chia: "Семена чиа, 1 ст. л.",
      oats: "Овсяные хлопья, 40 г",
      apple: "Яблоко с кожурой, 1 шт.",
      almonds: "Миндаль, 30 г",
      wholeBread: "Цельнозерновой хлеб, 1 ломоть",
      broccoli: "Брокколи, 100 г",
    } as Record<string, string>,
    tipTitle: "Как добирать без дискомфорта",
    tip:
      "Наращивайте клетчатку постепенно, за 1–2 недели, и пропорционально увеличивайте воду: резкий скачок даёт вздутие и газообразование. Источник тоже важен — цельные продукты, а не только добавки: клетчатка из овощей, бобовых и цельного зерна идёт в комплекте с полифенолами и не вызывает таких симптомов, как изолированные волокна в больших дозах.",
    disclaimer:
      "При синдроме раздражённого кишечника, воспалительных заболеваниях кишечника в обострении, стриктурах и после операций на ЖКТ норма клетчатки и её тип подбираются индивидуально с врачом — общая рекомендация может навредить.",
  },
  en: {
    sex: "Sex",
    male: "Male",
    female: "Female",
    age: "Age",
    years: "years",
    calories: "Daily calories",
    kcal: "kcal",
    resultTitle: "Fiber per day",
    grams: "g",
    targetNote: (efsa: string) =>
      `No lower than the EFSA minimum of ${efsa} g/day. More is better: risk keeps falling up to about 30 g.`,
    methodsTitle: "Where the number comes from",
    methodAi: "By sex and age (IOM)",
    methodCal: "By calories, 14 g per 1000 kcal",
    gapTitle: "How much people typically miss",
    gapNote: (gap: string, typical: string) =>
      `The average adult eats about ${typical} g — roughly half the target. Your gap is ${gap} g a day.`,
    gapZero: (typical: string) =>
      `The average adult eats about ${typical} g of fiber a day — half the target. If you are already there, that is rare and a good sign.`,
    foodsTitle: "What closes the gap",
    foods: {
      beans: "Cooked beans, 100 g",
      lentils: "Cooked lentils, 100 g",
      raspberries: "Raspberries, 100 g",
      chia: "Chia seeds, 1 tbsp",
      oats: "Rolled oats, 40 g",
      apple: "Apple with skin, 1 pc",
      almonds: "Almonds, 30 g",
      wholeBread: "Wholegrain bread, 1 slice",
      broccoli: "Broccoli, 100 g",
    } as Record<string, string>,
    tipTitle: "How to get there without discomfort",
    tip:
      "Increase fiber gradually over 1–2 weeks and raise your water intake alongside it: a sudden jump causes bloating and gas. The source matters too — whole foods, not just supplements: fiber from vegetables, legumes and whole grains comes packaged with polyphenols and causes fewer symptoms than large doses of isolated fiber.",
    disclaimer:
      "In irritable bowel syndrome, active inflammatory bowel disease, strictures or after gastrointestinal surgery, the fiber target and its type are set individually with a doctor — a general recommendation can do harm.",
  },
} as const;

const nf = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export function FiberCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(35);
  const [calories, setCalories] = useState(2200);

  const r = useMemo(() => fiberNeeds({ sex, age, calories }), [sex, age, calories]);

  const methods = [
    { id: "ai", label: c.methodAi, grams: r.aiTarget },
    { id: "cal", label: c.methodCal, grams: r.calorieTarget },
  ];
  const maxMethod = Math.max(...methods.map((m) => m.grams), 1);
  const maxFood = Math.max(...FIBER_FOODS.map((f) => f.grams), 1);

  return (
    <section
      data-accent="moss"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* ── Ввод ─────────────────────────────────────────────── */}
      <div className="grid gap-6 p-5 md:p-7">
        <div className="grid gap-4 sm:grid-cols-3">
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
          <div>
            <label
              htmlFor="fiber-age"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.age}, {c.years}
            </label>
            <input
              id="fiber-age"
              type="number"
              min={16}
              max={100}
              value={age}
              onChange={(e) => setAge(Math.max(16, Math.min(100, Number(e.target.value) || 0)))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
            />
          </div>
          <div>
            <label
              htmlFor="fiber-calories"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.calories}, {c.kcal}
            </label>
            <input
              id="fiber-calories"
              type="number"
              min={1200}
              max={4000}
              step={100}
              value={calories}
              onChange={(e) =>
                setCalories(Math.max(1200, Math.min(4000, Number(e.target.value) || 0)))
              }
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
            />
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
            {nf(r.target)} {c.grams}
          </span>
        </div>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
          {c.targetNote(nf(EFSA_MINIMUM))}
        </p>

        {/* Методы */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.methodsTitle}
          </p>
          <div className="mt-3 grid gap-2.5">
            {methods.map((m) => (
              <div key={m.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div>
                  <p className="text-[0.88rem]">{m.label}</p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${(m.grams / maxMethod) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <span className="font-display text-[1.05rem] font-semibold tabular-nums">
                  {nf(m.grams)} {c.grams}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Разрыв */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.gapTitle}
          </p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
            {r.gap > 0 ? c.gapNote(nf(r.gap), nf(TYPICAL_INTAKE)) : c.gapZero(nf(TYPICAL_INTAKE))}
          </p>
        </div>

        {/* Продукты */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.foodsTitle}
          </p>
          <div className="mt-3 grid gap-2.5">
            {FIBER_FOODS.map((f) => (
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

        <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="font-semibold">💡 {c.tipTitle}</p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">{c.tip}</p>
        </div>

        <p className="mt-5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}
