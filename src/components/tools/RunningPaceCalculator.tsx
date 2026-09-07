"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import { computePace, formatDuration, formatPace, toSeconds } from "@/lib/running-pace";

/**
 * Калькулятор темпа бега: по дистанции и времени считает темп (мин/км),
 * скорость (км/ч) и прогноз времени на 5 км, 10 км, полумарафоне и марафоне
 * по формуле Ригеля. Формулы — в src/lib/running-pace.ts.
 */

const COPY = {
  ru: {
    distance: "Дистанция",
    km: "км",
    time: "Время",
    h: "ч",
    m: "мин",
    s: "сек",
    pace: "Темп",
    perKm: "мин/км",
    speed: "Скорость",
    kmh: "км/ч",
    predTitle: "Прогноз времени на дистанциях",
    predHint:
      "Оценка по формуле Ригеля от вашего результата при похожей подготовке. Она точна на дистанциях примерно от 1500 м до марафона и расходится на спринте и ультра. Реальный марафон сильно зависит от выносливости и питания на трассе, а не только от текущего темпа.",
    labels: { "5k": "5 км", "10k": "10 км", half: "Полумарафон", marathon: "Марафон" },
    yours: "ваш забег",
  },
  en: {
    distance: "Distance",
    km: "km",
    time: "Time",
    h: "h",
    m: "min",
    s: "sec",
    pace: "Pace",
    perKm: "min/km",
    speed: "Speed",
    kmh: "km/h",
    predTitle: "Predicted times by distance",
    predHint:
      "Estimated with Riegel's formula from your result, assuming similar fitness. It's accurate from roughly 1500 m to the marathon and drifts for sprints and ultras. A real marathon depends heavily on endurance and fuelling, not just your current pace.",
    labels: { "5k": "5K", "10k": "10K", half: "Half marathon", marathon: "Marathon" },
    yours: "your run",
  },
} as const;

export function RunningPaceCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [distance, setDistance] = useState(10);
  const [h, setH] = useState(0);
  const [m, setM] = useState(50);
  const [s, setS] = useState(0);

  const totalSeconds = toSeconds(h, m, s);
  const r = useMemo(() => computePace(distance, totalSeconds), [distance, totalSeconds]);
  const valid = distance > 0 && totalSeconds > 0;

  const numField =
    "mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 font-display text-xl font-semibold tabular-nums";
  const label =
    "block text-[0.74rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]";

  return (
    <section
      data-accent="ocean"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* Ввод */}
      <div className="grid gap-6 p-5 sm:grid-cols-2 md:p-7">
        <div>
          <label htmlFor="rp-dist" className={label}>
            {c.distance}, {c.km}
          </label>
          <input
            id="rp-dist"
            type="number"
            inputMode="decimal"
            min={0.1}
            step={0.1}
            value={distance}
            onChange={(e) => setDistance(Math.max(0, Number(e.target.value) || 0))}
            className={numField}
          />
        </div>
        <div>
          <p className={label}>{c.time}</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                ["rp-h", h, setH, c.h, 99],
                ["rp-m", m, setM, c.m, 59],
                ["rp-s", s, setS, c.s, 59],
              ] as const
            ).map(([id, val, set, unit, maxV]) => (
              <div key={id}>
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={maxV}
                  value={val}
                  onChange={(e) => set(Math.max(0, Math.min(maxV, Number(e.target.value) || 0)))}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-2.5 py-2.5 text-center font-display text-xl font-semibold tabular-nums"
                  aria-label={unit}
                />
                <p className="mt-1 text-center text-[0.72rem] text-[var(--ink-faint)]">{unit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Темп и скорость */}
      <div className="grid grid-cols-2 border-t border-[var(--line)] bg-[var(--accent-tint)]">
        <div className="border-r border-[var(--line)] p-5 md:p-7">
          <p className={label}>{c.pace}</p>
          <p className="mt-2 font-display text-[2.4rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
            {valid ? formatPace(r.paceSec) : "—"}
          </p>
          <p className="mt-1 text-[0.85rem] text-[var(--ink-faint)]">{c.perKm}</p>
        </div>
        <div className="p-5 md:p-7">
          <p className={label}>{c.speed}</p>
          <p className="mt-2 font-display text-[2.4rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
            {valid ? r.speed.toFixed(1) : "—"}
          </p>
          <p className="mt-1 text-[0.85rem] text-[var(--ink-faint)]">{c.kmh}</p>
        </div>
      </div>

      {/* Прогноз по дистанциям */}
      <div className="border-t border-[var(--line)] p-5 md:p-7">
        <p className={label}>{c.predTitle}</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--line)]">
          {r.predictions.map((p, i) => {
            const isYours = Math.abs(p.km - distance) < 0.05;
            return (
              <div
                key={p.id}
                className={`grid grid-cols-[1fr_auto] items-center gap-2 px-3.5 py-2.5 text-[0.95rem] ${
                  i % 2 ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]"
                }`}
              >
                <span className="text-[var(--ink-soft)]">
                  {c.labels[p.id as keyof typeof c.labels]}{" "}
                  {isYours && (
                    <span className="text-[0.78rem] text-[var(--ink-faint)]">· {c.yours}</span>
                  )}
                </span>
                <span className="font-display font-semibold tabular-nums">
                  {valid ? formatDuration(p.seconds) : "—"}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 max-w-2xl text-[0.85rem] leading-relaxed text-[var(--ink-faint)]">
          {c.predHint}
        </p>
      </div>
    </section>
  );
}
