"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  foxMax,
  heartRateReserve,
  maxHeartRate,
  restingCategory,
  weeklyPlan,
  zoneTable,
  type MaxHrFormula,
  type RestingCategory,
  type Sex,
  type ZoneId,
  type ZoneMethod,
} from "@/lib/heart-rate";

/**
 * Калькулятор пульсовых зон.
 *
 * Считает по резерву пульса (Карвонен), а не по проценту от максимума:
 * иначе у человека с пульсом покоя 45 и у человека с 75 одна и та же
 * «зона 2» означает совершенно разную нагрузку. Переключатель метода
 * оставлен, потому что спортивные часы обычно считают по максимуму,
 * и расхождение стоит видеть, а не гадать о нём.
 *
 * Формулы — в src/lib/heart-rate.ts.
 */

const ZONE_COLORS: Record<ZoneId, string> = {
  z1: "#7aa7c7",
  z2: "#4fae7a",
  z3: "#dcae4a",
  z4: "#d98a52",
  z5: "#c25f6e",
};

const COPY = {
  ru: {
    age: "Возраст",
    years: "лет",
    sex: "Пол",
    male: "Мужчина",
    female: "Женщина",
    rest: "Пульс покоя",
    bpm: "уд/мин",
    restHint:
      "Мерьте утром, не вставая с кровати, три дня подряд и берите среднее. Данные умных часов за ночь тоже подойдут.",
    knownMax: "Знаю свой максимальный пульс",
    maxLabel: "Максимальный пульс",
    formula: "Формула максимума",
    formulas: {
      tanaka: "Tanaka (208 − 0,7 × возраст)",
      gulati: "Gulati, для женщин (206 − 0,88 × возраст)",
      fox: "220 − возраст (устаревшая)",
    },
    method: "Как считать зоны",
    methods: {
      karvonen: "По резерву пульса (Карвонен)",
      "percent-max": "По проценту от максимума",
    },
    methodHint:
      "Карвонен учитывает пульс покоя и потому точнее описывает нагрузку. Часы обычно считают по проценту от максимума — переключите, чтобы сверить цифры с экраном.",
    maxTitle: "Расчётный максимум",
    reserve: "Резерв пульса",
    foxDiff: (n: string) => `Устаревшая формула «220 − возраст» дала бы ${n} уд/мин`,
    restTitle: "Пульс покоя",
    restCategories: {
      athletic: "Как у тренированного выносливостного спортсмена",
      excellent: "Отличный показатель",
      good: "Хороший показатель",
      average: "Средний показатель",
      high: "Высоковат: типично при низкой тренированности, стрессе или недосыпе",
    },
    zonesTitle: "Ваши зоны",
    zoneNames: {
      z1: "Восстановление",
      z2: "Аэробная база",
      z3: "Темповая",
      z4: "Порог",
      z5: "Максимум",
    },
    zoneFeel: {
      z1: "Разговор свободный, дыхание не меняется",
      z2: "Можно говорить фразами; здесь строится выносливость",
      z3: "Говорить трудно, но терпимо — «серая зона»",
      z4: "Только отдельные слова, жжение в мышцах",
      z5: "Говорить невозможно, держится минуты",
    },
    zoneUse: {
      z1: "Заминка, восстановительные дни, ходьба",
      z2: "60–80% всего объёма: длинные лёгкие пробежки и вело",
      z3: "Дозированно: слишком тяжело для объёма, слишком легко для МПК",
      z4: "Интервалы 8–20 минут, темповые отрезки",
      z5: "Короткие интервалы 30 секунд — 4 минуты, поднимает МПК",
    },
    ofMax: "от максимума",
    planTitle: "Как распределить недельный объём",
    planMinutes: "Минут в неделю",
    planHint:
      "Поляризованная модель: около 80% времени — в первых двух зонах, около 20% — в четвёртой и пятой. Самая частая ошибка любителя обратная: почти вся работа приходится на третью зону, где уже тяжело, но ещё не развивающе.",
    minutes: "мин",
    warningTitle: "Когда цифрам верить нельзя",
    warning:
      "Бета-блокаторы, некоторые антиаритмики и препараты от давления снижают и покой, и максимум — расчёт по возрасту становится бессмысленным. То же при мерцательной аритмии и кардиостимуляторе. Если вы в этих группах, зоны определяет врач по нагрузочному тесту.",
    disclaimer:
      "Разброс индивидуального максимума вокруг любой формулы — около ±7 уд/мин, то есть у одного человека из трёх реальный максимум отличается от расчётного больше чем на 7 ударов. Формула задаёт стартовые границы; уточняет их только тест или несколько месяцев наблюдений за собственным пульсом на известных нагрузках.",
  },
  en: {
    age: "Age",
    years: "years",
    sex: "Sex",
    male: "Male",
    female: "Female",
    rest: "Resting heart rate",
    bpm: "bpm",
    restHint:
      "Measure in the morning before getting out of bed, three days running, and take the average. Overnight data from a watch works too.",
    knownMax: "I know my max heart rate",
    maxLabel: "Max heart rate",
    formula: "Max HR formula",
    formulas: {
      tanaka: "Tanaka (208 − 0.7 × age)",
      gulati: "Gulati, for women (206 − 0.88 × age)",
      fox: "220 − age (outdated)",
    },
    method: "Zone method",
    methods: {
      karvonen: "Heart rate reserve (Karvonen)",
      "percent-max": "Percentage of max",
    },
    methodHint:
      "Karvonen accounts for your resting heart rate and describes real effort more accurately. Watches usually use percentage of max — switch to compare with what your screen shows.",
    maxTitle: "Estimated maximum",
    reserve: "Heart rate reserve",
    foxDiff: (n: string) => `The outdated “220 − age” would give ${n} bpm`,
    restTitle: "Resting heart rate",
    restCategories: {
      athletic: "In the range of trained endurance athletes",
      excellent: "Excellent",
      good: "Good",
      average: "Average",
      high: "On the high side: typical with low fitness, stress or short sleep",
    },
    zonesTitle: "Your zones",
    zoneNames: {
      z1: "Recovery",
      z2: "Aerobic base",
      z3: "Tempo",
      z4: "Threshold",
      z5: "Maximal",
    },
    zoneFeel: {
      z1: "Full conversation, breathing barely changes",
      z2: "You can speak in sentences; this is where endurance is built",
      z3: "Talking is hard but possible — the grey zone",
      z4: "Single words only, burning legs",
      z5: "No talking, sustainable for minutes",
    },
    zoneUse: {
      z1: "Cool-downs, recovery days, walking",
      z2: "60–80% of total volume: long easy runs and rides",
      z3: "Use sparingly: too hard for volume, too easy for VO₂max",
      z4: "Intervals of 8–20 minutes, tempo blocks",
      z5: "Short intervals of 30 seconds to 4 minutes, drives VO₂max",
    },
    ofMax: "of max",
    planTitle: "Splitting your weekly volume",
    planMinutes: "Minutes per week",
    planHint:
      "The polarized model: roughly 80% of time in the first two zones, roughly 20% in the fourth and fifth. Most amateurs do the opposite and spend nearly everything in zone 3 — hard enough to tire, not hard enough to develop.",
    minutes: "min",
    warningTitle: "When these numbers do not apply",
    warning:
      "Beta blockers, some antiarrhythmics and blood pressure medication lower both resting and maximum heart rate, which makes any age-based estimate meaningless. The same goes for atrial fibrillation and pacemakers. In those cases zones come from a clinical exercise test, not a formula.",
    disclaimer:
      "Individual maximum scatters around any formula by roughly ±7 bpm, meaning one person in three is more than 7 beats away from their predicted value. A formula sets your starting boundaries; only a test — or months of watching your own heart rate at known efforts — refines them.",
  },
} as const;

