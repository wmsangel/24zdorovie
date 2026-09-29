"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  PHQ9_ITEMS,
  PHQ9_MAX,
  SUICIDE_ITEM,
  type Phq9SeverityKey,
  phq9Severity,
  scorePhq9,
} from "@/lib/phq9";

/**
 * PHQ-9 — калькулятор тяжести депрессии.
 *
 * Валидированная шкала: баллы и пороги — в src/lib/phq9.ts (Kroenke 2001).
 * Здесь только локализованные формулировки и вывод. Порядок вариантов ответа
 * совпадает с баллами 0–3. Пункт 9 (мысли о самоповреждении) при любом
 * ненулевом ответе показывает кризисную подсказку независимо от суммы.
 */

const ARTICLE = {
  ru: "/ru/mental-health/kpt-osnovy",
  en: "/en/mental-health/cbt-basics",
};
const EXERCISE = {
  ru: "/ru/mental-health/sport-i-nastroenie",
  en: "/en/mental-health/exercise-and-mental-health",
};

const COPY = {
  ru: {
    intro: "За последние 2 недели, как часто вас беспокоили следующие проблемы? 9 вопросов, около минуты.",
    scale: ["Совсем нет", "Несколько дней", "Больше половины дней", "Почти каждый день"],
    progress: (d: number) => `Отвечено ${d} из ${PHQ9_ITEMS}`,
    reset: "Начать заново",
    questions: [
      "Мало интереса или удовольствия от привычных занятий",
      "Подавленность, уныние или чувство безнадёжности",
      "Проблемы со сном: трудно заснуть, часто просыпаетесь или спите слишком много",
      "Усталость или упадок сил",
      "Плохой аппетит или переедание",
      "Плохое мнение о себе: чувство, что вы неудачник или подвели себя и близких",
      "Трудно сосредоточиться (например, на чтении или телевизоре)",
      "Двигаетесь или говорите так медленно, что это замечают окружающие, — или наоборот, суетливость и неусидчивость",
      "Мысли, что вам лучше было бы умереть, или о причинении себе вреда",
    ],
    resultTitle: "Ваш результат",
    points: "баллов",
    severityLabel: "Тяжесть симптомов",
    severity: {
      minimal: "Минимальная или нет",
      mild: "Лёгкая",
      moderate: "Умеренная",
      moderatelySevere: "Умеренно тяжёлая",
      severe: "Тяжёлая",
    } as Record<Phq9SeverityKey, string>,
    advice: {
      minimal: "Значимых признаков депрессии сейчас нет. Если самочувствие ухудшится, пройдите тест снова.",
      mild: "Лёгкие симптомы. Часто помогают базовые вещи — режим сна, движение, поддержка близких. Если держится больше двух недель или мешает жизни, стоит обсудить с врачом.",
      moderate: "Умеренные симптомы. Это уровень, на котором стоит обратиться к врачу или психотерапевту: обсудить психотерапию и, при необходимости, лечение.",
      moderatelySevere: "Умеренно тяжёлые симптомы. Рекомендуется обратиться к специалисту (психиатр/психотерапевт) — как правило, показаны активное лечение и наблюдение.",
      severe: "Тяжёлые симптомы. Не откладывайте обращение к врачу-психиатру. Если есть мысли о причинении себе вреда — обратитесь за помощью немедленно (см. ниже).",
    } as Record<Phq9SeverityKey, string>,
    crisisTitle: "🚨 Если есть мысли о том, чтобы причинить себе вред",
    crisis:
      "Вы отметили пункт про мысли о смерти или самоповреждении. Это важно и это не стыдно. Не оставайтесь с этим одни: обратитесь за помощью прямо сейчас — позвоните близкому человеку, врачу или в экстренную службу (112). В России работает бесплатный телефон психологической помощи МЧС: 8 800 775-17-17. Если есть непосредственная опасность — звоните 112.",
    disclaimerTitle: "Это скрининг, а не диагноз",
    disclaimer:
      "PHQ-9 оценивает тяжесть симптомов, но не ставит диагноз. Депрессию диагностирует врач по совокупности картины. Балл — повод обсудить состояние со специалистом, а не самому себе поставить или снять диагноз.",
    readMore: "КПТ: доказательная психотерапия — что лечит и как",
    readMoreExercise: "Спорт и настроение: как движение помогает при подавленности",
    unanswered: "Ответьте на все вопросы, чтобы увидеть результат.",
  },
  en: {
    intro: "Over the last 2 weeks, how often have you been bothered by the following? 9 questions, about a minute.",
    scale: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    progress: (d: number) => `${d} of ${PHQ9_ITEMS} answered`,
    reset: "Start over",
    questions: [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
      "Trouble concentrating on things, such as reading or watching TV",
      "Moving or speaking so slowly that others noticed — or the opposite, being fidgety and restless",
      "Thoughts that you would be better off dead, or of hurting yourself",
    ],
    resultTitle: "Your result",
    points: "points",
    severityLabel: "Symptom severity",
    severity: {
      minimal: "Minimal or none",
      mild: "Mild",
      moderate: "Moderate",
      moderatelySevere: "Moderately severe",
      severe: "Severe",
    } as Record<Phq9SeverityKey, string>,
    advice: {
      minimal: "No meaningful signs of depression right now. If you start feeling worse, take the test again.",
      mild: "Mild symptoms. Basics often help — sleep routine, movement, support from people you trust. If it lasts more than two weeks or interferes with life, worth discussing with a doctor.",
      moderate: "Moderate symptoms. This is the level where it's worth seeing a doctor or therapist to discuss psychotherapy and, if needed, treatment.",
      moderatelySevere: "Moderately severe symptoms. Seeing a specialist (psychiatrist/therapist) is recommended — active treatment and follow-up are usually indicated.",
      severe: "Severe symptoms. Don't delay seeing a psychiatrist. If you have thoughts of harming yourself, get help immediately (see below).",
    } as Record<Phq9SeverityKey, string>,
    crisisTitle: "🚨 If you have thoughts of harming yourself",
    crisis:
      "You flagged the item about thoughts of death or self-harm. This matters and there's no shame in it. Don't stay with it alone — reach out right now: call someone you trust, a doctor, or emergency services. In the US call or text 988 (Suicide & Crisis Lifeline); in the UK call 111 or Samaritans on 116 123; elsewhere call your local emergency number. If you're in immediate danger, call emergency services now.",
    disclaimerTitle: "This is a screen, not a diagnosis",
    disclaimer:
      "PHQ-9 measures symptom severity; it does not diagnose. Depression is diagnosed by a clinician from the full picture. Your score is a reason to discuss how you feel with a professional, not to diagnose or rule it out yourself.",
    readMore: "CBT: the evidence-based therapy — what it treats and how",
    readMoreExercise: "Exercise and mood: how movement helps with low mood",
    unanswered: "Answer every question to see your result.",
  },
} as const;

