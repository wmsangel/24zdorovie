"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/config/site";
import { plural } from "@/lib/i18n";
import {
  CYCLE_RANGE,
  DEFAULT_CYCLE,
  DEFAULT_LUTEAL,
  DEFAULT_PERIOD,
  LUTEAL_RANGE,
  PERIOD_RANGE,
  VARIATION_RANGE,
  cyclePlan,
  dayParts,
  parseDay,
  toIso,
  todayDay,
  weekday,
  type CycleFlag,
  type Day,
  type Phase,
} from "@/lib/menstrual-cycle";

/**
 * Калькулятор овуляции и цикла.
 *
 * Жанр насквозь скомпрометирован: типовой сайт рисует одну дату овуляции
 * жирным шрифтом и на этом останавливается. Здесь наоборот — главный
 * результат это окно, а рядом с ним видно, насколько оно широкое при
 * заявленном разбросе цикла. Всё остальное (фазы, тест, ПДР) считается
 * от той же точки, поэтому не расходится между собой.
 *
 * Формулы и пороги — в src/lib/menstrual-cycle.ts.
 */

const COPY = {
  ru: {
    lmp: "Первый день последней менструации",
    lmpHint: "День, когда началось кровотечение, а не когда закончилось.",
    cycleLength: "Длина цикла",
    days: "дн.",
    cycleHint:
      "От первого дня одной менструации до первого дня следующей. Не помните — оставьте 28, но окно овуляции тогда шире.",
    periodLength: "Длится менструация",
    variation: "Цикл гуляет на",
    variationHint:
      "Разница между самым коротким и самым длинным циклом за последние полгода, в одну сторону. Ровный цикл — 1–2 дня.",
    knowLuteal: "Знаю длину лютеиновой фазы",
    knowLutealHint:
      "Вторая половина цикла — от овуляции до менструации. Её видно по тестам на ЛГ, базальной температуре или УЗИ-мониторингу.",
    luteal: "Лютеиновая фаза",
    empty: "Укажите первый день последней менструации — остальное посчитается.",

    phases: {
      menstrual: "Менструация",
      follicular: "Фолликулярная фаза",
      fertile: "Фертильное окно",
      ovulation: "День овуляции",
      luteal: "Лютеиновая фаза",
      overdue: "Задержка",
    } as Record<Phase, string>,
    phaseNotes: {
      menstrual:
        "Отторгается эндометрий предыдущего цикла. Параллельно в яичнике уже зреют фолликулы: следующая овуляция готовится с первого дня, а при коротком цикле фертильное окно успевает открыться ещё до конца менструации.",
      follicular:
        "Растёт эстрадиол, созревает доминантный фолликул. Зачатие в эти дни ещё маловероятно, но фертильное окно открывается за пять суток до овуляции — при коротком цикле оно начинается почти сразу после менструации.",
      fertile:
        "Дни, когда половой акт может привести к беременности. Сперматозоиды доживают в шеечной слизи до пяти суток и ждут яйцеклетку, а не наоборот.",
      ovulation:
        "Фолликул разрывается, яйцеклетка живёт 12–24 часа. Вероятность зачатия высока и сегодня, и в двое предыдущих суток — за счёт уже дошедших сперматозоидов.",
      luteal:
        "Работает жёлтое тело, растёт прогестерон. Забеременеть в эти дни уже нельзя: яйцеклетки нет. Здесь же живёт ПМС — симптомы появляются за несколько дней до менструации и уходят с её началом.",
      overdue:
        "Менструация не пришла в расчётный срок. Это не обязательно беременность: цикл сдвигают болезнь, стресс, перелёт, резкое похудение и интенсивные тренировки.",
    } as Record<Phase, string>,
    dayOfCycle: (n: number) => `${n}-й день цикла`,

    ovulationTitle: "Овуляция",
    ovulationWindow: (from: string, to: string) => `вероятнее всего между ${from} и ${to}`,
    ovulationExact: "при идеально ровном цикле — этот день",
    fertileTitle: "Фертильное окно",
    fertileRange: (from: string, to: string) => `${from} — ${to}`,
    peakTitle: "Пик",
    peakRange: (from: string, to: string) => `${from} — ${to}`,
    peakNote: "Двое суток перед овуляцией и её день — вероятность зачатия максимальная.",
    todayChance: "Вероятность зачатия сегодня",
    chance: {
      none: "Практически нулевая",
      low: "Низкая",
      mid: "Заметная",
      high: "Высокая",
      peak: "Максимальная за цикл",
    },
    countdownOvulation: (n: number, w: string) => `до овуляции ${n} ${w}`,
    countdownPeriod: (n: number, w: string) => `до менструации ${n} ${w}`,
    dayWords: ["день", "дня", "дней"] as [string, string, string],
    overdueDays: (n: number, w: string) => `${n} ${w} задержки`,
    today: "сегодня",

    scaleTitle: "Текущий цикл",
    scaleMenstrual: "менструация",
    scaleFertile: "фертильное окно",
    scaleOvulation: "овуляция",

    forecastTitle: "Ближайшие циклы",
    thPeriod: "Менструация",
    thFertile: "Фертильное окно",
    thOvulation: "Овуляция",
    thTest: "Тест имеет смысл с",
    forecastNote:
      "Чем дальше цикл, тем шире окно овуляции: погрешность каждого цикла накладывается на предыдущую. Дата менструации в третьем-четвёртом цикле — это прикидка, а не план.",

    testTitle: "Тест на беременность",
    testNote: (earliest: string, due: string) =>
      `Раньше ${earliest} тест не покажет ничего достоверного: ХГЧ поднимается до определяемого уровня через 7–12 дней после овуляции. Отрицательный результат до задержки не значит ничего — повторите ${due} или позже. Утренняя порция мочи концентрированнее, но для современных тестов это уже не критично.`,
    dueTitle: "Если зачатие произойдёт в этом цикле",
    dueNote: (date: string) =>
      `Предполагаемая дата родов — около ${date}: 266 дней от овуляции. Разброс большой, в срок ±5 дней рождается меньше половины детей.`,

    flagsTitle: "На что обратить внимание",
    flags: {
      shortCycle:
        "Цикл короче 21 дня. Такое бывает при недостаточности лютеиновой фазы, заболеваниях щитовидной железы и в перименопаузе — стоит показаться гинекологу.",
      longCycle:
        "Цикл длиннее 35 дней. Самая частая причина — СПКЯ, но так же выглядят гипотиреоз, гиперпролактинемия и последствия жёсткого дефицита калорий. Расчёт овуляции при таком цикле особенно ненадёжен.",
      irregular:
        "При разбросе больше недели календарный расчёт перестаёт работать: овуляция в таком цикле смещается сильнее, чем ширина фертильного окна. Ориентируйтесь на тесты на ЛГ и цервикальную слизь, а причину нерегулярности стоит выяснить у врача.",
      longPeriod:
        "Менструация дольше восьми дней считается длительной. Вместе с обильными выделениями это повод проверить ферритин: скрытый дефицит железа развивается незаметно.",
      shortLuteal:
        "Лютеиновая фаза короче 10 дней. Если беременность не наступает, это одна из причин, которую проверяют в первую очередь — по прогестерону в середине второй фазы.",
      stale:
        "Указанная менструация была больше цикла назад, и прогноз построен проекцией вперёд. Введите дату последней менструации — расчёт станет точнее.",
    } as Record<CycleFlag, string>,

    contraceptionTitle: "Это не метод контрацепции",
    contraception:
      "Календарный расчёт даёт около 12–24 незапланированных беременностей на 100 женщин за год обычного использования — сопоставимо с отсутствием предохранения в первые месяцы. Причина в самой природе цикла: овуляция сдвигается от стресса, болезни, перелёта и недосыпа, а сперматозоиды к этому моменту уже могут ждать внутри. Считать «безопасные дни» по этому калькулятору нельзя.",
    disclaimer:
      "Расчёт не применим при гормональной контрацепции (там своей овуляции нет), во время беременности и кормления, в перименопаузе и при нерегулярном цикле. Он не заменяет тесты на овуляцию и УЗИ-мониторинг: если беременность не наступает год при регулярной половой жизни (или полгода после 35 лет), к репродуктологу идут независимо от календаря. Данные не покидают ваш браузер.",
  },

  en: {
    lmp: "First day of your last period",
    lmpHint: "The day bleeding started, not the day it ended.",
    cycleLength: "Cycle length",
    days: "days",
    cycleHint:
      "From the first day of one period to the first day of the next. If you are unsure, leave 28 — the ovulation window just gets wider.",
    periodLength: "Period lasts",
    variation: "Cycle varies by",
    variationHint:
      "The gap between your shortest and longest cycle over the past six months, in one direction. A steady cycle moves 1–2 days.",
    knowLuteal: "I know my luteal phase length",
    knowLutealHint:
      "The second half of the cycle — ovulation to period. LH tests, basal temperature or ultrasound monitoring show it.",
    luteal: "Luteal phase",
    empty: "Enter the first day of your last period — everything else follows.",

    phases: {
      menstrual: "Period",
      follicular: "Follicular phase",
      fertile: "Fertile window",
      ovulation: "Ovulation day",
      luteal: "Luteal phase",
      overdue: "Late",
    } as Record<Phase, string>,
    phaseNotes: {
      menstrual:
        "Last cycle's endometrium is shedding. Meanwhile follicles are already maturing: the next ovulation starts being prepared on day one, and on a short cycle the fertile window opens before bleeding has finished.",
      follicular:
        "Oestradiol rises and a dominant follicle matures. Conception is still unlikely, but the fertile window opens five days before ovulation — on a short cycle that is almost straight after your period.",
      fertile:
        "The days when sex can lead to pregnancy. Sperm survive in cervical mucus for up to five days and wait for the egg, not the other way round.",
      ovulation:
        "The follicle ruptures and the egg lives 12–24 hours. The odds are high today and on the two preceding days, thanks to sperm that already made the trip.",
      luteal:
        "The corpus luteum is working and progesterone climbs. Conception is no longer possible this cycle — there is no egg. This is also where PMS lives: symptoms appear a few days before bleeding and lift once it starts.",
      overdue:
        "Your period has not arrived on schedule. That is not necessarily pregnancy: illness, stress, travel, rapid weight loss and hard training all shift a cycle.",
    } as Record<Phase, string>,
    dayOfCycle: (n: number) => `Day ${n} of your cycle`,

    ovulationTitle: "Ovulation",
    ovulationWindow: (from: string, to: string) => `most likely between ${from} and ${to}`,
    ovulationExact: "on a perfectly steady cycle — this day",
    fertileTitle: "Fertile window",
    fertileRange: (from: string, to: string) => `${from} — ${to}`,
    peakTitle: "Peak",
    peakRange: (from: string, to: string) => `${from} — ${to}`,
    peakNote: "The two days before ovulation and the day itself carry the highest odds.",
    todayChance: "Chance of conceiving today",
    chance: {
      none: "Essentially nil",
      low: "Low",
      mid: "Moderate",
      high: "High",
      peak: "Highest of the cycle",
    },
    countdownOvulation: (n: number, w: string) => `${n} ${w} to ovulation`,
    countdownPeriod: (n: number, w: string) => `${n} ${w} to your period`,
    dayWords: ["day", "days", "days"] as [string, string, string],
    overdueDays: (n: number, w: string) => `${n} ${w} late`,
    today: "today",

    scaleTitle: "Current cycle",
    scaleMenstrual: "period",
    scaleFertile: "fertile window",
    scaleOvulation: "ovulation",

    forecastTitle: "Upcoming cycles",
    thPeriod: "Period",
    thFertile: "Fertile window",
    thOvulation: "Ovulation",
    thTest: "Test from",
    forecastNote:
      "The further out the cycle, the wider its ovulation window: each cycle's error stacks on the last. A period date three or four cycles ahead is a guess, not a plan.",

    testTitle: "Pregnancy test",
    testNote: (earliest: string, due: string) =>
      `Before ${earliest} a test tells you nothing reliable: hCG needs 7–12 days after ovulation to reach a detectable level. A negative result before your period is due means nothing — repeat it on ${due} or later. First morning urine is more concentrated, though modern tests barely care.`,
    dueTitle: "If you conceive this cycle",
    dueNote: (date: string) =>
      `The due date would fall around ${date} — 266 days from ovulation. The spread is wide: fewer than half of babies arrive within five days of it.`,

    flagsTitle: "Worth noting",
    flags: {
      shortCycle:
        "A cycle under 21 days. This shows up with luteal phase deficiency, thyroid disease and in perimenopause — worth a gynaecologist's opinion.",
      longCycle:
        "A cycle over 35 days. PCOS is the most common cause, but hypothyroidism, hyperprolactinaemia and the aftermath of severe calorie restriction look the same. Ovulation timing is especially unreliable on a cycle this long.",
      irregular:
        "Beyond a week of variation, calendar maths stops working: ovulation moves further than the fertile window is wide. Use LH tests and cervical mucus instead — and have the cause of the irregularity looked at.",
      longPeriod:
        "Bleeding beyond eight days counts as prolonged. Combined with heavy flow it is a reason to check ferritin: iron deficiency builds up quietly.",
      shortLuteal:
        "A luteal phase under 10 days. If you are trying to conceive, this is one of the first things checked — via progesterone in the middle of the second half.",
      stale:
        "The period you entered was more than one cycle ago, so this is a projection. Enter your most recent period for a sharper result.",
    } as Record<CycleFlag, string>,

    contraceptionTitle: "This is not contraception",
    contraception:
      "Calendar methods produce roughly 12–24 unintended pregnancies per 100 women a year in typical use — close to using nothing at all over the first months. The reason is the cycle itself: ovulation shifts with stress, illness, travel and lost sleep, and sperm may already be waiting when it does. Do not read 'safe days' off this calculator.",
    disclaimer:
      "This does not apply on hormonal contraception (there is no ovulation of your own), during pregnancy or breastfeeding, in perimenopause or with an irregular cycle. It does not replace ovulation tests or ultrasound monitoring: if pregnancy has not happened after a year of regular sex — six months past 35 — see a specialist regardless of the calendar. Nothing you enter leaves your browser.",
  },
} as const;

