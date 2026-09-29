"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  GAD7_ITEMS,
  GAD7_MAX,
  type Gad7SeverityKey,
  gad7Severity,
  scoreGad7,
} from "@/lib/gad7";

/**
 * GAD-7 — калькулятор тяжести тревоги.
 *
 * Валидированная шкала: баллы и пороги — в src/lib/gad7.ts (Spitzer 2006).
 * Здесь только локализованные формулировки и вывод. Порядок вариантов ответа
 * совпадает с баллами 0–3. Кризисного пункта, как в PHQ-9, тут нет.
 */

const ANXIETY = {
  ru: "/ru/mental-health/trevoga-kak-rabotaet",
  en: "/en/mental-health/understanding-anxiety",
};
const PANIC = {
  ru: "/ru/mental-health/panicheskie-ataki",
  en: "/en/mental-health/panic-attacks",
};
const DEPRESSION_TOOL = {
  ru: "/ru/tools/phq-9-depression-test",
  en: "/en/tools/phq-9-depression-test",
};

const COPY = {
  ru: {
    intro: "За последние 2 недели, как часто вас беспокоили следующие проблемы? 7 вопросов, меньше минуты.",
    scale: ["Совсем нет", "Несколько дней", "Больше половины дней", "Почти каждый день"],
    progress: (d: number) => `Отвечено ${d} из ${GAD7_ITEMS}`,
    reset: "Начать заново",
    questions: [
      "Нервозность, тревога или ощущение «на взводе»",
      "Не получается перестать тревожиться или контролировать беспокойство",
      "Слишком сильное беспокойство по разным поводам",
      "Трудно расслабиться",
      "Такое беспокойство, что трудно усидеть на месте",
      "Лёгкая раздражительность, всё легко выводит из себя",
      "Страх, будто вот-вот случится что-то ужасное",
    ],
    resultTitle: "Ваш результат",
    points: "баллов",
    severity: {
      minimal: "Минимальная или нет",
      mild: "Лёгкая",
      moderate: "Умеренная",
      severe: "Тяжёлая",
    } as Record<Gad7SeverityKey, string>,
    advice: {
      minimal: "Значимых признаков тревожного расстройства сейчас нет. Если станет хуже, пройдите тест снова.",
      mild: "Лёгкая тревога. Часто помогают базовые вещи — сон, движение, дыхательные и релаксационные техники. Если держится и мешает жизни, стоит обсудить с врачом.",
      moderate: "Умеренная тревога. Это уровень, на котором стоит обратиться к врачу или психотерапевту: обсудить психотерапию (например, КПТ) и, при необходимости, лечение.",
      severe: "Выраженная тревога. Рекомендуется обратиться к специалисту — как правило, показаны активное лечение и наблюдение. Тревога хорошо поддаётся терапии.",
    } as Record<Gad7SeverityKey, string>,
    coTitle: "Тревога и депрессия часто идут вместе",
    co: "Тревожное расстройство нередко сопровождается сниженным настроением. Если чувствуете и подавленность, имеет смысл пройти и скрининг депрессии.",
    coCta: "Тест на депрессию (PHQ-9)",
    disclaimerTitle: "Это скрининг, а не диагноз",
    disclaimer:
      "GAD-7 оценивает тяжесть симптомов тревоги, но не ставит диагноз и не различает виды тревожных расстройств. Диагноз ставит врач. Балл — повод обсудить состояние со специалистом.",
    readMore: "Как работает тревога: зачем она нужна и когда становится проблемой",
    readMorePanic: "Панические атаки: что это и что помогает",
    unanswered: "Ответьте на все вопросы, чтобы увидеть результат.",
  },
  en: {
    intro: "Over the last 2 weeks, how often have you been bothered by the following? 7 questions, under a minute.",
    scale: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    progress: (d: number) => `${d} of ${GAD7_ITEMS} answered`,
    reset: "Start over",
    questions: [
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it's hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid, as if something awful might happen",
    ],
    resultTitle: "Your result",
    points: "points",
    severity: {
      minimal: "Minimal or none",
      mild: "Mild",
      moderate: "Moderate",
      severe: "Severe",
    } as Record<Gad7SeverityKey, string>,
    advice: {
      minimal: "No meaningful signs of an anxiety disorder right now. If it gets worse, take the test again.",
      mild: "Mild anxiety. Basics often help — sleep, movement, breathing and relaxation techniques. If it lingers and interferes with life, worth discussing with a doctor.",
      moderate: "Moderate anxiety. This is the level where it's worth seeing a doctor or therapist to discuss psychotherapy (such as CBT) and, if needed, treatment.",
      severe: "Marked anxiety. Seeing a specialist is recommended — active treatment and follow-up are usually indicated. Anxiety responds well to therapy.",
    } as Record<Gad7SeverityKey, string>,
    coTitle: "Anxiety and depression often go together",
    co: "Anxiety disorders frequently come with low mood. If you also feel down, it's worth taking a depression screen as well.",
    coCta: "Depression test (PHQ-9)",
    disclaimerTitle: "This is a screen, not a diagnosis",
    disclaimer:
      "GAD-7 measures the severity of anxiety symptoms; it doesn't diagnose or tell types of anxiety disorder apart. A clinician makes the diagnosis. Your score is a reason to discuss how you feel with a professional.",
    readMore: "How anxiety works: what it's for and when it becomes a problem",
    readMorePanic: "Panic attacks: what they are and what helps",
    unanswered: "Answer every question to see your result.",
  },
} as const;

const ACCENT: Record<Gad7SeverityKey, string> = {
  minimal: "leaf",
  mild: "moss",
  moderate: "amber",
  severe: "berry",
};

export function Gad7Calculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const done = Object.keys(answers).length;
  const complete = done === GAD7_ITEMS;

  const result = useMemo(() => {
    if (!complete) return null;
    const total = scoreGad7(answers);
    return { total, sev: gad7Severity(total) };
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
              style={{ width: `${(done / GAD7_ITEMS) * 100}%` }}
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
                        name={`gad7-${i}`}
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
                  / {GAD7_MAX} {c.points}
                </span>
              </p>
              <p className="font-display text-xl font-semibold text-[var(--accent)]">
                {c.severity[result.sev.key]}
              </p>
            </div>
            <p className="mt-4 text-[0.98rem] leading-relaxed">{c.advice[result.sev.key]}</p>
          </>
        )}

        <div className="mt-6 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
          <p className="font-semibold">🔗 {c.coTitle}</p>
          <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">{c.co}</p>
          <p className="mt-3 text-[0.9rem]">
            <a
              href={DEPRESSION_TOOL[locale]}
              className="font-semibold text-[var(--brand-strong)] underline underline-offset-2"
            >
              → {c.coCta}
            </a>
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
          <p className="font-semibold">ℹ️ {c.disclaimerTitle}</p>
          <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">{c.disclaimer}</p>
          <p className="mt-3 flex flex-col gap-1.5 text-[0.9rem]">
            <a
              href={ANXIETY[locale]}
              className="font-semibold text-[var(--brand-strong)] underline underline-offset-2"
            >
              → {c.readMore}
            </a>
            <a
              href={PANIC[locale]}
              className="font-semibold text-[var(--brand-strong)] underline underline-offset-2"
            >
              → {c.readMorePanic}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
