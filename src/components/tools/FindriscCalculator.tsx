"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  FINDRISC_MAX,
  FINDRISC_QUESTIONS,
  type FindriscCategoryKey,
  type FindriscQuestion,
  findriscCategory,
  scoreFindrisc,
} from "@/lib/findrisc";

/**
 * FINDRISC — калькулятор 10-летнего риска диабета 2 типа.
 *
 * Валидированная шкала: баллы и пороги — в src/lib/findrisc.ts (со ссылкой на
 * Lindström & Tuomilehto, 2003). Здесь только локализованные формулировки и вывод.
 * Порядок вариантов ответа обязан совпадать с индексами баллов в FINDRISC_POINTS.
 * Пол влияет лишь на сантиметровые границы талии, в сумму баллов не входит.
 */

type Sex = "male" | "female";

const ARTICLE = {
  ru: "/ru/weight/insulinorezistentnost",
  en: "/en/weight/insulin-resistance",
};
const CONVERTER = {
  ru: "/ru/tools/blood-test-unit-converter",
  en: "/en/tools/blood-test-unit-converter",
};
const BMI_TOOL = {
  ru: "/ru/tools/ideal-weight-calculator",
  en: "/en/tools/ideal-weight-calculator",
};

const COPY = {
  ru: {
    intro: "8 вопросов, около минуты. Оценивает риск диабета 2 типа на 10 лет вперёд.",
    sexLabel: "Пол",
    male: "Мужской",
    female: "Женский",
    sexHint: "нужен для границ талии",
    progress: (done: number) => `Отвечено ${done} из ${FINDRISC_QUESTIONS.length}`,
    reset: "Начать заново",
    pickSexFirst: "Сначала выберите пол выше — от него зависят границы талии.",
    bmiHint: "Не знаете свой ИМТ?",
    bmiLink: "Посчитайте",
    questions: {
      age: "Ваш возраст",
      bmi: "Индекс массы тела (ИМТ)",
      waist: "Окружность талии (на уровне пупка)",
      activity: "Каждый день не меньше 30 минут физической активности (работа + досуг)?",
      diet: "Как часто вы едите овощи, фрукты или ягоды?",
      meds: "Принимали ли вы когда-нибудь регулярно лекарства от повышенного давления?",
      highGlucose:
        "Находили ли у вас когда-нибудь повышенный сахар в крови (диспансеризация, болезнь, беременность)?",
      family: "Был ли диабет у кровных родственников?",
    },
    options: {
      age: ["до 45 лет", "45–54 года", "55–64 года", "старше 64 лет"],
      bmi: ["меньше 25", "25–30", "больше 30"],
      waistMale: ["меньше 94 см", "94–102 см", "больше 102 см"],
      waistFemale: ["меньше 80 см", "80–88 см", "больше 88 см"],
      activity: ["Да", "Нет"],
      diet: ["Каждый день", "Не каждый день"],
      meds: ["Нет", "Да"],
      highGlucose: ["Нет", "Да"],
      family: [
        "Нет",
        "Да: бабушка/дедушка, тётя/дядя, двоюродные",
        "Да: родители, брат/сестра, мой ребёнок",
      ],
    },
    resultTitle: "Ваш результат",
    points: "баллов",
    riskLabel: "Риск диабета 2 типа в ближайшие 10 лет",
    categories: {
      low: "Низкий риск",
      slightlyElevated: "Слегка повышенный риск",
      moderate: "Умеренный риск",
      high: "Высокий риск",
      veryHigh: "Очень высокий риск",
    } as Record<FindriscCategoryKey, string>,
    advice: {
      low: "Держите привычки, которые уже работают: движение, вес в норме, овощи каждый день. Пересдавать тест раз в несколько лет достаточно.",
      slightlyElevated:
        "Поводов для тревоги нет, но это хорошая точка, чтобы подкрутить образ жизни: больше движения и клетчатки, меньше сладких напитков. Повторите тест через год.",
      moderate:
        "Риск ощутимый. Имеет смысл обсудить с врачом анализ (глюкоза натощак или HbA1c) и всерьёз заняться весом и активностью — на этой стадии изменения образа жизни работают лучше всего.",
      high: "Риск высокий. Сдайте глюкозу натощак или HbA1c и обсудите результат с врачом. Снижение веса на 5–7% и регулярная активность заметно снижают вероятность диабета.",
      veryHigh:
        "Очень высокий риск. Не откладывайте: сдайте глюкозу натощак или HbA1c и обратитесь к врачу — возможно, речь уже о преддиабете, где раннее вмешательство особенно важно.",
    } as Record<FindriscCategoryKey, string>,
    disclaimerTitle: "Это скрининг, а не диагноз",
    disclaimer:
      "FINDRISC оценивает вероятность, но не измеряет сахар и не ставит диагноз. Подтвердить или исключить диабет можно только анализом крови и консультацией врача.",
    readMore: "Инсулинорезистентность: как проверить и что снижает",
    convertMore: "Конвертер единиц анализов крови (глюкоза, HbA1c)",
    unanswered: "Ответьте на все вопросы, чтобы увидеть результат.",
  },
  en: {
    intro: "8 questions, about a minute. Estimates your 10-year risk of type 2 diabetes.",
    sexLabel: "Sex",
    male: "Male",
    female: "Female",
    sexHint: "needed for waist thresholds",
    progress: (done: number) => `${done} of ${FINDRISC_QUESTIONS.length} answered`,
    reset: "Start over",
    pickSexFirst: "Choose your sex above first — it sets the waist thresholds.",
    bmiHint: "Don't know your BMI?",
    bmiLink: "Calculate it",
    questions: {
      age: "Your age",
      bmi: "Body mass index (BMI)",
      waist: "Waist circumference (at the navel)",
      activity: "At least 30 minutes of physical activity every day (work + leisure)?",
      diet: "How often do you eat vegetables, fruit or berries?",
      meds: "Have you ever regularly taken medication for high blood pressure?",
      highGlucose:
        "Have you ever been found to have high blood glucose (a check-up, an illness, pregnancy)?",
      family: "Any blood relatives with diabetes?",
    },
    options: {
      age: ["under 45", "45–54", "55–64", "over 64"],
      bmi: ["under 25", "25–30", "over 30"],
      waistMale: ["under 94 cm", "94–102 cm", "over 102 cm"],
      waistFemale: ["under 80 cm", "80–88 cm", "over 88 cm"],
      activity: ["Yes", "No"],
      diet: ["Every day", "Not every day"],
      meds: ["No", "Yes"],
      highGlucose: ["No", "Yes"],
      family: [
        "No",
        "Yes: grandparent, aunt/uncle, cousin",
        "Yes: parent, sibling, my own child",
      ],
    },
    resultTitle: "Your result",
    points: "points",
    riskLabel: "Risk of type 2 diabetes within 10 years",
    categories: {
      low: "Low risk",
      slightlyElevated: "Slightly elevated risk",
      moderate: "Moderate risk",
      high: "High risk",
      veryHigh: "Very high risk",
    } as Record<FindriscCategoryKey, string>,
    advice: {
      low: "Keep the habits that already work: movement, a healthy weight, vegetables every day. Retaking the test every few years is enough.",
      slightlyElevated:
        "Nothing to worry about, but a good point to fine-tune your lifestyle: more movement and fiber, fewer sugary drinks. Retake the test in a year.",
      moderate:
        "The risk is meaningful. Worth discussing a blood test (fasting glucose or HbA1c) with a doctor and taking weight and activity seriously — lifestyle change works best at this stage.",
      high: "High risk. Get a fasting glucose or HbA1c test and discuss it with a doctor. Losing 5–7% of body weight and regular activity noticeably lower the odds of diabetes.",
      veryHigh:
        "Very high risk. Don't put it off: get a fasting glucose or HbA1c test and see a doctor — this may already be prediabetes, where early action matters most.",
    } as Record<FindriscCategoryKey, string>,
    disclaimerTitle: "This is a screen, not a diagnosis",
    disclaimer:
      "FINDRISC estimates probability; it does not measure blood sugar or diagnose anything. Only a blood test and a doctor can confirm or rule out diabetes.",
    readMore: "Insulin resistance: how to check it and what lowers it",
    convertMore: "Blood test unit converter (glucose, HbA1c)",
    unanswered: "Answer every question to see your result.",
  },
} as const;

