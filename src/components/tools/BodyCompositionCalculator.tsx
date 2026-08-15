"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  assessComposition,
  type BmiCategory,
  type BmiScale,
  type BodyFatCategory,
  type RiskLevel,
  type Sex,
  type WhtrCategory,
} from "@/lib/body-composition";

/**
 * Калькулятор ИМТ и состава тела.
 *
 * Отличие от типового «калькулятора ИМТ» в том, что ИМТ здесь не финальный
 * ответ, а первый из четырёх. Как только пользователь вводит окружность
 * талии, приоритет вердикта переходит к ней: висцеральный жир связан
 * с риском сильнее, чем общая масса, и именно поэтому ИМТ ошибается
 * на мускулистых и на «худых снаружи, жирных внутри».
 *
 * Формулы — в src/lib/body-composition.ts.
 */

/** Отметки для линейки ИМТ; шкала обрезана снизу и сверху ради читаемости */
const SCALE_MIN = 15;
const SCALE_MAX = 40;

const COPY = {
  ru: {
    sex: "Пол",
    male: "Мужчина",
    female: "Женщина",
    age: "Возраст",
    years: "лет",
    height: "Рост",
    weight: "Вес",
    cm: "см",
    kg: "кг",
    scale: "Пороговая шкала",
    scaleOptions: {
      standard: "Стандартная (ВОЗ)",
      asian: "Азиатская (ВОЗ, 2004)",
    },
    scaleHint:
      "Для выходцев из Южной и Восточной Азии избыточная масса начинается с ИМТ 23: при том же индексе доля жира и риск диабета выше.",
    optional: "Обхваты — необязательно, но именно они решают",
    optionalHint:
      "Мерьте утром натощак, лентой без натяжения. Талия — на уровне пупка, бёдра — по самой широкой точке, шея — под кадыком.",
    waist: "Талия",
    hip: "Бёдра",
    neck: "Шея",
    bmiTitle: "Индекс массы тела",
    categories: {
      underweight: "Дефицит массы",
      normal: "Норма",
      overweight: "Избыточная масса",
      obese1: "Ожирение I степени",
      obese2: "Ожирение II степени",
      obese3: "Ожирение III степени",
    },
    healthyRange: (min: string, max: string) => `Норма для вашего роста — ${min}–${max} кг`,
    excess: (kg: string) => `Это на ${kg} кг выше верхней границы`,
    below: (kg: string) => `До нижней границы не хватает ${kg} кг`,
    inRange: "Вы внутри этого диапазона",
    waistBlock: "Что говорит талия",
    whtr: "Талия к росту",
    whtrHint: "Талия должна быть меньше половины роста",
    whtrCategories: {
      low: "Ниже типичного — проверьте замер и вес",
      healthy: "Здоровый диапазон",
      increased: "Повышенный риск",
      high: "Высокий риск",
    },
    waistLabel: "Окружность талии",
    whr: "Талия к бёдрам",
    risk: {
      healthy: "В норме",
      increased: "Повышен",
      high: "Высокий",
    },
    fatTitle: "Доля жира по обхватам",
    fatCategories: {
      essential: "Ниже здорового минимума",
      athletic: "Спортивный уровень",
      fitness: "Хорошая форма",
      average: "Средний уровень",
      obese: "Уровень ожирения",
    },
    ffmi: "Индекс сухой массы (FFMI)",
    ffmiHint:
      "Сколько под жиром мышц. 22–23 у мужчин и 18–19 у женщин — верхняя граница достижимого без фармподдержки.",
    fatMissing:
      "Введите шею и талию (женщинам — ещё бёдра), чтобы оценить долю жира по методу ВМФ США.",
    verdictTitle: "Итог",
    verdicts: {
      healthy:
        "Показатели в здоровом диапазоне. Если вес стабилен и талия не растёт год от года — считать что-либо дальше незачем.",
      increased:
        "Часть показателей вышла за здоровый диапазон. Это ещё не диагноз, но повод посмотреть на давление, глюкозу и липидограмму на ближайшем чекапе.",
      high:
        "Показатели указывают на существенно повышенный кардиометаболический риск. Разумный следующий шаг — не диета из интернета, а анализы и разговор с врачом.",
    },
    waistBeatsBmi:
      "Вердикт построен по талии, а не по ИМТ: окружность талии точнее отражает висцеральный жир — тот самый, который связан с диабетом и сердечно-сосудистыми событиями.",
    disclaimer:
      "ИМТ — популяционный показатель. У мускулистых людей он завышает риск, у пожилых и малоподвижных — занижает: масса та же, а мышц меньше. Ни один из этих индексов не ставит диагноз и не заменяет осмотр.",
  },
  en: {
    sex: "Sex",
    male: "Male",
    female: "Female",
    age: "Age",
    years: "years",
    height: "Height",
    weight: "Weight",
    cm: "cm",
    kg: "kg",
    scale: "Cut-off scale",
    scaleOptions: {
      standard: "Standard (WHO)",
      asian: "Asian (WHO, 2004)",
    },
    scaleHint:
      "For people of South and East Asian descent overweight starts at a BMI of 23: at the same index, body fat and diabetes risk run higher.",
    optional: "Circumferences — optional, but they decide the verdict",
    optionalHint:
      "Measure in the morning, before eating, with the tape snug but not tight. Waist at the navel, hips at the widest point, neck just below the larynx.",
    waist: "Waist",
    hip: "Hips",
    neck: "Neck",
    bmiTitle: "Body mass index",
    categories: {
      underweight: "Underweight",
      normal: "Healthy weight",
      overweight: "Overweight",
      obese1: "Obesity class I",
      obese2: "Obesity class II",
      obese3: "Obesity class III",
    },
    healthyRange: (min: string, max: string) => `Healthy range for your height: ${min}–${max} kg`,
    excess: (kg: string) => `That is ${kg} kg above the upper limit`,
    below: (kg: string) => `You are ${kg} kg below the lower limit`,
    inRange: "You are inside that range",
    waistBlock: "What your waist says",
    whtr: "Waist to height",
    whtrHint: "Keep your waist under half your height",
    whtrCategories: {
      low: "Below typical — check the measurement and your weight",
      healthy: "Healthy range",
      increased: "Increased risk",
      high: "High risk",
    },
    waistLabel: "Waist circumference",
    whr: "Waist to hip",
    risk: {
      healthy: "Healthy",
      increased: "Increased",
      high: "High",
    },
    fatTitle: "Body fat from circumferences",
    fatCategories: {
      essential: "Below the healthy minimum",
      athletic: "Athletic",
      fitness: "Fit",
      average: "Average",
      obese: "Obese range",
    },
    ffmi: "Fat-free mass index (FFMI)",
    ffmiHint:
      "How much muscle sits under the fat. 22–23 in men and 18–19 in women is the drug-free ceiling.",
    fatMissing:
      "Add your neck and waist (and hips, for women) to estimate body fat with the US Navy method.",
    verdictTitle: "Bottom line",
    verdicts: {
      healthy:
        "Everything sits in the healthy range. If your weight is stable and your waist is not creeping up year on year, there is nothing else to calculate.",
      increased:
        "Some measures are outside the healthy range. Not a diagnosis, but a reason to check blood pressure, glucose and a lipid panel at your next check-up.",
      high:
        "These numbers point to a materially raised cardiometabolic risk. The sensible next step is bloodwork and a conversation with a doctor, not a diet found online.",
    },
    waistBeatsBmi:
      "This verdict follows your waist rather than your BMI: waist circumference tracks visceral fat — the kind linked to diabetes and cardiovascular events — far more closely.",
    disclaimer:
      "BMI is a population statistic. It overstates risk in muscular people and understates it in older, sedentary ones: same mass, less muscle. None of these indices diagnose anything or replace an examination.",
  },
} as const;

