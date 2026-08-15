"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";

/**
 * Самопроверка на выгорание.
 *
 * Формулировки собственные. Maslach Burnout Inventory защищён авторским
 * правом и лицензируется платно, поэтому его пункты сюда не переносятся —
 * заимствована только трёхмерная структура конструкта (истощение, цинизм,
 * снижение профессиональной эффективности), описанная в Maslach & Leiter,
 * World Psychiatry 2016.
 *
 * Следствие, которое нельзя замалчивать в интерфейсе: шкала не
 * валидирована и нормативных порогов у неё нет. Границы 7 и 14 выбраны
 * как трети диапазона, а не выведены из выборки. Инструмент показывает
 * профиль по трём осям, а не ставит диагноз — диагноза «выгорание» нет
 * ни в DSM-5, ни в МКБ-11 (там это фактор, влияющий на здоровье).
 */

/** Пункты по измерениям: 5 на каждое, все сформулированы «чем выше, тем хуже» */
const ITEMS = {
  exhaustion: ["e1", "e2", "e3", "e4", "e5"],
  cynicism: ["c1", "c2", "c3", "c4", "c5"],
  efficacy: ["p1", "p2", "p3", "p4", "p5"],
} as const;

type Dimension = keyof typeof ITEMS;

/** Ключ вердикта: расчёт не должен зависеть от локали, поэтому тип объявлен отдельно от COPY */
type Verdict = "none" | "strain" | "overextended" | "disengaged" | "burnout" | "severe";

const ALL_ITEMS = Object.values(ITEMS).flat();
const MAX_PER_DIMENSION = 5 * 4;

