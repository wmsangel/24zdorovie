"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  matchSymptoms,
  PATTERN_SYMPTOMS,
  RED_FLAGS,
  type Condition,
} from "@/lib/respiratory-symptoms";

/**
 * Сравнение симптомов простуды, гриппа и COVID-19.
 *
 * Осознанно недиагностический инструмент: показывает, на какой паттерн
 * больше похоже, но всегда с оговоркой, что грипп и COVID по симптомам
 * не различить, а точку ставит только тест. Красные флаги вынесены
 * отдельно и всегда выводят баннер «обратитесь за помощью».
 *
 * Модель — в src/lib/respiratory-symptoms.ts.
 */

const COND_COLOR: Record<Condition, string> = {
  cold: "#1fa268",
  flu: "#d97706",
  covid: "#dc2626",
};

const COPY = {
  ru: {
    symptomsTitle: "Отметьте, что беспокоит",
    symptoms: {
      fever: "Температура выше 38 °C",
      suddenOnset: "Резкое начало, «свалило» за часы",
      bodyAches: "Ломота в теле, боль в мышцах",
      fatigue: "Сильная усталость, разбитость",
      dryCough: "Сухой кашель",
      sneezing: "Чихание",
      runnyNose: "Насморк, заложенность носа",
      soreThroat: "Боль в горле",
      headache: "Головная боль",
      lossSmell: "Потеря обоняния или вкуса",
    } as Record<string, string>,
    redTitle: "Тревожные признаки",
    redFlags: {
      troubleBreathing: "Трудно дышать, одышка в покое",
      chestPain: "Боль или давление в груди",
      confusion: "Спутанность сознания, трудно разбудить",
      blueLips: "Синюшность губ или лица",
      persistentHighFever: "Высокая температура дольше 3–4 дней",
      worseningAfterImprovement: "Стало лучше, потом резко хуже",
    } as Record<string, string>,
    redBanner:
      "Среди отмеченного есть тревожные признаки. При них не нужно гадать о диагнозе — обратитесь за медицинской помощью, а при затруднённом дыхании, боли в груди или спутанности сознания вызывайте скорую.",
    resultTitle: "Больше похоже на",
    conditions: {
      cold: "Простуду",
      flu: "Грипп",
      covid: "COVID-19",
    } as Record<Condition, string>,
    needMore: "Отметьте хотя бы три симптома, чтобы прикинуть паттерн.",
    tooClose:
      "Отмеченные симптомы встречаются при всех трёх заболеваниях примерно одинаково — по ним различить нельзя. Это норма: перекрытие большое.",
    caveat:
      "Это не диагноз. Грипп и COVID-19 по симптомам не различить — совпадают вплоть до мелочей. Единственный способ отличить их и подобрать лечение (например, противовирусное в первые дни) — тест. При симптомах простуды тест обычно не нужен, при выраженных симптомах гриппа или COVID — стоит сделать.",
    disclaimer:
      "Инструмент носит справочный характер и не заменяет осмотр врача. Он не рассчитан на детей, беременных и людей с хроническими болезнями лёгких и сердца — им при респираторных симптомах стоит консультироваться с врачом раньше.",
  },
  en: {
    symptomsTitle: "Check what you have",
    symptoms: {
      fever: "Temperature above 38 °C (100.4 °F)",
      suddenOnset: "Sudden onset, hit within hours",
      bodyAches: "Body aches, muscle pain",
      fatigue: "Marked fatigue, wiped out",
      dryCough: "Dry cough",
      sneezing: "Sneezing",
      runnyNose: "Runny or stuffy nose",
      soreThroat: "Sore throat",
      headache: "Headache",
      lossSmell: "Loss of smell or taste",
    } as Record<string, string>,
    redTitle: "Warning signs",
    redFlags: {
      troubleBreathing: "Trouble breathing, breathless at rest",
      chestPain: "Chest pain or pressure",
      confusion: "Confusion, hard to wake",
      blueLips: "Bluish lips or face",
      persistentHighFever: "High fever lasting more than 3–4 days",
      worseningAfterImprovement: "Improved, then suddenly worse",
    } as Record<string, string>,
    redBanner:
      "You have checked warning signs. With these, do not guess at a diagnosis — seek medical care, and for trouble breathing, chest pain or confusion call emergency services.",
    resultTitle: "More like",
    conditions: {
      cold: "a cold",
      flu: "the flu",
      covid: "COVID-19",
    } as Record<Condition, string>,
    needMore: "Check at least three symptoms to gauge the pattern.",
    tooClose:
      "The symptoms you checked occur about equally across all three — they cannot tell them apart. That is normal: the overlap is large.",
    caveat:
      "This is not a diagnosis. The flu and COVID-19 cannot be told apart by symptoms — they overlap almost completely. The only way to distinguish them and guide treatment (such as antivirals in the first days) is a test. Cold symptoms usually need no test; pronounced flu or COVID symptoms are worth testing.",
    disclaimer:
      "This tool is informational and does not replace a medical exam. It is not designed for children, pregnant people or those with chronic lung or heart disease, who should seek advice sooner for respiratory symptoms.",
  },
} as const;