const nf = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Число из поля ввода; пустая строка означает «не заполнено», а не ноль */
function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const RISK_ACCENT: Record<RiskLevel, string> = {
  healthy: "leaf",
  increased: "amber",
  high: "berry",
};

export function BodyCompositionCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(35);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(78);
  const [scale, setScale] = useState<BmiScale>("standard");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [neck, setNeck] = useState("");

  const r = useMemo(
    () =>
      assessComposition({
        sex,
        weight,
        height,
        age,
        scale,
        waist: toNumber(waist),
        hip: toNumber(hip),
        neck: toNumber(neck),
      }),
    [sex, weight, height, age, scale, waist, hip, neck]
  );

  /** Позиция маркера на линейке ИМТ, % */
  const markerLeft = Math.max(
    0,
    Math.min(100, ((r.bmi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100)
  );

  /** Цветные сегменты линейки: границы берутся из выбранной шкалы порогов */
  const segments = useMemo(() => {
    const overweight = scale === "asian" ? 23 : 25;
    const obese1 = scale === "asian" ? 27.5 : 30;
    const obese2 = scale === "asian" ? 32.5 : 35;
    const bounds = [SCALE_MIN, 18.5, overweight, obese1, obese2, SCALE_MAX];
    const colors = ["#7aa7c7", "#4fae7a", "#dcae4a", "#d98a52", "#c25f6e"];

    return colors.map((color, i) => ({
      color,
      label: nf(bounds[i], bounds[i] % 1 === 0 ? 0 : 1),
      width: ((bounds[i + 1] - bounds[i]) / (SCALE_MAX - SCALE_MIN)) * 100,
    }));
  }, [scale]);

  const belowRange = weight < r.healthyWeight.min ? r.healthyWeight.min - weight : 0;

  return (
    <section
      data-accent={RISK_ACCENT[r.overall]}
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* ── Ввод ─────────────────────────────────────────────── */}
      <div className="grid gap-6 p-5 md:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
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
                  className={`flex-1 rounded-xl border px-3.5 py-2.5 text-[0.9rem] font-semibold transition-colors ${
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
              htmlFor="bc-age"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.age}
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="bc-age"
                type="number"
                min={16}
                max={100}
                value={age}
                onChange={(e) => setAge(Math.max(16, Math.min(100, Number(e.target.value) || 0)))}
                className="w-24 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 tabular-nums"
              />
              <span className="text-[var(--ink-soft)]">{c.years}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="bc-height"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.height}, {c.cm}
            </label>
            <input
              id="bc-height"
              type="number"
              min={120}
              max={230}
              value={height}
              onChange={(e) => setHeight(Math.max(120, Math.min(230, Number(e.target.value) || 0)))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
            />
          </div>
          <div>
            <label
              htmlFor="bc-weight"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.weight}, {c.kg}
            </label>
            <input
              id="bc-weight"
              type="number"
              min={30}
              max={300}
              step={0.5}
              value={weight}
              onChange={(e) => setWeight(Math.max(30, Math.min(300, Number(e.target.value) || 0)))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="bc-scale"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.scale}
          </label>
          <select
            id="bc-scale"
            value={scale}
            onChange={(e) => setScale(e.target.value as BmiScale)}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5"
          >
            <option value="standard">{c.scaleOptions.standard}</option>
            <option value="asian">{c.scaleOptions.asian}</option>
          </select>
          <p className="mt-2 text-[0.82rem] leading-relaxed text-[var(--ink-faint)]">
            {c.scaleHint}
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-[var(--line)] p-4">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.optional}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { id: "waist", label: c.waist, value: waist, set: setWaist },
              { id: "hip", label: c.hip, value: hip, set: setHip },
              { id: "neck", label: c.neck, value: neck, set: setNeck },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={`bc-${f.id}`} className="block text-[0.85rem] text-[var(--ink-soft)]">
                  {f.label}, {c.cm}
                </label>
                <input
                  id={`bc-${f.id}`}
                  type="number"
                  min={20}
                  max={200}
                  step={0.5}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 tabular-nums"
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.82rem] leading-relaxed text-[var(--ink-faint)]">
            {c.optionalHint}
          </p>
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────── */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {c.bmiTitle}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[2.75rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
            {nf(r.bmi, 1)}
          </span>
          <span className="text-[1.05rem] font-semibold">{c.categories[r.bmiCategory as BmiCategory]}</span>
        </div>

        {/* Линейка ИМТ: сегменты считаются от порогов выбранной шкалы */}
        <div className="mt-5">
          <div className="flex h-3 overflow-hidden rounded-full" aria-hidden="true">
            {segments.map((s) => (
              <div key={s.label} style={{ width: `${s.width}%`, background: s.color }} />
            ))}
          </div>
          <div className="relative h-4" aria-hidden="true">
            <span
              className="absolute top-0 -translate-x-1/2 text-[0.8rem] font-bold text-[var(--ink)]"
              style={{ left: `${markerLeft}%` }}
            >
              ▲
            </span>
          </div>
          <div className="flex justify-between text-[0.72rem] tabular-nums text-[var(--ink-faint)]">
            <span>{SCALE_MIN}</span>
            {segments.slice(1).map((s) => (
              <span key={s.label}>{s.label}</span>
            ))}
            <span>{SCALE_MAX}+</span>
          </div>
        </div>

        <p className="mt-5 text-[0.98rem] leading-relaxed">
          <span className="font-semibold">
            {c.healthyRange(nf(r.healthyWeight.min, 1), nf(r.healthyWeight.max, 1))}.{" "}
          </span>
          <span className="text-[var(--ink-soft)]">
            {r.excessWeight > 0
              ? c.excess(nf(r.excessWeight, 1))
              : belowRange > 0
                ? c.below(nf(belowRange, 1))
                : c.inRange}
          </span>
        </p>

        {/* Обхваты */}
        {(r.whtr !== null || r.waistRisk !== null) && (
          <div className="mt-7">
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {c.waistBlock}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {r.whtr !== null && (
                <Metric
                  label={c.whtr}
                  value={nf(r.whtr, 2)}
                  note={c.whtrCategories[r.whtrCategory as WhtrCategory]}
                />
              )}
              {r.waistRisk && (
                <Metric
                  label={c.waistLabel}
                  value={`${nf(toNumber(waist) ?? 0, 0)} ${c.cm}`}
                  note={c.risk[r.waistRisk]}
                />
              )}
              {r.whr !== null && r.whrRisk && (
                <Metric label={c.whr} value={nf(r.whr, 2)} note={c.risk[r.whrRisk]} />
              )}
            </div>
            <p className="mt-2.5 text-[0.82rem] text-[var(--ink-faint)]">{c.whtrHint}</p>
          </div>
        )}

        {/* Состав тела */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.fatTitle}
          </p>
          {r.bodyFat === null ? (
            <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">
              {c.fatMissing}
            </p>
          ) : (
            <>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
                <span className="font-display text-[2rem] font-semibold leading-none tabular-nums">
                  {nf(r.bodyFat, 1)}%
                </span>
                <span className="font-semibold">
                  {c.fatCategories[r.bodyFatCategory as BodyFatCategory]}
                </span>
              </div>
              {r.ffmi !== null && (
                <p className="mt-3 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">
                  <span className="font-semibold">
                    {c.ffmi}: {nf(r.ffmi, 1)}.{" "}
                  </span>
                  {c.ffmiHint}
                </p>
              )}
            </>
          )}
        </div>

        {/* Вердикт */}
        <div className="mt-6 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
          <p className="font-semibold">📋 {c.verdictTitle}</p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
            {c.verdicts[r.overall]}
          </p>
          {/* Талия измерена — значит, вердикт построен по ней, а не по ИМТ */}
          {r.waistRisk !== null && (
            <p className="mt-2.5 text-[0.88rem] leading-relaxed text-[var(--ink-faint)]">
              {c.waistBeatsBmi}
            </p>
          )}
        </div>

        <p className="mt-5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
      <p className="text-[0.78rem] text-[var(--ink-faint)]">{label}</p>
      <p className="mt-1 font-display text-[1.5rem] font-semibold leading-none tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 text-[0.82rem] text-[var(--ink-soft)]">{note}</p>
    </div>
  );
}
