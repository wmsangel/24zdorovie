"use client";

import { useState } from "react";
import type { Locale } from "@/config/site";
import { maxHeartRate, targetHr, type Sex } from "@/lib/heart-rate";

/**
 * Калькулятор зоны 2 пульса.
 *
 * Зона 2 = 60–70% (её границы совпадают с пятизонной моделью в
 * src/lib/heart-rate.ts и калькулятором всех зон). Максимум пульса —
 * по Tanaka (муж.) / Gulati (жен.). Если задан пульс покоя, считаем по
 * резерву (Карвонен) — точнее; иначе по проценту от максимума.
 */

const Z2_FROM = 0.6;
const Z2_TO = 0.7;

const COPY = {
  ru: {
    age: "Возраст",
    sex: "Пол",
    male: "Мужской",
    female: "Женский",
    resting: "Пульс покоя (необязательно)",
    restingHint: "Измеряется утром в покое. С ним расчёт точнее (метод Карвонена).",
    result: "Ваша зона 2",
    bpm: "уд/мин",
    methodKarvonen: "по резерву пульса (Карвонен), пульс покоя учтён",
    methodPercent: "по проценту от максимума; с пульсом покоя будет точнее",
    maxLabel: "Максимум пульса",
    maxNote: "Tanaka / Gulati — оценка по возрасту, индивидуальный максимум даёт нагрузочный тест.",
    talk: "Проверка разговором: в зоне 2 вы можете говорить целыми фразами, но петь уже трудно. Если задыхаетесь — это уже зона 3, замедлитесь.",
    disclaimer:
      "Это оценка по формуле, а не медицинская рекомендация. Бета-блокаторы, антиаритмики, препараты от давления, аритмия и кардиостимулятор делают возрастные формулы неприменимыми — тогда зоны определяют по нагрузочному тесту у врача.",
  },
  en: {
    age: "Age",
    sex: "Sex",
    male: "Male",
    female: "Female",
    resting: "Resting heart rate (optional)",
    restingHint: "Measured at rest in the morning. With it the result is more accurate (Karvonen method).",
    result: "Your Zone 2",
    bpm: "bpm",
    methodKarvonen: "by heart-rate reserve (Karvonen), resting HR included",
    methodPercent: "by percentage of max; adding resting HR makes it more accurate",
    maxLabel: "Maximum heart rate",
    maxNote: "Tanaka / Gulati is an age-based estimate; your true max comes from an exercise test.",
    talk: "Talk test: in Zone 2 you can speak in full sentences but singing is already hard. If you are breathless, that is Zone 3 — slow down.",
    disclaimer:
      "This is a formula estimate, not medical advice. Beta blockers, antiarrhythmics and blood-pressure drugs, arrhythmia and a pacemaker make age-based formulas meaningless — then zones come from a clinical exercise test.",
  },
} as const;

export function Zone2Calculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [ageStr, setAgeStr] = useState("40");
  const [sex, setSex] = useState<Sex>("male");
  const [restStr, setRestStr] = useState("");

  const age = parseInt(ageStr, 10);
  const rest = parseInt(restStr, 10);
  const ageOk = Number.isFinite(age) && age >= 10 && age <= 100;
  const hasRest = Number.isFinite(rest) && rest >= 30 && rest <= 120;

  const hrMax = ageOk ? Math.round(maxHeartRate(age, sex)) : NaN;
  const method = hasRest ? "karvonen" : "percent-max";
  const from = ageOk ? Math.round(targetHr(Z2_FROM, hrMax, hasRest ? rest : 0, method)) : NaN;
  const to = ageOk ? Math.round(targetHr(Z2_TO, hrMax, hasRest ? rest : 0, method)) : NaN;

  return (
    <section
      data-accent="ocean"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      <div className="grid gap-5 p-5 md:p-7">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
          <div>
            <label
              htmlFor="z2-age"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.age}
            </label>
            <input
              id="z2-age"
              type="number"
              inputMode="numeric"
              min={10}
              max={100}
              value={ageStr}
              onChange={(e) => setAgeStr(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-2xl font-semibold tabular-nums"
            />
          </div>
          <div>
            <label
              htmlFor="z2-sex"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.sex}
            </label>
            <select
              id="z2-sex"
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-semibold"
            >
              <option value="male">{c.male}</option>
              <option value="female">{c.female}</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="z2-rest"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.resting}
          </label>
          <input
            id="z2-rest"
            type="number"
            inputMode="numeric"
            min={30}
            max={120}
            placeholder="—"
            value={restStr}
            onChange={(e) => setRestStr(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
          />
          <p className="mt-1.5 text-[0.82rem] leading-relaxed text-[var(--ink-faint)]">{c.restingHint}</p>
        </div>
      </div>

      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {c.result}
        </p>
        <p className="mt-1 font-display text-[2rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
          {ageOk ? `${from}–${to}` : "—"}{" "}
          <span className="text-[1.1rem] font-semibold">{c.bpm}</span>
        </p>
        <p className="mt-2 text-[0.9rem] text-[var(--ink-soft)]">
          {hasRest ? c.methodKarvonen : c.methodPercent}
        </p>

        {ageOk && (
          <p className="mt-4 text-[0.92rem] tabular-nums">
            {c.maxLabel}: <strong>{hrMax} {c.bpm}</strong>{" "}
            <span className="text-[var(--ink-faint)]">— {c.maxNote}</span>
          </p>
        )}

        <p className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
          🗣️ {c.talk}
        </p>

        <p className="mt-4 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}
