"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import { plural } from "@/lib/i18n";
import {
  DROP_IU,
  FOOD_SOURCES,
  IOM_SUFFICIENT_NMOL,
  THRESHOLDS,
  TARGET_NMOL,
  UL_DAILY,
  toNgml,
  toNmol,
  vitaminDPlan,
  type Unit,
  type VitaminDStatus,
} from "@/lib/vitamin-d";

/**
 * Калькулятор витамина D.
 *
 * Отвечает на два разных вопроса и намеренно их разделяет: «сколько
 * принимать, чтобы не было дефицита» — и «как выйти из дефицита, который
 * уже подтверждён анализом». Второй режим включается только при введённом
 * 25(OH)D: назначать насыщающую дозу вслепую нельзя.
 *
 * Формулы и пороги — в src/lib/vitamin-d.ts.
 */

const COPY = {
  ru: {
    weight: "Вес",
    kg: "кг",
    height: "Рост",
    cm: "см",
    age: "Возраст",
    years: "лет",
    hasTest: "Знаю свой 25(OH)D",
    hasTestHint: "Есть анализ крови на 25-гидроксивитамин D",
    level: "Уровень 25(OH)D",
    units: { ngml: "нг/мл", nmol: "нмоль/л" },
    currentDose: "Уже принимаю сейчас",
    iuDay: "МЕ/сут",
    currentDoseHint:
      "Если добавка уже принимается, её вклад вычитается: иначе доза назначится поверх работающей.",
    statusTitle: "Ваш уровень",
    statuses: {
      severe: "Тяжёлый дефицит",
      deficient: "Дефицит",
      insufficient: "Недостаточность",
      target: "Целевой диапазон",
      above: "Выше целевого",
      toxic: "Потенциально токсично",
    } as Record<VitaminDStatus, string>,
    statusNotes: {
      severe:
        "Такой уровень корректируют под наблюдением врача: нужны кальций, фосфор и паратгормон в анализах, а иногда и поиск причины — нарушение всасывания, болезни почек или печени.",
      deficient:
        "Подтверждённый дефицит. Схема ниже рассчитана по массе тела; через 8–12 недель нужен контрольный анализ, без него высокие дозы не продолжают.",
      insufficient:
        "Промежуточная зона: для костей этого уже достаточно по критериям IOM, но ниже цели, к которой ведут клинические рекомендации. Насыщающая доза здесь не нужна — достаточно поддерживающей.",
      target:
        "Уровень в целевом диапазоне. Задача теперь не поднять его, а удержать: без приёма он вернётся к исходному за пару месяцев.",
      above:
        "Выше целевого диапазона. Дополнительной пользы на этом уровне не показано, дозу стоит снизить.",
      toxic:
        "Такие значения связаны с риском гиперкальциемии. Приём нужно прекратить и обратиться к врачу — измеряют кальций крови и функцию почек.",
    } as Record<VitaminDStatus, string>,
    scaleTarget: "цель",
    scaleIom: "минимум IOM",
    maintenanceTitle: "Поддерживающая доза",
    perDay: "МЕ в сутки",
    dropWords: ["капля", "капли", "капель"] as [string, string, string],
    drops: (n: string, word: string) => `${n} ${word} масляного раствора по 500 МЕ`,
    maintenanceFromLevel:
      "Доза рассчитана так, чтобы вывести уровень к 75 нмоль/л (30 нг/мл) и удерживать его.",
    maintenancePreventive:
      "Анализа нет, поэтому это профилактическая доза: она покрывает потребность большинства взрослых и не требует лабораторного контроля.",
    bodyNote: (factor: string, bmi: string) =>
      `Доза увеличена в ${factor} раза с поправкой на ИМТ ${bmi}: витамин D распределяется в жировой ткани, и при одной и той же дозе прирост в крови меньше.`,
    cappedNote:
      "Расчёт вышел за верхний безопасный предел самостоятельного приёма — 4000 МЕ в сутки. Доза ограничена им; всё, что выше, назначает врач с контролем анализов.",
    ulTitle: "Доля от верхнего безопасного предела",
    ulNote: (share: string) => `${share}% от 4000 МЕ в сутки — предела длительного приёма без врача`,
    loadingTitle: "Схема выхода из дефицита",
    loadingLead: (total: string) =>
      `Суммарно ${total} МЕ на курс — по формуле van Groningen, она единственная учитывает массу тела.`,
    loadingDaily: (daily: string) => `${daily} МЕ в сутки на 8 недель`,
    doseWords: ["приём", "приёма", "приёмов"] as [string, string, string],
    loadingWeekly: (weeks: string, word: string) =>
      `или ${weeks} ${word} по 50 000 МЕ раз в неделю`,
    loadingAfter: "Затем контрольный анализ и переход на поддерживающую дозу.",
    loadingCap:
      "Расчётная суточная доза превышает 10 000 МЕ. Это уже не самолечение: такую схему назначает врач.",
    projectedTitle: "Чего ждать через 8–12 недель",
    projected: (mid: string, low: string, high: string, ng: string) =>
      `На поддерживающей дозе уровень выйдет примерно на ${mid} нмоль/л (${ng} нг/мл), вероятный разброс — от ${low} до ${high}. Плато достигается за 8–12 недель, раньше контрольный анализ сдавать бессмысленно.`,
    projectedGain: (mid: string, low: string, high: string, ng: string) =>
      `Такая доза поднимет 25(OH)D примерно на ${mid} нмоль/л (${ng} нг/мл), вероятный разброс — от ${low} до ${high}. Каким станет сам уровень, зависит от того, где он сейчас: без анализа эту точку отсчёта взять неоткуда. Плато достигается за 8–12 недель.`,
    testTitle: "Анализ здесь уже нужен",
    testNote:
      "Доза заметно выше профилактической или исходный уровень низкий. В обоих случаях нужен 25(OH)D до начала приёма и через 8–12 недель после.",
    foodTitle: "Сколько это в еде",
    servingWords: ["порция", "порции", "порций"] as [string, string, string],
    foodNote: (salmon: string, word: string) =>
      `Чтобы набрать суточную дозу едой, понадобилось бы около ${salmon} ${word} дикого лосося по 100 г. Обычный рацион даёт 100–200 МЕ в сутки — поэтому вопрос и решается добавкой, а не тарелкой.`,
    foods: {
      salmon: "Дикий лосось, 100 г",
      herring: "Сельдь, 100 г",
      sardines: "Сардины консервированные, 100 г",
      codLiverOil: "Масло печени трески, 1 ч. л.",
      egg: "Яичный желток, 1 шт.",
      milk: "Обогащённое молоко, 250 мл",
      mushrooms: "Грибы под УФ, 100 г",
    } as Record<string, string>,
    sunTitle: "Почему солнце не входит в расчёт",
    sun:
      "Синтез в коже зависит от угла солнца, а не от количества часов на улице: севернее 40-й параллели — это вся территория России, Мадрид, Стамбул — с ноября по март ультрафиолет B до земли практически не доходит, и кожа не производит витамин D независимо от погоды. Летом 15–20 минут в полдень дают порядка 10 000 МЕ, но крем с SPF 30 снижает синтез более чем на 95%, тёмной коже нужно в 3–6 раз больше времени, а после 65 лет способность кожи падает примерно вчетверо. Предсказать вклад солнца по анкете невозможно — его показывает только анализ.",
    disclaimer:
      "Расчёт не подходит при саркоидозе и других гранулематозных заболеваниях, первичном гиперпаратиреозе, гиперкальциемии любого происхождения, тяжёлой почечной недостаточности и кальциевом нефролитиазе: там витамин D назначают иначе и только под наблюдением. Детям, беременным и кормящим дозу подбирает врач. Тиазидные диуретики вместе с высокими дозами повышают риск гиперкальциемии.",
  },
  en: {
    weight: "Weight",
    kg: "kg",
    height: "Height",
    cm: "cm",
    age: "Age",
    years: "years",
    hasTest: "I know my 25(OH)D",
    hasTestHint: "A blood test for 25-hydroxyvitamin D is available",
    level: "25(OH)D level",
    units: { ngml: "ng/mL", nmol: "nmol/L" },
    currentDose: "Already taking",
    iuDay: "IU/day",
    currentDoseHint:
      "If you already supplement, that contribution is subtracted — otherwise the dose stacks on top of one that is already working.",
    statusTitle: "Your level",
    statuses: {
      severe: "Severe deficiency",
      deficient: "Deficiency",
      insufficient: "Insufficiency",
      target: "Target range",
      above: "Above target",
      toxic: "Potentially toxic",
    } as Record<VitaminDStatus, string>,
    statusNotes: {
      severe:
        "A level this low is corrected under medical supervision: calcium, phosphate and parathyroid hormone need checking, and sometimes the cause does too — malabsorption, kidney or liver disease.",
      deficient:
        "Confirmed deficiency. The schedule below is scaled to body mass; a follow-up test after 8–12 weeks is not optional if high doses are used.",
      insufficient:
        "The in-between zone: enough for bone health by IOM criteria, below the target clinical guidelines aim for. No loading dose is needed here — a maintenance dose is enough.",
      target:
        "You are in the target range. The job now is holding it, not raising it: without supplementation the level drifts back within a couple of months.",
      above:
        "Above the target range. No additional benefit has been shown up here, so the dose is worth lowering.",
      toxic:
        "Levels like this carry a risk of hypercalcaemia. Stop supplementing and see a doctor — serum calcium and kidney function need measuring.",
    } as Record<VitaminDStatus, string>,
    scaleTarget: "target",
    scaleIom: "IOM floor",
    maintenanceTitle: "Maintenance dose",
    perDay: "IU per day",
    dropWords: ["drop", "drops", "drops"] as [string, string, string],
    drops: (n: string, word: string) => `${n} ${word} of a 500 IU oil solution`,
    maintenanceFromLevel:
      "The dose is set to bring you to 75 nmol/L (30 ng/mL) and hold you there.",
    maintenancePreventive:
      "With no blood test this is a preventive dose: it covers the needs of most adults and requires no lab monitoring.",
    bodyNote: (factor: string, bmi: string) =>
      `Scaled up ${factor}× for a BMI of ${bmi}: vitamin D distributes into fat tissue, so the same dose raises blood levels less.`,
    cappedNote:
      "The calculation exceeded the tolerable upper intake level for unsupervised use — 4000 IU per day. It has been capped there; anything above that belongs with a clinician and blood tests.",
    ulTitle: "Share of the upper safe limit",
    ulNote: (share: string) => `${share}% of 4000 IU/day, the ceiling for long-term unsupervised use`,
    loadingTitle: "Getting out of deficiency",
    loadingLead: (total: string) =>
      `${total} IU in total for the course — from the van Groningen formula, the only one that accounts for body mass.`,
    loadingDaily: (daily: string) => `${daily} IU per day for 8 weeks`,
    doseWords: ["dose", "doses", "doses"] as [string, string, string],
    loadingWeekly: (weeks: string, word: string) => `or ${weeks} weekly ${word} of 50,000 IU`,
    loadingAfter: "Then re-test and switch to the maintenance dose.",
    loadingCap:
      "The calculated daily dose is above 10,000 IU. That is no longer self-treatment — a schedule like this comes from a doctor.",
    projectedTitle: "What to expect in 8–12 weeks",
    projected: (mid: string, low: string, high: string, ng: string) =>
      `On the maintenance dose the level should settle around ${mid} nmol/L (${ng} ng/mL), with a likely spread of ${low} to ${high}. The plateau takes 8–12 weeks; testing earlier tells you nothing.`,
    projectedGain: (mid: string, low: string, high: string, ng: string) =>
      `This dose should raise 25(OH)D by about ${mid} nmol/L (${ng} ng/mL), with a likely spread of ${low} to ${high}. Where the level itself ends up depends on where it starts, and without a test there is no starting point to work from. The plateau takes 8–12 weeks.`,
    testTitle: "This is where a blood test earns its cost",
    testNote:
      "Either the dose is well above preventive or the starting level is low. Both call for a 25(OH)D test before starting and another 8–12 weeks in.",
    foodTitle: "The same dose as food",
    servingWords: ["serving", "servings", "servings"] as [string, string, string],
    foodNote: (salmon: string, word: string) =>
      `Getting this daily dose from food would take roughly ${salmon} ${word} of wild salmon at 100 g. A normal diet supplies 100–200 IU a day — which is why this is solved with a capsule rather than a plate.`,
    foods: {
      salmon: "Wild salmon, 100 g",
      herring: "Herring, 100 g",
      sardines: "Canned sardines, 100 g",
      codLiverOil: "Cod liver oil, 1 tsp",
      egg: "Egg yolk, 1",
      milk: "Fortified milk, 250 ml",
      mushrooms: "UV-grown mushrooms, 100 g",
    } as Record<string, string>,
    sunTitle: "Why sunlight is not in the calculation",
    sun:
      "Skin synthesis depends on the angle of the sun, not on hours spent outdoors: above the 40th parallel — Madrid, Istanbul, all of Russia, most of Europe — UVB barely reaches the ground from November to March, and skin makes no vitamin D whatever the weather. In summer, 15–20 midday minutes can produce on the order of 10,000 IU, but SPF 30 cuts synthesis by over 95%, darker skin needs 3–6 times longer, and past 65 the skin's capacity drops roughly fourfold. No questionnaire can predict that contribution — only a blood test shows it.",
    disclaimer:
      "This does not apply in sarcoidosis and other granulomatous disease, primary hyperparathyroidism, hypercalcaemia of any cause, severe renal failure or calcium nephrolithiasis: there vitamin D is dosed differently and only under supervision. Children, pregnancy and breastfeeding need a clinician's dose. Thiazide diuretics combined with high doses raise the risk of hypercalcaemia.",
  },
} as const;