/* ── Даты в человеческом виде ──────────────────────────────── */

const MONTHS = {
  ru: {
    full: [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря",
    ],
    short: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  },
  en: {
    full: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
    short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
} as const;

const WEEKDAYS = {
  ru: ["пн", "вт", "ср", "чт", "пт", "сб", "вс"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
} as const;

/**
 * «14 августа» / «14 August» — даты форматируем сами, чтобы не зависеть
 * от Intl и часового пояса. Год дописывается, только когда дата уходит
 * за пределы текущего: прогноз на четыре цикла легко перешагивает декабрь.
 */
function fmtLong(day: Day, locale: Locale, refYear?: number) {
  const { year, month, date } = dayParts(day);
  const base = `${date} ${MONTHS[locale].full[month - 1]}`;
  return year === refYear || refYear === undefined ? base : `${base} ${year}`;
}

/** «14 авг» / «14 Aug» — для плотных мест вроде таблицы */
function fmtShort(day: Day, locale: Locale, refYear?: number) {
  const { year, month, date } = dayParts(day);
  const base = `${date} ${MONTHS[locale].short[month - 1]}`;
  return year === refYear || refYear === undefined ? base : `${base} ${year}`;
}

const fmtWeekday = (day: Day, locale: Locale) => WEEKDAYS[locale][weekday(day)];

function wordFor(n: number, forms: [string, string, string], locale: Locale) {
  return locale === "ru" ? plural(n, forms) : n === 1 ? forms[0] : forms[1];
}

/* ── Цвета фаз ─────────────────────────────────────────────── */

const PHASE_COLOR: Record<Phase, string> = {
  menstrual: "#b3446c",
  follicular: "#6f5bc4",
  fertile: "#2f7d42",
  ovulation: "#2f7d42",
  luteal: "#8a6fb0",
  overdue: "#c2571a",
};

/** Дата не меняется на глазах у пользователя, поэтому подписываться не на что */
const subscribeNever = () => () => {};

function chanceLevel(p: number): keyof (typeof COPY)["ru"]["chance"] {
  if (p >= 0.9) return "peak";
  if (p >= 0.5) return "high";
  if (p >= 0.25) return "mid";
  if (p > 0) return "low";
  return "none";
}

/**
 * Числовое поле, которое не мешает набирать.
 *
 * Зажимать значение в границы на каждый символ нельзя: набирая «40»
 * в поле с минимумом 20, человек после первой цифры получает 20, а после
 * второй — 200, то есть максимум. Поэтому промежуточный ввод живёт
 * в черновике, а наружу уходят только значения внутри диапазона;
 * по уходу из поля черновик сбрасывается к принятому значению.
 */
function NumberField({
  id,
  label,
  value,
  min,
  max,
  onCommit,
  className,
  labelClassName,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (n: number) => void;
  className: string;
  labelClassName: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft ?? String(value)}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(n) && n >= min && n <= max) onCommit(n);
        }}
        onBlur={() => setDraft(null)}
        className={className}
      />
    </div>
  );
}

