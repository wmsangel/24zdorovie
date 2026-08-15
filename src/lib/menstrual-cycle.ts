/**
 * Расчётная часть калькулятора овуляции и цикла.
 *
 * Календарный расчёт стоит на одном допущении: лютеиновая фаза (от овуляции
 * до менструации) устойчивее фолликулярной. Поэтому овуляцию считают не от
 * начала цикла, а от следующей менструации — назад на длину лютеиновой фазы.
 * Это правило Огино, и оно точнее наивного «день 14», но не превращает
 * прогноз в дату: даже при регулярном цикле овуляция гуляет на несколько
 * дней (Bull et al., npj Digital Medicine, 2019 — 600 000 циклов), а точный
 * шестидневный интервал попадает на «дни 10–17» лишь у трети женщин
 * (Wilcox et al., BMJ, 2000). Поэтому наружу всегда отдаётся окно, а не день.
 *
 * Даты внутри — целые числа дней от 1970-01-01, без времени. Так расчёт
 * не зависит от часового пояса и перехода на летнее время: сложение дней
 * к Date легко даёт сутки ошибки, а здесь это просто арифметика.
 */

/* ==========================================================================
   Даты как целые дни
   ========================================================================== */

/** Число дней от 1970-01-01 */
export type Day = number;

const MS_PER_DAY = 86_400_000;

/** "2026-08-11" → номер дня. Формат — тот же, что отдаёт <input type="date"> */
export function parseDay(iso: string): Day {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, (m || 1) - 1, d || 1) / MS_PER_DAY);
}