const nf = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Форма существительного при числе: «5 капель», но «2,5 капли» */
function wordFor(n: number, forms: [string, string, string], locale: Locale) {
  if (!Number.isInteger(n)) return forms[1];
  return locale === "ru" ? plural(n, forms) : n === 1 ? forms[0] : forms[1];
}

/** Ширина цветной зоны на шкале 0–150 нмоль/л */
const SCALE_MAX = 150;
const pct = (nmol: number) => Math.min(100, Math.max(0, (nmol / SCALE_MAX) * 100));

const STATUS_COLOR: Record<VitaminDStatus, string> = {
  severe: "#b3261e",
  deficient: "#c2571a",
  insufficient: "#c08a12",
  target: "#2f7d42",
  above: "#c08a12",
  toxic: "#b3261e",
};

export function VitaminDCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(35);
  const [hasTest, setHasTest] = useState(false);
  const [unit, setUnit] = useState<Unit>("ngml");
  const [levelInput, setLevelInput] = useState(20);
  const [currentDose, setCurrentDose] = useState(0);

  const levelNmol = unit === "ngml" ? toNmol(levelInput) : levelInput;

  const r = useMemo(
    () =>
      vitaminDPlan({
        weight,
        height,
        age,
        level: hasTest ? levelNmol : undefined,
        currentDose,
      }),
    [weight, height, age, hasTest, levelNmol, currentDose]
  );

  const inUnit = (nmol: number) => (unit === "ngml" ? toNgml(nmol) : nmol);
  const unitLabel = c.units[unit];
  const salmonServings = r.maintenance / 800;
  const drops = r.maintenance / DROP_IU;

  return (
    <section
      data-accent="amber"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* ── Ввод ─────────────────────────────────────────────── */}
      <div className="grid gap-6 p-5 md:p-7">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="vitd-weight"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.weight}, {c.kg}
            </label>
            <input
              id="vitd-weight"
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
              htmlFor="vitd-height"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.height}, {c.cm}
            </label>
            <input
              id="vitd-height"
              type="number"
              min={130}
              max={220}
              value={height}
              onChange={(e) => setHeight(Math.max(130, Math.min(220, Number(e.target.value) || 0)))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
            />
          </div>
          <div>
            <label
              htmlFor="vitd-age"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.age}, {c.years}
            </label>
            <input
              id="vitd-age"
              type="number"
              min={18}
              max={100}
              value={age}
              onChange={(e) => setAge(Math.max(18, Math.min(100, Number(e.target.value) || 0)))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
            />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={hasTest}
              onChange={(e) => setHasTest(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--brand)]"
            />
            <span>
              <span className="font-semibold">{c.hasTest}</span>
              <span className="mt-0.5 block text-[0.85rem] text-[var(--ink-soft)]">
                {c.hasTestHint}
              </span>
            </span>
          </label>

          {hasTest && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="vitd-level"
                  className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
                >
                  {c.level}
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="vitd-level"
                    type="number"
                    min={0}
                    max={unit === "ngml" ? 150 : 375}
                    step={unit === "ngml" ? 1 : 5}
                    value={levelInput}
                    onChange={(e) => setLevelInput(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
                  />
                  <div className="flex overflow-hidden rounded-xl border border-[var(--line)]">
                    {(["ngml", "nmol"] as Unit[]).map((u) => (
                      <button
                        key={u}
                        type="button"
                        aria-pressed={unit === u}
                        onClick={() => {
                          // Значение конвертируем, чтобы смена единиц не меняла результат
                          setLevelInput((v) =>
                            u === unit
                              ? v
                              : Math.round(u === "nmol" ? toNmol(v) : toNgml(v))
                          );
                          setUnit(u);
                        }}
                        className={`whitespace-nowrap px-3 text-[0.85rem] font-semibold transition-colors ${
                          unit === u
                            ? "bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                            : "text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
                        }`}
                      >
                        {c.units[u]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label
                  htmlFor="vitd-current"
                  className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
                >
                  {c.currentDose}, {c.iuDay}
                </label>
                <input
                  id="vitd-current"
                  type="number"
                  min={0}
                  max={10000}
                  step={500}
                  value={currentDose}
                  onChange={(e) =>
                    setCurrentDose(Math.max(0, Math.min(10000, Number(e.target.value) || 0)))
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 tabular-nums"
                />
                <p className="mt-1.5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">
                  {c.currentDoseHint}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────── */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        {r.status && (
          <div className="mb-8">
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {c.statusTitle}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-[2.4rem] font-semibold leading-none tabular-nums">
                {nf(levelInput)} <span className="text-[1.2rem]">{unitLabel}</span>
              </span>
              <span
                className="rounded-full px-3 py-1 text-[0.85rem] font-semibold text-white"
                style={{ background: STATUS_COLOR[r.status] }}
              >
                {c.statuses[r.status]}
              </span>
            </div>

            {/* Шкала: где человек стоит относительно двух порогов */}
            <div className="mt-5">
              <div className="relative h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${pct(THRESHOLDS.severe)}%`,
                    background: STATUS_COLOR.severe,
                    opacity: 0.55,
                  }}
                />
                <div
                  className="absolute inset-y-0"
                  style={{
                    left: `${pct(THRESHOLDS.severe)}%`,
                    width: `${pct(THRESHOLDS.deficient) - pct(THRESHOLDS.severe)}%`,
                    background: STATUS_COLOR.deficient,
                    opacity: 0.55,
                  }}
                />
                <div
                  className="absolute inset-y-0"
                  style={{
                    left: `${pct(THRESHOLDS.deficient)}%`,
                    width: `${pct(THRESHOLDS.insufficient) - pct(THRESHOLDS.deficient)}%`,
                    background: STATUS_COLOR.insufficient,
                    opacity: 0.55,
                  }}
                />
                <div
                  className="absolute inset-y-0"
                  style={{
                    left: `${pct(THRESHOLDS.insufficient)}%`,
                    right: 0,
                    background: STATUS_COLOR.target,
                    opacity: 0.55,
                  }}
                />
                <div
                  className="absolute inset-y-[-4px] w-[3px] rounded-full bg-[var(--ink)]"
                  style={{ left: `calc(${pct(levelNmol)}% - 1.5px)` }}
                  aria-hidden="true"
                />
              </div>
              <div className="relative mt-1.5 h-4 text-[0.72rem] text-[var(--ink-faint)]">
                <span
                  className="absolute -translate-x-1/2 tabular-nums"
                  style={{ left: `${pct(IOM_SUFFICIENT_NMOL)}%` }}
                >
                  {nf(inUnit(IOM_SUFFICIENT_NMOL))} · {c.scaleIom}
                </span>
                <span
                  className="absolute -translate-x-1/2 tabular-nums"
                  style={{ left: `${pct(TARGET_NMOL)}%` }}
                >
                  {nf(inUnit(TARGET_NMOL))} · {c.scaleTarget}
                </span>
              </div>
            </div>

            <p className="mt-6 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
              {c.statusNotes[r.status]}
            </p>
          </div>
        )}

        {/* Поддерживающая доза */}
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {c.maintenanceTitle}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[2.75rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
            {nf(r.maintenance)}
          </span>
          <span className="text-[1.05rem] text-[var(--ink-soft)]">{c.perDay}</span>
          <span className="text-[0.95rem] text-[var(--ink-faint)]">
            {c.drops(
              nf(drops, Number.isInteger(drops) ? 0 : 1),
              wordFor(drops, c.dropWords, locale)
            )}
          </span>
        </div>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
          {r.baseline === undefined ? c.maintenancePreventive : c.maintenanceFromLevel}
          {r.factor > 1 && ` ${c.bodyNote(nf(r.factor, 1), nf(r.bmi, 1))}`}
        </p>
        {r.maintenanceCapped && (
          <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">{c.cappedNote}</p>
        )}

        {/* Доля от верхнего предела */}
        <div className="mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${r.ulShare * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <p className="mt-1.5 text-[0.8rem] text-[var(--ink-faint)]">
            {c.ulNote(nf(r.ulShare * 100))}
          </p>
        </div>

        {/* Насыщение */}
        {r.loading && (
          <div className="mt-7 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
            <p className="font-semibold">⚡ {c.loadingTitle}</p>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
              {c.loadingLead(nf(r.loading.total))}
            </p>
            <ul className="mt-3 space-y-1.5 text-[0.95rem]">
              <li className="font-display text-[1.15rem] font-semibold tabular-nums">
                {c.loadingDaily(nf(r.loading.daily))}
              </li>
              <li className="text-[var(--ink-soft)]">
                {c.loadingWeekly(
                  nf(r.loading.weeks),
                  wordFor(r.loading.weeks, c.doseWords, locale)
                )}
              </li>
            </ul>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">
              {c.loadingAfter}
            </p>
            {r.loading.aboveCap && (
              <p className="mt-2 text-[0.9rem] font-semibold leading-relaxed text-[var(--ink)]">
                {c.loadingCap}
              </p>
            )}
          </div>
        )}

        {/* Прогноз */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.projectedTitle}
          </p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
            {/* Без анализа стартовая точка неизвестна, поэтому обещаем прирост, а не уровень */}
            {(r.baseline === undefined ? c.projectedGain : c.projected)(
              nf(r.projected.mid),
              nf(r.projected.low),
              nf(r.projected.high),
              nf(toNgml(r.projected.mid), r.projected.mid < 25 ? 1 : 0)
            )}
          </p>
        </div>

        {r.needsTest && (
          <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="font-semibold">🩸 {c.testTitle}</p>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
              {c.testNote}
            </p>
          </div>
        )}

        {/* Еда */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.foodTitle}
          </p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
            {c.foodNote(
              nf(salmonServings, salmonServings < 10 ? 1 : 0),
              wordFor(salmonServings, c.servingWords, locale)
            )}
          </p>
          <div className="mt-3 grid gap-2">
            {FOOD_SOURCES.map((f) => (
              <div key={f.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div>
                  <p className="text-[0.88rem]">{c.foods[f.id]}</p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${(f.iu / UL_DAILY) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <span className="font-display text-[1.05rem] font-semibold tabular-nums">
                  {nf(f.iu)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="font-semibold">☀️ {c.sunTitle}</p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">{c.sun}</p>
        </div>

        <p className="mt-5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}