const COPY = {
  ru: {
    scale: ["Никогда", "Редко", "Иногда", "Часто", "Каждый день"],
    intro: "Оценивайте по последним трём месяцам. 15 вопросов, около двух минут.",
    progress: (done: number) => `Отвечено ${done} из ${ALL_ITEMS.length}`,
    reset: "Начать заново",
    dimensions: {
      exhaustion: "Истощение",
      cynicism: "Цинизм и отстранённость",
      efficacy: "Падение эффективности",
    },
    dimensionHints: {
      exhaustion: "Энергии не остаётся, и отдых её не возвращает",
      cynicism: "Работа обесценилась, люди на ней стали раздражать",
      efficacy: "Ощущение, что вы справляетесь хуже, чем раньше",
    },
    questions: {
      e1: "Работа выжимает меня эмоционально досуха",
      e2: "Я просыпаюсь уставшим даже после полноценной ночи",
      e3: "К концу рабочего дня на всё остальное меня уже не хватает",
      e4: "Одна мысль о завтрашней работе меня утомляет",
      e5: "После рабочей недели мне нужно намного больше времени на восстановление, чем раньше",
      c1: "Я стал безразличнее к людям, с которыми работаю",
      c2: "Я делаю минимум, и мне всё равно, что получится",
      c3: "Моя работа кажется мне бессмысленной",
      c4: "Меня стало раздражать то, что раньше не задевало",
      c5: "Я начал держать дистанцию с коллегами или клиентами",
      p1: "Я сомневаюсь, что делаю на работе что-то стоящее",
      p2: "То, что раньше давалось легко, теперь занимает у меня гораздо больше времени",
      p3: "Мне трудно сосредоточиться на задачах, где надо думать",
      p4: "Мне кажется, я решаю рабочие проблемы хуже, чем раньше",
      p5: "Я перестал получать удовлетворение от завершённой работы",
    },
    levels: { low: "низкий", moderate: "умеренный", high: "высокий" },
    resultTitle: "Ваш профиль",
    verdictTitle: "Как это читать",
    verdicts: {
      none: "Ни по одному измерению нет выраженных значений. Усталость, если она есть, пока похожа на обычную рабочую, а не на выгорание.",
      strain:
        "Значения умеренные. Это состояние напряжения: обратимое, но именно с него всё начинается. Самое время посмотреть на нагрузку и на то, восстанавливаетесь ли вы между рабочими неделями.",
      overextended:
        "Истощение высокое, но отношение к работе пока сохранилось. В исследованиях это отдельный профиль — «перегруженный»: чаще всего дело в объёме нагрузки, а не в самой работе. Разгрузка на этой стадии обычно ещё работает.",
      disengaged:
        "Цинизм высокий при умеренном истощении. Такой профиль чаще связан не с объёмом работы, а с её содержанием: несправедливость, потеря контроля или расхождение с собственными ценностями. Отдых здесь помогает слабо.",
      burnout:
        "Истощение и цинизм высокие одновременно — это и есть сочетание, которое в исследованиях описывают как выгорание. Отпуск снимет часть симптомов на несколько недель, но если в работе ничего не изменится, они вернутся.",
      severe:
        "Высокие значения по всем трём измерениям. На этом уровне картина сильно пересекается с депрессией, и различить их самостоятельно нельзя. Это повод обратиться к специалисту, а не перепроходить тест.",
    },
    notDiagnosisTitle: "Это не диагноз",
    notDiagnosis:
      "Опросник авторский и не валидирован: он показывает профиль по трём осям, но не измеряет выгорание в клиническом смысле. Диагноза «выгорание» нет ни в DSM-5, ни в МКБ-11 — там это обстоятельство, влияющее на здоровье, а не болезнь.",
    redFlagTitle: "Когда идти к врачу",
    redFlag:
      "Если подавленность, потеря интереса и упадок сил распространяются и на жизнь вне работы, держатся больше двух недель, мешают спать и есть — или если появляются мысли о том, что не хочется жить, — обратитесь к врачу или психотерапевту. Симптомы выгорания и депрессии почти неразличимы со стороны, а лечатся они по-разному.",
    unanswered: "Ответьте на все вопросы, чтобы увидеть результат.",
  },
  en: {
    scale: ["Never", "Rarely", "Sometimes", "Often", "Every day"],
    intro: "Answer for the past three months. 15 questions, about two minutes.",
    progress: (done: number) => `${done} of ${ALL_ITEMS.length} answered`,
    reset: "Start over",
    dimensions: {
      exhaustion: "Exhaustion",
      cynicism: "Cynicism and detachment",
      efficacy: "Reduced efficacy",
    },
    dimensionHints: {
      exhaustion: "No energy left, and rest does not bring it back",
      cynicism: "The work has lost its value and the people in it grate on you",
      efficacy: "The sense that you are coping worse than you used to",
    },
    questions: {
      e1: "My work drains me emotionally",
      e2: "I wake up tired even after a full night's sleep",
      e3: "By the end of the workday there is nothing left of me for anything else",
      e4: "Just thinking about tomorrow's work makes me tired",
      e5: "I need far longer to recover after a work week than I used to",
      c1: "I have become more callous toward the people I work with",
      c2: "I do the minimum and I do not care how it turns out",
      c3: "My work feels pointless to me",
      c4: "Things at work that never bothered me now irritate me",
      c5: "I have started keeping my distance from colleagues or clients",
      p1: "I doubt I am doing anything worthwhile at work",
      p2: "What used to be easy now takes me much longer",
      p3: "I struggle to concentrate on work that requires thinking",
      p4: "I feel I handle problems at work worse than I once did",
      p5: "Finishing something no longer gives me any satisfaction",
    },
    levels: { low: "low", moderate: "moderate", high: "high" },
    resultTitle: "Your profile",
    verdictTitle: "How to read this",
    verdicts: {
      none: "Nothing stands out on any dimension. Whatever tiredness you have still looks like ordinary work fatigue rather than burnout.",
      strain:
        "Moderate scores across the board. This is strain: reversible, but it is where the process starts. A good moment to look at your workload and at whether you actually recover between work weeks.",
      overextended:
        "High exhaustion, but your relationship with the work is intact. Research describes this as a distinct 'overextended' profile, and it is usually about volume rather than the job itself. Reducing load still works at this stage.",
      disengaged:
        "High cynicism with only moderate exhaustion. This profile tends to be about the content of the work rather than its volume: unfairness, loss of control, or a clash with your own values. Rest does little for it.",
      burnout:
        "Exhaustion and cynicism are both high — that combination is what research describes as burnout. A holiday will lift some of it for a few weeks, but if nothing about the job changes, it comes back.",
      severe:
        "High on all three dimensions. At this level the picture overlaps heavily with depression, and the two cannot be told apart from the inside. That is a reason to see a professional, not to retake the test.",
    },
    notDiagnosisTitle: "This is not a diagnosis",
    notDiagnosis:
      "This questionnaire is our own and is not a validated instrument: it shows a profile across three dimensions, it does not measure burnout in any clinical sense. Burnout is not a diagnosis in DSM-5 or in ICD-11 — the latter lists it as a factor influencing health, not an illness.",
    redFlagTitle: "When to see a doctor",
    redFlag:
      "If low mood, loss of interest and lack of energy spill over into life outside work, persist beyond two weeks, and interfere with sleeping and eating — or if you have thoughts that life is not worth living — speak to a doctor or therapist. Burnout and depression look almost identical from the outside and are treated differently.",
    unanswered: "Answer every question to see your result.",
  },
} as const;

type Answers = Record<string, number>;