export function toIso(day: Day): string {
  const { year, month, date } = dayParts(day);
  return `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
}

export function dayParts(day: Day): { year: number; month: number; date: number } {
  const d = new Date(day * MS_PER_DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, date: d.getUTCDate() };
}

/** 0 — понедельник: 1970-01-01 был четвергом, отсюда сдвиг на 3 */
export function weekday(day: Day): number {
  return (((day + 3) % 7) + 7) % 7;
}

/**
 * Сегодняшний день по локальному календарю пользователя.
 * Вызывать только на клиенте: на сервере это дата сборки.
 */
export function todayDay(): Day {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / MS_PER_DAY);
}

/* ==========================================================================
   Границы нормы
   ========================================================================== */

/** Пределы ввода — шире нормы: калькулятор должен принять и ненормальный цикл */
export const CYCLE_RANGE = { min: 20, max: 45 } as const;
export const PERIOD_RANGE = { min: 1, max: 10 } as const;
export const LUTEAL_RANGE = { min: 9, max: 17 } as const;
export const VARIATION_RANGE = { min: 0, max: 10 } as const;

/** Длина цикла у взрослой женщины (FIGO, 2018): вне этого — олиго- или полименорея */
export const NORMAL_CYCLE = { min: 21, max: 35 } as const;

/** Средняя длина цикла — 29 дней, а не 28 (Bull et al., 2019) */
export const DEFAULT_CYCLE = 28;
export const DEFAULT_PERIOD = 5;

/**
 * Лютеиновая фаза: 14 дней — классическое допущение календарного метода,
 * его и берём по умолчанию. Реальность чуть короче: по 612 613 циклам
 * (Bull et al., 2019) среднее — 12,4 дня при 95% ДИ 7–17. Разница
 * в полтора дня меньше ширины фертильного окна, поэтому на выводе она
 * не критична, но именно из-за неё овуляция чаще приходится на 15-й день
 * 28-дневного цикла, а не на 14-й (Soumpasis et al., 2020).
 * Короче 10 дней — недостаточность лютеиновой фазы, повод к обследованию.
 */
export const DEFAULT_LUTEAL = 14;
export const SHORT_LUTEAL = 10;

/** Дольше 8 дней кровотечение считают длительным (FIGO, 2018) */
export const LONG_PERIOD = 8;

/**
 * Разброс длины цикла, выше которого цикл считается нерегулярным.
 * FIGO допускает 7–9 дней в зависимости от возраста; берём нижнюю границу.
 */
export const IRREGULAR_VARIATION = 7;

/**
 * Фертильное окно: пять дней до овуляции и день овуляции.
 * Границы заданы выживаемостью гамет: сперматозоиды сохраняют способность
 * к оплодотворению до пяти суток в шеечной слизи, яйцеклетка — 12–24 часа
 * (Wilcox et al., NEJM, 1995). Сутки после овуляции добавлены как запас
 * на неточность самой даты овуляции, а не на живучесть яйцеклетки.
 */
export const FERTILE_BEFORE = 5;
export const FERTILE_AFTER = 1;

/**
 * Относительная вероятность зачатия по дням от овуляции (0 — день овуляции).
 * Форма кривой — по Wilcox et al., NEJM, 1995: при единственном половом акте
 * вероятность беременности растёт от ~10% за пять дней до овуляции
 * до ~30% в двое суток перед ней и падает почти до нуля через день после.
 * Здесь значения нормированы к пику: абсолютные проценты сильно зависят
 * от возраста и фертильности пары, а форма кривой воспроизводится стабильно.
 */
export const CONCEPTION_CURVE: Record<number, number> = {
  [-5]: 0.3,
  [-4]: 0.5,
  [-3]: 0.45,
  [-2]: 0.85,
  [-1]: 1,
  [0]: 0.9,
  [1]: 0.15,
};

/**
 * Средний срок от овуляции до родов — 266 дней.
 * Правило Негеле (280 дней от первого дня менструации) закладывает
 * овуляцию на 14-й день; здесь она рассчитана, поэтому считаем от неё.
 */
export const GESTATION_DAYS = 266;

/**
 * Когда домашний тест что-то покажет. ХГЧ появляется в моче через
 * 7–12 дней после овуляции — то есть чувствительный тест может показать
 * вторую полоску до задержки, но отрицательный результат в этот момент
 * ничего не значит. Уверенный ответ — с первого дня задержки.
 */
export const TEST_EARLIEST_AFTER_OVULATION = 12;

/* ==========================================================================
   Расчёт
   ========================================================================== */

export type Phase = "menstrual" | "follicular" | "fertile" | "ovulation" | "luteal" | "overdue";

export type CycleFlag =
  | "shortCycle"
  | "longCycle"
  | "irregular"
  | "longPeriod"
  | "shortLuteal"
  | "stale";

export type CycleForecast = {
  /** 0 — цикл, начавшийся указанной менструацией */
  index: number;
  start: Day;
  /** Последний день менструации */
  periodEnd: Day;
  ovulation: Day;
  /** Окно овуляции с учётом заявленного разброса длины цикла */
  ovulationFrom: Day;
  ovulationTo: Day;
  fertileFrom: Day;
  fertileTo: Day;
  /** Двое суток максимальной вероятности зачатия */
  peakFrom: Day;
  peakTo: Day;
  /** Ожидаемое начало следующей менструации */
  nextStart: Day;
  /** Раньше этого дня тест на беременность бессмыслен */
  testEarliest: Day;
  /** ПДР, если зачатие произойдёт в этом цикле */
  dueDate: Day;
};

export type CycleInput = {
  /** Первый день последней менструации */
  lmp: Day;
  cycleLength: number;
  periodLength: number;
  lutealLength: number;
  /** Насколько цикл гуляет в обе стороны, дней */
  variation: number;
  today: Day;
};

export type CycleResult = {
  /** Текущий и три следующих цикла */
  cycles: CycleForecast[];
  current: CycleForecast;
  /** День цикла, считая с первого дня менструации */
  dayOfCycle: number;
  phase: Phase;
  /** Отрицательное — овуляция уже прошла */
  daysToOvulation: number;
  daysToPeriod: number;
  /** Менструация не пришла в срок: дней от ожидаемой даты */
  overdueDays: number | null;
  /** Относительная вероятность зачатия сегодня, 0–1 */
  fertilityToday: number;
  flags: CycleFlag[];
};

export function forecastCycle(input: Omit<CycleInput, "today">, index: number): CycleForecast {
  const { lmp, cycleLength, periodLength, lutealLength, variation } = input;

  const start = lmp + index * cycleLength;
  const nextStart = start + cycleLength;
  const ovulation = nextStart - lutealLength;

  /**
   * Погрешность накапливается: чем дальше цикл, тем сильнее на его дату
   * влияет разброс всех предыдущих. Растёт она не линейно, а как корень
   * из числа циклов — независимые отклонения складываются именно так.
   */
  const drift = Math.round(variation * Math.sqrt(index + 1));

  return {
    index,
    start,
    periodEnd: start + periodLength - 1,
    ovulation,
    ovulationFrom: ovulation - drift,
    ovulationTo: ovulation + drift,
    fertileFrom: ovulation - FERTILE_BEFORE,
    fertileTo: ovulation + FERTILE_AFTER,
    peakFrom: ovulation - 2,
    peakTo: ovulation,
    nextStart,
    testEarliest: ovulation + TEST_EARLIEST_AFTER_OVULATION,
    dueDate: ovulation + GESTATION_DAYS,
  };
}

export function cyclePlan(input: CycleInput): CycleResult {
  const { lmp, cycleLength, periodLength, lutealLength, today } = input;

  const elapsed = today - lmp;

  /**
   * Пока менструация запаздывает не больше чем на две недели, текущим
   * считается цикл 0: это либо задержка, либо просто не обновлённая дата,
   * и в обоих случаях перескакивать на следующий цикл нельзя. Дальше
   * прогноз строится проекцией, но помечается флагом stale — считать
   * по данным месячной давности можно только очень условно.
   */
  const overdueRaw = elapsed - cycleLength;
  const overdue = overdueRaw >= 0 && overdueRaw < 15;
  const index = overdue ? 0 : Math.max(0, Math.floor(elapsed / cycleLength));

  const cycles = [0, 1, 2, 3].map((i) => forecastCycle(input, index + i));
  const current = cycles[0];

  const dayOfCycle = today - current.start + 1;
  const daysToOvulation = current.ovulation - today;
  const daysToPeriod = current.nextStart - today;

  let phase: Phase;
  if (overdue) phase = "overdue";
  else if (dayOfCycle <= periodLength) phase = "menstrual";
  else if (daysToOvulation === 0) phase = "ovulation";
  else if (today >= current.fertileFrom && today <= current.fertileTo) phase = "fertile";
  else if (daysToOvulation > 0) phase = "follicular";
  else phase = "luteal";

  const flags: CycleFlag[] = [];
  if (cycleLength < NORMAL_CYCLE.min) flags.push("shortCycle");
  if (cycleLength > NORMAL_CYCLE.max) flags.push("longCycle");
  if (input.variation > IRREGULAR_VARIATION) flags.push("irregular");
  if (periodLength >= LONG_PERIOD) flags.push("longPeriod");
  if (lutealLength < SHORT_LUTEAL) flags.push("shortLuteal");
  if (index > 0) flags.push("stale");

  return {
    cycles,
    current,
    dayOfCycle,
    phase,
    daysToOvulation,
    daysToPeriod,
    overdueDays: overdue ? overdueRaw : null,
    fertilityToday: CONCEPTION_CURVE[today - current.ovulation] ?? 0,
    flags,
  };
}
