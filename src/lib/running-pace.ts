/**
 * Темп бега, скорость и прогноз времени на дистанции.
 *
 * Прогноз времени на других дистанциях считается по формуле Питера Ригеля (1981):
 *   T2 = T1 × (D2 / D1) ^ 1.06
 * Показатель 1.06 отражает, что удельный темп на длинных дистанциях чуть падает.
 * Формула хорошо работает в диапазоне ~1500 м … марафон при похожей подготовке
 * и честно расходится на краях (спринт, ультра) — об этом предупреждаем в UI.
 */

export const RIEGEL_EXPONENT = 1.06;

/** Стандартные дистанции для прогноза, км */
export const RACE_DISTANCES = [
  { id: "5k", km: 5, label: "5 км" },
  { id: "10k", km: 10, label: "10 км" },
  { id: "half", km: 21.0975, label: "Полумарафон" },
  { id: "marathon", km: 42.195, label: "Марафон" },
] as const;

/** Секунды на километр (темп). */
export function pacePerKm(distanceKm: number, totalSeconds: number): number {
  if (distanceKm <= 0) return 0;
  return totalSeconds / distanceKm;
}

/** Скорость, км/ч. */
export function speedKmh(distanceKm: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 0;
  return distanceKm / (totalSeconds / 3600);
}

/** Прогноз времени на дистанции d2 по результату (t1, d1), формула Ригеля. */
export function riegelTime(t1Seconds: number, d1Km: number, d2Km: number): number {
  if (d1Km <= 0) return 0;
  return t1Seconds * Math.pow(d2Km / d1Km, RIEGEL_EXPONENT);
}

/** Разбить часы/минуты/секунды в общее число секунд. */
export function toSeconds(h: number, m: number, s: number): number {
  return Math.max(0, h) * 3600 + Math.max(0, m) * 60 + Math.max(0, s);
}

/** «1:23:45» для длинных и «7:30» для коротких промежутков. */
export function formatDuration(totalSeconds: number): string {
  const total = Math.round(totalSeconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Темп «5:00» мин/км из секунд на километр. */
export function formatPace(secondsPerKm: number): string {
  const total = Math.round(secondsPerKm);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export type PaceResult = {
  paceSec: number;
  speed: number;
  predictions: { id: string; km: number; label: string; seconds: number }[];
};

export function computePace(distanceKm: number, totalSeconds: number): PaceResult {
  const paceSec = pacePerKm(distanceKm, totalSeconds);
  const speed = speedKmh(distanceKm, totalSeconds);
  const predictions = RACE_DISTANCES.map((d) => ({
    id: d.id,
    km: d.km,
    label: d.label,
    seconds: riegelTime(totalSeconds, distanceKm, d.km),
  }));
  return { paceSec, speed, predictions };
}
