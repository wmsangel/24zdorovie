/**
 * Расчётная часть калькулятора сна.
 *
 * Честная рамка: «правило 90 минут» — это среднее по популяции, а не
 * ваш личный цикл. Длительность цикла у здоровых взрослых варьирует
 * от 70 до 120 минут, меняется в течение ночи (под утро циклы длиннее
 * за счёт REM-фазы) и не постоянна от ночи к ночи. Поэтому калькулятор
 * даёт окно вариантов, а не «идеальное время пробуждения до минуты».
 *
 * Всё внутри — минуты от полуночи.
 */

/** Средняя длительность цикла сна, минуты (Carskadon & Dement, 2011) */
export const CYCLE_MINUTES = 90;

/** Диапазон, в котором цикл реально гуляет у здоровых взрослых */
export const CYCLE_RANGE = { min: 70, max: 120 } as const;

/**
 * Латентность засыпания — время от «лёг» до «уснул».
 * Норма у здорового взрослого 10–20 минут: меньше 5 говорит
 * о недосыпе, больше 30 регулярно — признак инсомнии.
 */
export const DEFAULT_LATENCY = 15;

/* ==========================================================================
   Работа со временем
   ========================================================================== */

/** "23:30" → 1410 */
export function parseTime(value: string): number {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** 1410 → "23:30"; значения за пределами суток заворачиваются */
export function formatTime(minutes: number): string {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* ==========================================================================
   Расчёт вариантов
   ========================================================================== */

export type CycleOption = {
  cycles: number;
  /** Во сколько ложиться или просыпаться, минуты от полуночи */
  time: number;
  /** Чистый сон без времени на засыпание, минуты */
  sleepMinutes: number;
};

/** Сколько циклов имеет смысл предлагать: меньше четырёх — уже недосып */
const CYCLE_CHOICES = [6, 5, 4, 3] as const;

export type CycleSettings = {
  cycleLength?: number;
  latency?: number;
};

/** Известно время подъёма — считаем, когда ложиться */
export function bedtimesForWake(wakeAt: number, settings: CycleSettings = {}): CycleOption[] {
  const cycle = settings.cycleLength ?? CYCLE_MINUTES;
  const latency = settings.latency ?? DEFAULT_LATENCY;

  return CYCLE_CHOICES.map((cycles) => ({
    cycles,
    time: wakeAt - cycles * cycle - latency,
    sleepMinutes: cycles * cycle,
  }));
}

/** Известно время отбоя — считаем, когда просыпаться */
export function wakeTimesForBed(bedAt: number, settings: CycleSettings = {}): CycleOption[] {
  const cycle = settings.cycleLength ?? CYCLE_MINUTES;
  const latency = settings.latency ?? DEFAULT_LATENCY;

  return CYCLE_CHOICES.map((cycles) => ({
    cycles,
    time: bedAt + latency + cycles * cycle,
    sleepMinutes: cycles * cycle,
  })).reverse();
}

/**
 * Окно пробуждения при крайних значениях длительности цикла.
 * Показывает, во что превращается «точное» время, если ваш цикл
 * не 90 минут, а 75 или 105.
 */
export function cycleWindow(anchor: number, cycles: number, latency: number, forward: boolean) {
  const shortest = cycles * CYCLE_RANGE.min;
  const longest = cycles * CYCLE_RANGE.max;
  return forward
    ? { from: anchor + latency + shortest, to: anchor + latency + longest }
    : { from: anchor - latency - longest, to: anchor - latency - shortest };
}

/* ==========================================================================
   Норма сна и недосып
   ========================================================================== */

export type AgeBand = "teen" | "young" | "adult" | "older";

/**
 * Рекомендации National Sleep Foundation (Hirshkowitz et al.,
 * Sleep Health, 2015). Это диапазон нормы, а не цель: попадание
 * в него у большинства людей связано с лучшим самочувствием,
 * но короткоспящие с генетическим вариантом DEC2 существуют —
 * их доля меньше процента, хотя относят себя к ним многие.
 */
export const SLEEP_NEED: Record<AgeBand, { min: number; max: number }> = {
  teen: { min: 8, max: 10 },
  young: { min: 7, max: 9 },
  adult: { min: 7, max: 9 },
  older: { min: 7, max: 8 },
};

export function ageBand(age: number): AgeBand {
  if (age < 18) return "teen";
  if (age < 26) return "young";
  if (age < 65) return "adult";
  return "older";
}

export type SleepDebt = {
  /** Часов недобрано за неделю относительно нижней границы нормы */
  weekly: number;
  /** Среднее за ночь, часы */
  perNight: number;
  severity: "none" | "mild" | "significant" | "severe";
};

/**
 * Недосып накапливается: в исследовании Van Dongen и соавт. (Sleep, 2003)
 * две недели по шесть часов ухудшали когнитивные тесты примерно так же,
 * как двое суток без сна подряд, — при том что испытуемые оценивали
 * свою сонливость как умеренную и почти не растущую.
 */
export function sleepDebt(actualHours: number, age: number, days = 7): SleepDebt {
  const need = SLEEP_NEED[ageBand(age)].min;
  const perNight = Math.max(0, need - actualHours);
  const weekly = perNight * days;

  const severity: SleepDebt["severity"] =
    perNight === 0 ? "none" : perNight < 0.5 ? "mild" : perNight < 1.5 ? "significant" : "severe";

  return { weekly, perNight, severity };
}

/* ==========================================================================
   Дневной сон
   ========================================================================== */

/**
 * Короткий сон 10–20 минут восстанавливает бодрость без инерции —
 * человек не успевает уйти в глубокие стадии. 30–60 минут дают
 * ту самую разбитость после дневного сна: пробуждение приходится
 * на медленноволновой сон. Полный цикл в 90 минут снова безопасен
 * (Brooks & Lack, Sleep, 2006).
 */
export const NAP_OPTIONS = [
  { minutes: 20, id: "power" },
  { minutes: 45, id: "avoid" },
  { minutes: 90, id: "full" },
] as const;