function level(score: number): "low" | "moderate" | "high" {
  if (score <= 6) return "low";
  if (score <= 13) return "moderate";
  return "high";
}

export function BurnoutSelfCheck({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;
  const [answers, setAnswers] = useState<Answers>({});

  const done = Object.keys(answers).length;
  const complete = done === ALL_ITEMS.length;

  const result = useMemo(() => {
    if (!complete) return null;

    const scores = Object.fromEntries(
      (Object.keys(ITEMS) as Dimension[]).map((d) => [
        d,
        ITEMS[d].reduce((sum, id) => sum + (answers[id] ?? 0), 0),
      ]),
    ) as Record<Dimension, number>;

    const levels = Object.fromEntries(
      (Object.keys(scores) as Dimension[]).map((d) => [d, level(scores[d])]),
    ) as Record<Dimension, "low" | "moderate" | "high">;

    // Порядок веток важен: сначала самые тяжёлые сочетания
    const verdict: Verdict =
      levels.exhaustion === "high" && levels.cynicism === "high" && levels.efficacy === "high"
        ? "severe"
        : levels.exhaustion === "high" && levels.cynicism === "high"
          ? "burnout"
          : levels.exhaustion === "high"
            ? "overextended"
            : levels.cynicism === "high"
              ? "disengaged"
              : levels.exhaustion === "low" &&
                  levels.cynicism === "low" &&
                  levels.efficacy === "low"
                ? "none"
                : "strain";

    return { scores, levels, verdict };
  }, [answers, complete]);

  const accent = !result
    ? "berry"
    : result.verdict === "none"
      ? "leaf"
      : result.verdict === "strain"
        ? "amber"
        : result.verdict === "severe"
          ? "berry"
          : "clay";

  return (
    <section
      data-accent={accent}
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      <div className="border-b border-[var(--line)] p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.95rem] text-[var(--ink-soft)]">{c.intro}</p>
          {done > 0 && (
            <button
              type="button"
              onClick={() => setAnswers({})}
              className="text-[0.84rem] font-semibold text-[var(--ink-faint)] underline underline-offset-2 transition-colors hover:text-[var(--brand-strong)]"
            >
              {c.reset}
            </button>
          )}
        </div>
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-300"
              style={{ width: `${(done / ALL_ITEMS.length) * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-[0.78rem] tabular-nums text-[var(--ink-faint)]">
            {c.progress(done)}
          </p>
        </div>
      </div>

      {/* ── Вопросы ──────────────────────────────────────────── */}
      <ol className="divide-y divide-[var(--line)]">
        {ALL_ITEMS.map((id, i) => (
          <li key={id} className="p-5 md:px-7">
            <fieldset>
              <legend className="text-[0.98rem] leading-snug">
                <span className="mr-1.5 tabular-nums text-[var(--ink-faint)]">{i + 1}.</span>
                {c.questions[id as keyof typeof c.questions]}
              </legend>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.scale.map((label, value) => {
                  const active = answers[id] === value;
                  return (
                    <label
                      key={value}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-[0.82rem] font-semibold transition-colors ${
                        active
                          ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                          : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`burnout-${id}`}
                        value={value}
                        checked={active}
                        onChange={() => setAnswers((a) => ({ ...a, [id]: value }))}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      {/* ── Результат ────────────────────────────────────────── */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        {!result ? (
          <p className="text-[var(--ink-soft)]">{c.unanswered}</p>
        ) : (
          <>
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {c.resultTitle}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(Object.keys(ITEMS) as Dimension[]).map((d) => (
                <div key={d} className="rounded-xl bg-[var(--surface)] p-4">
                  <p className="text-[0.88rem] font-semibold">{c.dimensions[d]}</p>
                  <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-[var(--accent)]">
                    {result.scores[d]}
                    <span className="text-[0.9rem] font-normal text-[var(--ink-faint)]">
                      {" "}
                      / {MAX_PER_DIMENSION}
                    </span>
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${(result.scores[d] / MAX_PER_DIMENSION) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[0.8rem] text-[var(--ink-soft)]">
                    {c.levels[result.levels[d]]} · {c.dimensionHints[d]}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[0.98rem] leading-relaxed">
              <span className="font-semibold">{c.verdictTitle}: </span>
              <span className="text-[var(--ink-soft)]">{c.verdicts[result.verdict]}</span>
            </p>
          </>
        )}

        <div className="mt-6 grid gap-3">
          <div className="rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
            <p className="font-semibold">ℹ️ {c.notDiagnosisTitle}</p>
            <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
              {c.notDiagnosis}
            </p>
          </div>
          <div className="rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
            <p className="font-semibold">⚕️ {c.redFlagTitle}</p>
            <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
              {c.redFlag}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