const nf = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits });

export function HeartRateZonesCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(35);
  const [rest, setRest] = useState(62);
  const [formula, setFormula] = useState<MaxHrFormula>("tanaka");
  const [method, setMethod] = useState<ZoneMethod>("karvonen");
  const [useKnownMax, setUseKnownMax] = useState(false);
  const [knownMax, setKnownMax] = useState(185);
  const [weekly, setWeekly] = useState(240);

  const r = useMemo(() => {
    const estimated = maxHeartRate(age, sex, formula);
    const hrMax = useKnownMax ? knownMax : estimated;
    // Пульс покоя выше максимума ломает и Карвонена, и здравый смысл
    const hrRest = Math.min(rest, hrMax - 20);

    return {
      hrMax,
      hrRest,
      reserve: heartRateReserve(hrMax, hrRest),
      zones: zoneTable(hrMax, hrRest, method),
      fox: foxMax(age),
      restCategory: restingCategory(rest),
      plan: weeklyPlan(weekly),
    };
  }, [age, sex, rest, formula, method, useKnownMax, knownMax, weekly]);

  const planByZone = Object.fromEntries(r.plan.map((p) => [p.id, p.minutes])) as Record<
    ZoneId,
    number
  >;

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
              htmlFor="hr-age"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.age}, {c.years}
            </label>
            <input
              id="hr-age"
              type="number"
              min={14}
              max={95}
              value={age}
              onChange={(e) => setAge(Math.max(14, Math.min(95, Number(e.target.value) || 0)))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor="hr-rest"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.rest}, {c.bpm}
            </label>
            <input
              id="hr-rest"
              type="number"
              min={30}
              max={110}
              value={rest}
              onChange={(e) => setRest(Math.max(30, Math.min(110, Number(e.target.value) || 0)))}
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

        <p className="-mt-2 text-[0.82rem] leading-relaxed text-[var(--ink-faint)]">{c.restHint}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="hr-formula"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.formula}
            </label>
            <select
              id="hr-formula"
              value={formula}
              onChange={(e) => setFormula(e.target.value as MaxHrFormula)}
              disabled={useKnownMax}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 disabled:opacity-50"
            >
              <option value="tanaka">{c.formulas.tanaka}</option>
              <option value="gulati">{c.formulas.gulati}</option>
              <option value="fox">{c.formulas.fox}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="hr-method"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.method}
            </label>
            <select
              id="hr-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as ZoneMethod)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5"
            >
              <option value="karvonen">{c.methods.karvonen}</option>
              <option value="percent-max">{c.methods["percent-max"]}</option>
            </select>
          </div>
        </div>

        <p className="-mt-2 text-[0.82rem] leading-relaxed text-[var(--ink-faint)]">
          {c.methodHint}
        </p>

        <div className="rounded-xl border border-dashed border-[var(--line)] p-4">
          <label className="flex items-center gap-2.5 text-[0.92rem] font-semibold">
            <input
              type="checkbox"
              checked={useKnownMax}
              onChange={(e) => setUseKnownMax(e.target.checked)}
              className="size-4 accent-[var(--brand)]"
            />
            {c.knownMax}
          </label>
          {useKnownMax && (
            <div className="mt-3">
              <label htmlFor="hr-known" className="block text-[0.85rem] text-[var(--ink-soft)]">
                {c.maxLabel}, {c.bpm}
              </label>
              <input
                id="hr-known"
                type="number"
                min={120}
                max={230}
                value={knownMax}
                onChange={(e) =>
                  setKnownMax(Math.max(120, Math.min(230, Number(e.target.value) || 0)))
                }
                className="mt-1.5 w-36 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 tabular-nums"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────── */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {c.maxTitle}
            </p>
            <p className="mt-1.5 font-display text-[2.5rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
              {nf(r.hrMax)}
            </p>
            <p className="mt-1 text-[0.82rem] text-[var(--ink-faint)]">{c.bpm}</p>
          </div>
          <div>
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {c.reserve}
            </p>
            <p className="mt-1.5 font-display text-[2.5rem] font-semibold leading-none tabular-nums">
              {nf(r.reserve)}
            </p>
            <p className="mt-1 text-[0.82rem] text-[var(--ink-faint)]">
              {nf(r.hrMax)} − {nf(r.hrRest)}
            </p>
          </div>
          <div>
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {c.restTitle}
            </p>
            <p className="mt-1.5 font-display text-[2.5rem] font-semibold leading-none tabular-nums">
              {nf(rest)}
            </p>
            <p className="mt-1 text-[0.82rem] leading-snug text-[var(--ink-soft)]">
              {c.restCategories[r.restCategory as RestingCategory]}
            </p>
          </div>
        </div>

        {formula !== "fox" && !useKnownMax && (
          <p className="mt-4 text-[0.85rem] text-[var(--ink-faint)]">{c.foxDiff(nf(r.fox))}</p>
        )}

        {/* Таблица зон */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.zonesTitle}
          </p>
          <div className="mt-3 grid gap-2.5">
            {r.zones.map((z) => (
              <div
                key={z.id}
                className="grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block size-3.5 shrink-0 rounded-full"
                    style={{ background: ZONE_COLORS[z.id] }}
                    aria-hidden="true"
                  />
                  <span className="font-display text-[1.35rem] font-semibold tabular-nums">
                    {nf(z.from)}–{nf(z.to)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">
                    {z.id.toUpperCase()} · {c.zoneNames[z.id]}
                  </p>
                  <p className="text-[0.86rem] leading-snug text-[var(--ink-soft)]">
                    {c.zoneFeel[z.id]}. {c.zoneUse[z.id]}
                  </p>
                </div>
                <p className="text-[0.78rem] tabular-nums text-[var(--ink-faint)] sm:text-right">
                  {nf(z.shareOfMax.from * 100)}–{nf(z.shareOfMax.to * 100)}%
                  <br className="hidden sm:block" /> {c.ofMax}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Недельный план */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.planTitle}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <label htmlFor="hr-weekly" className="text-[0.88rem] text-[var(--ink-soft)]">
              {c.planMinutes}
            </label>
            <input
              id="hr-weekly"
              type="number"
              min={60}
              max={1200}
              step={30}
              value={weekly}
              onChange={(e) => setWeekly(Math.max(60, Math.min(1200, Number(e.target.value) || 0)))}
              className="w-28 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 tabular-nums"
            />
          </div>
          <div className="mt-3 flex h-8 overflow-hidden rounded-lg" aria-hidden="true">
            {r.plan.map((p) => (
              <div
                key={p.id}
                style={{ width: `${(p.minutes / Math.max(1, weekly)) * 100}%`, background: ZONE_COLORS[p.id] }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.82rem] tabular-nums text-[var(--ink-soft)]">
            {r.zones.map((z) => (
              <span key={z.id}>
                <span
                  className="mr-1.5 inline-block size-2.5 rounded-full align-middle"
                  style={{ background: ZONE_COLORS[z.id] }}
                  aria-hidden="true"
                />
                {z.id.toUpperCase()} — {planByZone[z.id]} {c.minutes}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[0.85rem] leading-relaxed text-[var(--ink-soft)]">{c.planHint}</p>
        </div>

        {/* Предупреждение */}
        <div className="mt-6 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
          <p className="font-semibold">⚠️ {c.warningTitle}</p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">{c.warning}</p>
        </div>

        <p className="mt-5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}