export function SymptomChecker({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [pattern, setPattern] = useState<string[]>([]);
  const [reds, setReds] = useState<string[]>([]);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const r = useMemo(() => matchSymptoms(pattern), [pattern]);
  const order: Condition[] = ["cold", "flu", "covid"];

  return (
    <section
      data-accent="amber"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* ── Ввод ─────────────────────────────────────────────── */}
      <div className="grid gap-6 p-5 md:p-7">
        <div>
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.symptomsTitle}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {PATTERN_SYMPTOMS.map((s) => {
              const on = pattern.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(pattern, setPattern, s.id)}
                  aria-pressed={on}
                  className={`rounded-xl border px-3.5 py-2.5 text-left text-[0.9rem] font-medium transition-colors ${
                    on
                      ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                      : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {c.symptoms[s.id]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[#dc2626]">
            {c.redTitle}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {RED_FLAGS.map((id) => {
              const on = reds.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(reds, setReds, id)}
                  aria-pressed={on}
                  className={`rounded-xl border px-3.5 py-2.5 text-left text-[0.9rem] font-medium transition-colors ${
                    on
                      ? "border-[#dc2626] bg-[#fdecec] text-[#b31212]"
                      : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {c.redFlags[id]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────── */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        {reds.length > 0 && (
          <div className="mb-6 rounded-xl border border-[#dc2626] bg-[#fdecec] p-4">
            <p className="font-semibold text-[#b31212]">⚠️ {c.redTitle}</p>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[#7f1d1d]">{c.redBanner}</p>
          </div>
        )}

        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {c.resultTitle}
        </p>

        {r.leading ? (
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className="font-display text-[2.2rem] font-semibold leading-none"
              style={{ color: COND_COLOR[r.leading] }}
            >
              {c.conditions[r.leading]}
            </span>
          </div>
        ) : (
          <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
            {r.selectedCount < 3 ? c.needMore : c.tooClose}
          </p>
        )}

        {r.selectedCount >= 3 && (
          <div className="mt-5 grid gap-2.5">
            {order.map((cond) => (
              <div key={cond} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3">
                <span className="text-[0.88rem] font-medium">{c.conditions[cond]}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(r.shares[cond] * 100)}%`,
                      backgroundColor: COND_COLOR[cond],
                    }}
                    aria-hidden="true"
                  />
                </div>
                <span className="font-display text-[0.95rem] font-semibold tabular-nums">
                  {Math.round(r.shares[cond] * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="font-semibold">🧪 {locale === "ru" ? "Почему это не диагноз" : "Why this is not a diagnosis"}</p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">{c.caveat}</p>
        </div>

        <p className="mt-5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}