const ACCENT: Record<FindriscCategoryKey, string> = {
  low: "leaf",
  slightlyElevated: "moss",
  moderate: "amber",
  high: "clay",
  veryHigh: "berry",
};

type Answers = Partial<Record<FindriscQuestion, number>>;

export function FindriscCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;
  const [sex, setSex] = useState<Sex | null>(null);
  const [answers, setAnswers] = useState<Answers>({});

  const done = FINDRISC_QUESTIONS.filter((q) => answers[q] != null).length;
  const complete = sex != null && done === FINDRISC_QUESTIONS.length;

  const result = useMemo(() => {
    if (!complete) return null;
    const total = scoreFindrisc(answers);
    const cat = findriscCategory(total);
    return { total, cat };
  }, [answers, complete]);

  const accent = result ? ACCENT[result.cat.key] : "ocean";

  function optionsFor(q: FindriscQuestion): readonly string[] {
    if (q === "waist") return sex === "female" ? c.options.waistFemale : c.options.waistMale;
    return (c.options as Record<string, readonly string[]>)[q];
  }

  return (
    <section
      data-accent={accent}
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      <div className="border-b border-[var(--line)] p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.95rem] text-[var(--ink-soft)]">{c.intro}</p>
          {(done > 0 || sex) && (
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setSex(null);
              }}
              className="text-[0.84rem] font-semibold text-[var(--ink-faint)] underline underline-offset-2 transition-colors hover:text-[var(--brand-strong)]"
            >
              {c.reset}
            </button>
          )}
        </div>

        {/* Пол */}
        <div className="mt-4">
          <p className="text-[0.9rem] font-semibold">
            {c.sexLabel}{" "}
            <span className="font-normal text-[var(--ink-faint)]">({c.sexHint})</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(["male", "female"] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                className={`rounded-full border px-3 py-1.5 text-[0.82rem] font-semibold transition-colors ${
                  sex === s
                    ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                    : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {s === "male" ? c.male : c.female}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-300"
              style={{ width: `${(done / FINDRISC_QUESTIONS.length) * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-[0.78rem] tabular-nums text-[var(--ink-faint)]">
            {c.progress(done)}
          </p>
        </div>
      </div>

      {/* ── Вопросы ──────────────────────────────────────────── */}
      <ol className="divide-y divide-[var(--line)]">
        {FINDRISC_QUESTIONS.map((q, i) => {
          const waistLocked = q === "waist" && sex == null;
          return (
            <li key={q} className="p-5 md:px-7">
              <fieldset disabled={waistLocked}>
                <legend className="text-[0.98rem] leading-snug">
                  <span className="mr-1.5 tabular-nums text-[var(--ink-faint)]">{i + 1}.</span>
                  {c.questions[q]}
                </legend>
                {q === "bmi" && (
                  <p className="mt-1 text-[0.82rem] text-[var(--ink-faint)]">
                    {c.bmiHint}{" "}
                    <a
                      href={BMI_TOOL[locale]}
                      className="font-semibold text-[var(--brand-strong)] underline underline-offset-2"
                    >
                      {c.bmiLink}
                    </a>
                  </p>
                )}
                {waistLocked ? (
                  <p className="mt-3 text-[0.85rem] text-[var(--ink-faint)]">{c.pickSexFirst}</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {optionsFor(q).map((label, value) => {
                      const active = answers[q] === value;
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
                            name={`findrisc-${q}`}
                            value={value}
                            checked={active}
                            onChange={() => setAnswers((a) => ({ ...a, [q]: value }))}
                            className="sr-only"
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            </li>
          );
        })}
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
                  / {FINDRISC_MAX} {c.points}
                </span>
              </p>
              <p className="font-display text-xl font-semibold text-[var(--accent)]">
                {c.categories[result.cat.key]}
              </p>
            </div>
            <p className="mt-2 text-[0.95rem] text-[var(--ink-soft)]">
              {c.riskLabel}: <span className="font-semibold">{locale === "ru" ? result.cat.risk : result.cat.riskEn}</span>
            </p>
            <p className="mt-4 text-[0.98rem] leading-relaxed">{c.advice[result.cat.key]}</p>
          </>
        )}

        <div className="mt-6 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
          <p className="font-semibold">ℹ️ {c.disclaimerTitle}</p>
          <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
            {c.disclaimer}
          </p>
          <p className="mt-3 flex flex-col gap-1.5 text-[0.9rem]">
            <a
              href={ARTICLE[locale]}
              className="font-semibold text-[var(--brand-strong)] underline underline-offset-2"
            >
              → {c.readMore}
            </a>
            <a
              href={CONVERTER[locale]}
              className="font-semibold text-[var(--brand-strong)] underline underline-offset-2"
            >
              → {c.convertMore}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
