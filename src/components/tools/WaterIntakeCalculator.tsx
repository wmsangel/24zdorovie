"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  hydrationNeeds,
  IOM_TOTAL,
  MAX_HOURLY_INTAKE,
  URINE_SCALE,
  type Climate,
  type Intensity,
  type Sex,
} from "@/lib/hydration";

/**
 * Калькулятор нормы воды.
 *
 * Спорный по сути инструмент, и это отражено в интерфейсе: рядом
 * с результатом всегда стоит норма EFSA и напоминание, что жажда
 * регулирует поступление точнее любой формулы. Задача калькулятора —
 * не назначить литраж, а показать порядок величины и то, насколько
 * сильно его меняют тренировка и жара.
 *
 * Формулы — в src/lib/hydration.ts.
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
    exercise: "Нагрузка в день",
    min: "мин",
    intensity: "Интенсивность",
    intensities: {
      light: "Лёгкая — ходьба, йога",
      moderate: "Средняя — бег, зал, велосипед",
      intense: "Высокая — жара, соревнования, долгое кардио",
    },
    climate: "Климат и условия",
    climates: {
      cool: "Прохладно, до 15 °C",
      temperate: "Умеренно, 15–25 °C",
      hot: "Жарко, 25–32 °C",
      veryHot: "Очень жарко или влажно, выше 32 °C",
    },
    waking: "Часов бодрствования",
    stage: "Особый период",
    stages: {
      none: "Нет",
      pregnant: "Беременность",
      breastfeeding: "Грудное вскармливание",
    },
    resultTitle: "Выпить за день",
    litres: "л",
    ml: "мл",
    limitNote: (ml: string) => `${ml} мл/ч — ориентир предела выведения.`,
    glasses: (n: string) => `примерно ${n} стакана по 250 мл`,
    totalNote: (total: string, food: string) =>
      `Всего воды в сутки — ${total} л, из них около ${food} л придёт с едой: овощи, фрукты, супы, каши.`,
    breakdownTitle: "Из чего складывается",
    breakdown: {
      base: "База по массе тела",
      exercise: "Потери с потом на тренировке",
      climate: "Надбавка на жару",
      stage: "Беременность или лактация",
    },
    perHourTitle: "В течение дня",
    perHour: (ml: string, hours: string) =>
      `Около ${ml} мл в час бодрствования — это примерно стакан каждые полтора часа за ${hours} ч.`,
    tooFast:
      "Такой темп близок к пределу, с которым почки выводят жидкость (около 0,8 л в час). Пить большими объёмами разом не нужно — распределяйте равномерно.",
    referenceTitle: "Для сравнения",
    reference: (efsa: string, iom: string) =>
      `EFSA рекомендует ${efsa} л всего воды в сутки для вашего пола, американский Institute of Medicine — ${iom} л. Обе цифры получены как медиана того, сколько пьют здоровые люди, а не как измеренная потребность организма. Расхождение между ними и есть честная мера точности любой «нормы воды».`,
    farOff:
      "Ваш расчёт заметно разошёлся с рекомендацией EFSA. Обычно это значит, что введена очень большая нагрузка или нетипичный вес — цифру стоит воспринимать как верхнюю оценку.",
    urineTitle: "Проверка, которая работает без калькулятора",
    urineHint:
      "Цвет мочи коррелирует с её концентрацией лучше любых ощущений, кроме жажды. Оттенки слева — норма, справа — дефицит. Утренняя порция всегда темнее, и это не показатель.",
    urineStatuses: {
      hydrated: "Норма",
      mild: "Стоит выпить воды",
      dehydrated: "Выраженный дефицит",
    },
    mythTitle: "Что не считается «обезвоживанием»",
    myth:
      "Кофе и чай входят в дневной баланс: мочегонный эффект кофеина в привычных дозах не перекрывает объём выпитого. Правило «восемь стаканов» не имеет источника в исследованиях. А вот жажда — рабочий сигнал: у здорового взрослого с доступом к воде она срабатывает раньше, чем наступает значимый дефицит.",
    disclaimer:
      "Расчёт не подходит при сердечной и почечной недостаточности, приёме диуретиков и состояниях, где объём жидкости ограничивают: там норму назначает врач, и она может быть заметно ниже. Слишком много воды тоже опасно — гипонатриемия развивается при питье, устойчиво превышающем скорость выведения.",
  },
  en: {
    weight: "Weight",
    kg: "kg",
    age: "Age",
    years: "years",
    sex: "Sex",
    male: "Male",
    female: "Female",
    exercise: "Exercise per day",
    min: "min",
    intensity: "Intensity",
    intensities: {
      light: "Light — walking, yoga",
      moderate: "Moderate — running, gym, cycling",
      intense: "Hard — heat, racing, long cardio",
    },
    climate: "Climate and conditions",
    climates: {
      cool: "Cool, under 15 °C",
      temperate: "Temperate, 15–25 °C",
      hot: "Hot, 25–32 °C",
      veryHot: "Very hot or humid, above 32 °C",
    },
    waking: "Waking hours",
    stage: "Special period",
    stages: {
      none: "None",
      pregnant: "Pregnancy",
      breastfeeding: "Breastfeeding",
    },
    resultTitle: "To drink per day",
    litres: "L",
    ml: "ml",
    limitNote: (ml: string) => `${ml} ml/h is the reference ceiling for clearance.`,
    glasses: (n: string) => `roughly ${n} glasses of 250 ml`,
    totalNote: (total: string, food: string) =>
      `Total water for the day is ${total} L, of which about ${food} L arrives in food: vegetables, fruit, soups, porridge.`,
    breakdownTitle: "Where it comes from",
    breakdown: {
      base: "Baseline for your body mass",
      exercise: "Sweat losses in training",
      climate: "Heat allowance",
      stage: "Pregnancy or lactation",
    },
    perHourTitle: "Across the day",
    perHour: (ml: string, hours: string) =>
      `About ${ml} ml per waking hour — roughly a glass every ninety minutes across ${hours} h.`,
    tooFast:
      "That pace approaches the rate at which kidneys can clear fluid (around 0.8 L per hour). There is no need to drink it in large single servings — spread it out.",
    referenceTitle: "For comparison",
    reference: (efsa: string, iom: string) =>
      `EFSA recommends ${efsa} L of total water a day for your sex; the US Institute of Medicine says ${iom} L. Both figures are medians of what healthy people actually drink, not a measured requirement. The gap between them is the honest measure of how precise any “water norm” can be.`,
    farOff:
      "Your figure has drifted well away from the EFSA reference. That usually means a very large training load or an unusual body mass was entered — treat the number as an upper estimate.",
    urineTitle: "The check that needs no calculator",
    urineHint:
      "Urine colour tracks concentration better than any sensation except thirst. Shades on the left are normal, on the right show a deficit. The first morning sample is always darker, and that means nothing.",
    urineStatuses: {
      hydrated: "Fine",
      mild: "Have a drink",
      dehydrated: "Clear deficit",
    },
    mythTitle: "What does not count as dehydration",
    myth:
      "Coffee and tea count towards your daily balance: at habitual doses the diuretic effect of caffeine does not exceed the volume you drank. The “eight glasses” rule has no source in the research literature. Thirst, on the other hand, works: in a healthy adult with access to water it fires well before any meaningful deficit.",
    disclaimer:
      "This calculation does not apply in heart or kidney failure, on diuretics, or in any condition where fluid is deliberately restricted — there the target comes from a doctor and can be considerably lower. Too much water is dangerous too: hyponatraemia develops when intake persistently outruns the kidneys.",
  },
} as const;

const nf = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function WaterIntakeCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [sex, setSex] = useState<Sex>("male");
  const [weight, setWeight] = useState(75);
  const [age, setAge] = useState(35);
  const [exerciseMinutes, setExerciseMinutes] = useState(45);
  const [intensity, setIntensity] = useState<Intensity>("moderate");
  const [climate, setClimate] = useState<Climate>("temperate");
  const [wakingHours, setWakingHours] = useState(16);
  const [stage, setStage] = useState<"none" | "pregnant" | "breastfeeding">("none");

  const r = useMemo(
    () =>
      hydrationNeeds({
        sex,
        weight,
        age,
        exerciseMinutes,
        intensity,
        climate,
        wakingHours,
        stage,
      }),
    [sex, weight, age, exerciseMinutes, intensity, climate, wakingHours, stage]
  );

  const maxBar = Math.max(...r.breakdown.map((b) => b.ml), 1);

  return (
    <section
      data-accent="ocean"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* ── Ввод ─────────────────────────────────────────────── */}
      <div className="grid gap-6 p-5 md:p-7">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="water-weight"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.weight}, {c.kg}
            </label>
            <input
              id="water-weight"
              type="number"
              min={30}
              max={250}
              value={weight}
              onChange={(e) => setWeight(Math.max(30, Math.min(250, Number(e.target.value) || 0)))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
            />
          </div>
          <div>
            <label
              htmlFor="water-age"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.age}, {c.years}
            </label>
            <input
              id="water-age"
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

        <div>
          <label
            htmlFor="water-exercise"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.exercise}: {exerciseMinutes} {c.min}
          </label>
          <input
            id="water-exercise"
            type="range"
            min={0}
            max={240}
            step={15}
            value={exerciseMinutes}
            onChange={(e) => setExerciseMinutes(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--brand)]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="water-intensity"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.intensity}
            </label>
            <select
              id="water-intensity"
              value={intensity}
              onChange={(e) => setIntensity(e.target.value as Intensity)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5"
            >
              {(["light", "moderate", "intense"] as Intensity[]).map((k) => (
                <option key={k} value={k}>
                  {c.intensities[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="water-climate"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.climate}
            </label>
            <select
              id="water-climate"
              value={climate}
              onChange={(e) => setClimate(e.target.value as Climate)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5"
            >
              {(["cool", "temperate", "hot", "veryHot"] as Climate[]).map((k) => (
                <option key={k} value={k}>
                  {c.climates[k]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="water-waking"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.waking}
            </label>
            <input
              id="water-waking"
              type="number"
              min={8}
              max={22}
              value={wakingHours}
              onChange={(e) =>
                setWakingHours(Math.max(8, Math.min(22, Number(e.target.value) || 0)))
              }
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 tabular-nums"
            />
          </div>
          {sex === "female" && (
            <div>
              <label
                htmlFor="water-stage"
                className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
              >
                {c.stage}
              </label>
              <select
                id="water-stage"
                value={stage}
                onChange={(e) =>
                  setStage(e.target.value as "none" | "pregnant" | "breastfeeding")
                }
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5"
              >
                <option value="none">{c.stages.none}</option>
                <option value="pregnant">{c.stages.pregnant}</option>
                <option value="breastfeeding">{c.stages.breastfeeding}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────── */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {c.resultTitle}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[2.75rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
            {nf(r.fromDrinks / 1000, 1)} {c.litres}
          </span>
          <span className="text-[0.95rem] text-[var(--ink-soft)]">{c.glasses(nf(r.glasses))}</span>
        </div>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
          {c.totalNote(nf(r.total / 1000, 1), nf(r.fromFood / 1000, 1))}
        </p>

        {/* Разбивка */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.breakdownTitle}
          </p>
          <div className="mt-3 grid gap-2.5">
            {r.breakdown.map((b) => (
              <div key={b.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div>
                  <p className="text-[0.88rem]">{c.breakdown[b.id]}</p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${(b.ml / maxBar) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <span className="font-display text-[1.05rem] font-semibold tabular-nums">
                  {nf(b.ml)} {c.ml}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Темп */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.perHourTitle}
          </p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
            {c.perHour(nf(r.perHour), nf(wakingHours))}
          </p>
          {r.exceedsHourlyLimit && (
            <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">{c.tooFast}</p>
          )}
        </div>

        {/* Шкала мочи */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.urineTitle}
          </p>
          <div className="mt-3 flex gap-1.5">
            {URINE_SCALE.map((u) => (
              <div key={u.id} className="flex-1">
                <div
                  className="h-9 rounded-md border border-black/10"
                  style={{ background: u.hex }}
                  title={c.urineStatuses[u.status]}
                />
                <p className="mt-1 text-center text-[0.7rem] tabular-nums text-[var(--ink-faint)]">
                  {u.id}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-[var(--ink-soft)]">{c.urineHint}</p>
        </div>

        {/* Сравнение с нормами */}
        <div className="mt-6 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
          <p className="font-semibold">📐 {c.referenceTitle}</p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
            {c.reference(nf(r.reference / 1000, 1), nf(IOM_TOTAL[sex] / 1000, 1))}
          </p>
          {r.farFromReference && (
            <p className="mt-2.5 text-[0.88rem] leading-relaxed text-[var(--ink-faint)]">
              {c.farOff}
            </p>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="font-semibold">💡 {c.mythTitle}</p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">{c.myth}</p>
        </div>

        <p className="mt-5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">
          {c.disclaimer} {c.limitNote(nf(MAX_HOURLY_INTAKE))}
        </p>
      </div>
    </section>
  );
}
