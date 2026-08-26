import type { Locale } from "@/config/site";

/**
 * Классификация артериального давления по категориям ESC/ESH (Европа, Россия).
 *
 * Категория определяется по ТОЙ границе, что выше: если систолическое и
 * диастолическое попадают в разные категории, берётся более высокая. Пороги —
 * из рекомендаций ESC/ESH; в США (ACC/AHA 2017) сетка сдвинута ниже, об этом
 * сказано на странице инструмента. Это справочная классификация, не диагноз.
 */
export type BpCategory = {
  id: string;
  name: Record<Locale, string>;
  /** hex-акцент для плашки результата */
  color: string;
  /** Диапазон САД для подписи таблицы */
  sbp: string;
  join: Record<Locale, string>;
  /** Диапазон ДАД для подписи таблицы */
  dbp: string;
  blurb: Record<Locale, string>;
};

export const BP_CATEGORIES: BpCategory[] = [
  {
    id: "optimal",
    name: { ru: "Оптимальное", en: "Optimal" },
    color: "#1fa268",
    sbp: "< 120",
    join: { ru: "и", en: "and" },
    dbp: "< 80",
    blurb: {
      ru: "Идеальный диапазон. Поддерживайте образ жизни и проверяйте давление хотя бы раз в год.",
      en: "The ideal range. Keep your habits and check your pressure at least once a year.",
    },
  },
  {
    id: "normal",
    name: { ru: "Нормальное", en: "Normal" },
    color: "#55771f",
    sbp: "120–129",
    join: { ru: "и/или", en: "and/or" },
    dbp: "80–84",
    blurb: {
      ru: "В пределах нормы. Хороший повод удержать вес, активность и умеренность с солью.",
      en: "Within normal limits. A good reason to keep your weight, activity and salt in check.",
    },
  },
  {
    id: "high-normal",
    name: { ru: "Высокое нормальное", en: "High-normal" },
    color: "#b8790a",
    sbp: "130–139",
    join: { ru: "и/или", en: "and/or" },
    dbp: "85–89",
    blurb: {
      ru: "Пограничная зона. Стоит начать регулярно измерять давление дома и обсудить образ жизни с врачом.",
      en: "A borderline zone. Worth measuring at home regularly and discussing lifestyle with a doctor.",
    },
  },
  {
    id: "grade-1",
    name: { ru: "Гипертония 1 степени", en: "Grade 1 hypertension" },
    color: "#d97706",
    sbp: "140–159",
    join: { ru: "и/или", en: "and/or" },
    dbp: "90–99",
    blurb: {
      ru: "Повышенное давление. Нужны повторные измерения в разные дни и консультация врача — одного замера мало для диагноза.",
      en: "Raised pressure. It needs repeat measurements on different days and a doctor's review — one reading is not a diagnosis.",
    },
  },
  {
    id: "grade-2",
    name: { ru: "Гипертония 2 степени", en: "Grade 2 hypertension" },
    color: "#b8447a",
    sbp: "160–179",
    join: { ru: "и/или", en: "and/or" },
    dbp: "100–109",
    blurb: {
      ru: "Выраженно повышенное давление. Обратитесь к врачу в ближайшее время — скорее всего, потребуется лечение.",
      en: "Markedly raised pressure. See a doctor soon — treatment is likely needed.",
    },
  },
  {
    id: "grade-3",
    name: { ru: "Гипертония 3 степени", en: "Grade 3 hypertension" },
    color: "#b3402c",
    sbp: "≥ 180",
    join: { ru: "и/или", en: "and/or" },
    dbp: "≥ 110",
    blurb: {
      ru: "Сильно повышенное давление. Нужна медицинская помощь. При боли в груди, одышке, нарушении зрения или речи — вызывайте скорую.",
      en: "Severely raised pressure. Seek medical care. With chest pain, breathlessness, vision or speech problems — call emergency services.",
    },
  },
];

function sbpIndex(sbp: number): number {
  if (sbp < 120) return 0;
  if (sbp < 130) return 1;
  if (sbp < 140) return 2;
  if (sbp < 160) return 3;
  if (sbp < 180) return 4;
  return 5;
}

function dbpIndex(dbp: number): number {
  if (dbp < 80) return 0;
  if (dbp < 85) return 1;
  if (dbp < 90) return 2;
  if (dbp < 100) return 3;
  if (dbp < 110) return 4;
  return 5;
}

export type BpResult = {
  index: number;
  category: BpCategory;
  /** Какой показатель задал категорию: "sbp" | "dbp" | "both" */
  driver: "sbp" | "dbp" | "both";
  /** Изолированная систолическая гипертония: САД ≥140 при ДАД <90 */
  isolatedSystolic: boolean;
  /** Криз: САД ≥180 или ДАД ≥110 — нужна срочная помощь */
  crisis: boolean;
};

export function classifyBp(sbp: number, dbp: number): BpResult {
  const si = sbpIndex(sbp);
  const di = dbpIndex(dbp);
  const index = Math.max(si, di);
  const driver = si === di ? "both" : si > di ? "sbp" : "dbp";
  return {
    index,
    category: BP_CATEGORIES[index],
    driver,
    isolatedSystolic: sbp >= 140 && dbp < 90,
    crisis: sbp >= 180 || dbp >= 110,
  };
}