export function OvulationCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  /**
   * Сегодняшний день читаем как внешнее значение и только на клиенте:
   * страницы собираются статически, и дата сборки, попавшая в HTML,
   * разошлась бы с датой у пользователя. На сервере — null, поэтому
   * до гидратации результат просто не показывается.
   */
  const today = useSyncExternalStore(subscribeNever, todayDay, () => null);

  /** Пустая строка = «пользователь не трогал», подставляем дефолт от сегодня */
  const [lmpInput, setLmpInput] = useState("");
  const lmp = lmpInput || (today === null ? "" : toIso(today - 14));
  const [cycleLength, setCycleLength] = useState(DEFAULT_CYCLE);
  const [periodLength, setPeriodLength] = useState(DEFAULT_PERIOD);
  const [variation, setVariation] = useState(2);
  const [knowLuteal, setKnowLuteal] = useState(false);
  const [luteal, setLuteal] = useState(DEFAULT_LUTEAL);

  const r = useMemo(() => {
    if (today === null || !lmp) return null;
    return cyclePlan({
      lmp: parseDay(lmp),
      cycleLength,
      periodLength: Math.min(periodLength, cycleLength - 1),
      lutealLength: knowLuteal ? luteal : DEFAULT_LUTEAL,
      variation,
      today,
    });
  }, [today, lmp, cycleLength, periodLength, variation, knowLuteal, luteal]);

  const inputClass =
    "mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums";
  const labelClass =
    "block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]";

  /** Год «сегодня» — относительно него решается, дописывать ли год к дате */
  const refYear = today === null ? undefined : dayParts(today).year;
  const dateLong = (day: Day) => fmtLong(day, locale, refYear);
  const dateShort = (day: Day) => fmtShort(day, locale, refYear);

  /** Положение дня на шкале текущего цикла, % */
  const pos = (day: Day) => {
    if (!r) return 0;
    const span = Math.max(1, r.current.nextStart - r.current.start);
    return Math.min(100, Math.max(0, ((day - r.current.start) / span) * 100));
  };

  return (
    <section
      data-accent="lavender"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* ── Ввод ─────────────────────────────────────────────── */}
      <div className="grid gap-6 p-5 md:p-7">
        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <label htmlFor="cyc-lmp" className={labelClass}>
              {c.lmp}
            </label>
            <input
              id="cyc-lmp"
              type="date"
              value={lmp}
              max={today === null ? undefined : toIso(today)}
              onChange={(e) => setLmpInput(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1.5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">
              {c.lmpHint}
            </p>
          </div>
          <NumberField
            id="cyc-length"
            label={`${c.cycleLength}, ${c.days}`}
            value={cycleLength}
            min={CYCLE_RANGE.min}
            max={CYCLE_RANGE.max}
            onCommit={setCycleLength}
            className={inputClass}
            labelClassName={labelClass}
          />
          <NumberField
            id="cyc-period"
            label={`${c.periodLength}, ${c.days}`}
            value={periodLength}
            min={PERIOD_RANGE.min}
            max={PERIOD_RANGE.max}
            onCommit={setPeriodLength}
            className={inputClass}
            labelClassName={labelClass}
          />
        </div>

        <p className="-mt-2 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.cycleHint}</p>

        <div>
          <label htmlFor="cyc-variation" className={labelClass}>
            {c.variation}: ±{variation} {c.days}
          </label>
          <input
            id="cyc-variation"
            type="range"
            min={VARIATION_RANGE.min}
            max={VARIATION_RANGE.max}
            value={variation}
            onChange={(e) => setVariation(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--brand)]"
          />
          <p className="mt-2 text-[0.82rem] leading-relaxed text-[var(--ink-faint)]">
            {c.variationHint}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={knowLuteal}
              onChange={(e) => setKnowLuteal(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--brand)]"
            />
            <span>
              <span className="font-semibold">{c.knowLuteal}</span>
              <span className="mt-0.5 block text-[0.85rem] text-[var(--ink-soft)]">
                {c.knowLutealHint}
              </span>
            </span>
          </label>

          {knowLuteal && (
            <div className="mt-4 max-w-[16rem]">
              <NumberField
                id="cyc-luteal"
                label={`${c.luteal}, ${c.days}`}
                value={luteal}
                min={LUTEAL_RANGE.min}
                max={LUTEAL_RANGE.max}
                onCommit={setLuteal}
                className={inputClass}
                labelClassName={labelClass}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────── */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        {!r ? (
          <p className="text-[0.95rem] text-[var(--ink-soft)]">{c.empty}</p>
        ) : (
          <>
            {/* Где вы сейчас */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className="rounded-full px-3 py-1 text-[0.85rem] font-semibold text-white"
                style={{ background: PHASE_COLOR[r.phase] }}
              >
                {c.phases[r.phase]}
              </span>
              <span className="font-display text-[1.35rem] font-semibold">
                {r.overdueDays !== null
                  ? c.overdueDays(r.overdueDays, wordFor(r.overdueDays, c.dayWords, locale))
                  : c.dayOfCycle(r.dayOfCycle)}
              </span>
              <span className="text-[0.9rem] text-[var(--ink-faint)]">
                {r.daysToOvulation > 0
                  ? c.countdownOvulation(
                      r.daysToOvulation,
                      wordFor(r.daysToOvulation, c.dayWords, locale)
                    )
                  : r.daysToPeriod > 0
                    ? c.countdownPeriod(r.daysToPeriod, wordFor(r.daysToPeriod, c.dayWords, locale))
                    : ""}
              </span>
            </div>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
              {c.phaseNotes[r.phase]}
            </p>

            {/* Шкала цикла */}
            <div className="mt-7">
              <p className={labelClass}>{c.scaleTitle}</p>
              <div className="relative mt-3 h-4 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${pos(r.current.periodEnd + 1)}%`,
                    background: PHASE_COLOR.menstrual,
                    opacity: 0.6,
                  }}
                />
                <div
                  className="absolute inset-y-0"
                  style={{
                    left: `${pos(r.current.fertileFrom)}%`,
                    width: `${pos(r.current.fertileTo + 1) - pos(r.current.fertileFrom)}%`,
                    background: PHASE_COLOR.fertile,
                    opacity: 0.6,
                  }}
                />
                <div
                  className="absolute inset-y-0 w-[3px]"
                  style={{ left: `${pos(r.current.ovulation)}%`, background: PHASE_COLOR.fertile }}
                  aria-hidden="true"
                />
                {today !== null && today >= r.current.start && today <= r.current.nextStart && (
                  <div
                    className="absolute inset-y-[-4px] w-[3px] rounded-full bg-[var(--ink)]"
                    style={{ left: `calc(${pos(today)}% - 1.5px)` }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-[var(--ink-faint)]">
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-4 rounded-full"
                    style={{ background: PHASE_COLOR.menstrual, opacity: 0.6 }}
                  />
                  {c.scaleMenstrual}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-4 rounded-full"
                    style={{ background: PHASE_COLOR.fertile, opacity: 0.6 }}
                  />
                  {c.scaleFertile}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-[3px] rounded-full"
                    style={{ background: PHASE_COLOR.fertile }}
                  />
                  {c.scaleOvulation}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-[3px] rounded-full bg-[var(--ink)]" />
                  {c.today}
                </span>
              </div>
            </div>

            {/* Главные даты */}
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
                <p className={labelClass}>{c.ovulationTitle}</p>
                <p className="mt-1.5 font-display text-[1.75rem] font-semibold leading-tight">
                  {dateLong(r.current.ovulation)}
                </p>
                <p className="mt-1 text-[0.88rem] leading-relaxed text-[var(--ink-soft)]">
                  {variation === 0
                    ? c.ovulationExact
                    : c.ovulationWindow(
                        dateShort(r.current.ovulationFrom),
                        dateShort(r.current.ovulationTo)
                      )}
                </p>
              </div>

              <div className="rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
                <p className={labelClass}>{c.fertileTitle}</p>
                <p className="mt-1.5 font-display text-[1.35rem] font-semibold leading-tight">
                  {c.fertileRange(
                    dateLong(r.current.fertileFrom),
                    dateLong(r.current.fertileTo)
                  )}
                </p>
                <p className="mt-1 text-[0.88rem] leading-relaxed text-[var(--ink-soft)]">
                  {c.peakTitle}: {dateShort(r.current.peakFrom)} —{" "}
                  {dateShort(r.current.peakTo)}. {c.peakNote}
                </p>
              </div>
            </div>

            {/* Шанс сегодня */}
            <div className="mt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className={labelClass}>{c.todayChance}</p>
                <p className="font-display text-[1.1rem] font-semibold">
                  {c.chance[chanceLevel(r.fertilityToday)]}
                </p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(2, r.fertilityToday * 100)}%`,
                    background: PHASE_COLOR.fertile,
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Прогноз */}
            <div className="mt-8">
              <p className={labelClass}>{c.forecastTitle}</p>
              <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                <table className="w-full border-collapse text-left text-[0.88rem]">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[0.75rem] uppercase tracking-[0.06em] text-[var(--ink-faint)]">
                      <th className="px-4 py-2.5 font-bold">{c.thPeriod}</th>
                      <th className="px-4 py-2.5 font-bold">{c.thFertile}</th>
                      <th className="px-4 py-2.5 font-bold">{c.thOvulation}</th>
                      <th className="px-4 py-2.5 font-bold">{c.thTest}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.cycles.map((cyc) => (
                      <tr key={cyc.index} className="border-b border-[var(--line)] last:border-0">
                        <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                          {dateShort(cyc.start)}
                          <span className="text-[var(--ink-faint)]">
                            {" "}
                            · {fmtWeekday(cyc.start, locale)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                          {dateShort(cyc.fertileFrom)} — {dateShort(cyc.fertileTo)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                          {dateShort(cyc.ovulation)}
                          {variation > 0 && (
                            <span className="text-[var(--ink-faint)]">
                              {" "}
                              ±{cyc.ovulationTo - cyc.ovulation}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                          {dateShort(cyc.testEarliest)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">
                {c.forecastNote}
              </p>
            </div>

            {/* Тест и ПДР */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
                <p className="font-semibold">🧪 {c.testTitle}</p>
                <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
                  {c.testNote(
                    dateLong(r.current.testEarliest),
                    dateLong(r.current.nextStart + 3)
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
                <p className="font-semibold">👶 {c.dueTitle}</p>
                <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
                  {c.dueNote(
                    dateLong(r.current.dueDate)
                  )}
                </p>
              </div>
            </div>

            {/* Флаги */}
            {r.flags.length > 0 && (
              <div className="mt-6 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
                <p className="font-semibold">⚠️ {c.flagsTitle}</p>
                <ul className="mt-2 grid gap-2 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
                  {r.flags.map((f) => (
                    <li key={f}>{c.flags[f]}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Главное предупреждение */}
            <div className="mt-6 rounded-xl border border-[color-mix(in_oklab,#b3446c_35%,var(--line))] bg-[var(--surface)] p-4">
              <p className="font-semibold">🚫 {c.contraceptionTitle}</p>
              <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
                {c.contraception}
              </p>
            </div>

            <p className="mt-5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">
              {c.disclaimer}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