const ACCENT: Record<Phq9SeverityKey, string> = {
  minimal: "leaf",
  mild: "moss",
  moderate: "amber",
  moderatelySevere: "clay",
  severe: "berry",
};

export function Phq9Calculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const done = Object.keys(answers).length;
  const complete = done === PHQ9_ITEMS;
  const suicideFlag = (answers[SUICIDE_ITEM] ?? 0) > 0;

  const result = useMemo(() => {
    if (!complete) return null;
    const total = scorePhq9(answers);
    return { total, sev: phq9Severity(total) };
  }, [answers, complete]);

  const accent = result ? ACCENT[result.sev.key] : "ocean";

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
              style={{ width: `${(done / PHQ9_ITEMS) * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-[0.78rem] tabular-nums text-[var(--ink-faint)]">{c.progress(done)}</p>
        </div>
      </div>

      {/* ── Вопросы ──────────────────────────────────────────── */}
      <ol className="divide-y divide-[var(--line)]">
        {c.questions.map((q, i) => (
          <li key={i} className="p-5 md:px-7">
            <fieldset>
              <legend className="text-[0.98rem] leading-snug">
                <span className="mr-1.5 tabular-nums text-[var(--ink-faint)]">{i + 1}.</span>
                {q}
              </legend>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.scale.map((label, value) => {
                  const active = answers[i] === value;
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
                        name={`phq9-${i}`}
                        value={value}
                        checked={active}
                        onChange={() => setAnswers((a) => ({ ...a, [i]: value }))}
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
            <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
              <p className="font-display text-4xl font-semibold tabular-nums text-[var(--accent)]">
                {result.total}
                <span className="text-[1.1rem] font-normal text-[var(--ink-faint)]">
                  {" "}
                  / {PHQ9_MAX} {c.points}
                </span>
              </p>
              <p className="font-display text-xl font-semibold text-[var(--accent)]">
                {c.severity[result.sev.key]}
              </p>
            </div>
            <p className="mt-4 text-[0.98rem] leading-relaxed">{c.advice[result.sev.key]}</p>
          </>
        )}

        {/* Кризисная подсказка — при любом ненулевом ответе на пункт 9, независимо от суммы */}
        {suicideFlag && (
          <div className="mt-6 rounded-xl border-2 border-[#b8447a] bg-[color-mix(in_oklab,#b8447a_10%,var(--surface))] p-4">
            <p className="font-semibold text-[#b8447a]">{c.crisisTitle}</p>
            <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">{c.crisis}</p>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
          <p className="font-semibold">ℹ️ {c.disclaimerTitle}</p>
          <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">{c.disclaimer}</p>
          <p className="mt-3 flex flex-col gap-1.5 text-[0.9rem]">
            <a
              href={ARTICLE[locale]}
              className="font-semibold text-[var(--brand-strong)] underline underline-offset-2"
            >
              → {c.readMore}
            </a>
            <a
              href={EXERCISE[locale]}
              className="font-semibold text-[var(--brand-strong)] underline underline-offset-2"
            >
              → {c.readMoreExercise}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
