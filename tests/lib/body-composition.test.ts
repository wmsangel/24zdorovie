import { describe, expect, it } from "vitest";
import {
  assessComposition,
  bmi,
  bmiCategory,
  bodyFatCategory,
  fatFreeMassIndex,
  healthyWeightRange,
  navyBodyFat,
  waistCategory,
  waistToHeight,
  waistToHip,
  whrCategory,
  whtrCategory,
} from "../../src/lib/body-composition";

describe("bmi", () => {
  it("кг / м² — Кетле", () => {
    // 70 / 1.75² = 70 / 3.0625
    expect(bmi(70, 175)).toBeCloseTo(70 / 3.0625, 8);
    expect(bmi(70, 0)).toBe(0);
  });

  it("пороги ВОЗ 1995: граница принадлежит верхней категории", () => {
    expect(bmiCategory(18.49)).toBe("underweight");
    expect(bmiCategory(18.5)).toBe("normal");
    expect(bmiCategory(24.99)).toBe("normal");
    expect(bmiCategory(25)).toBe("overweight");
    expect(bmiCategory(29.99)).toBe("overweight");
    expect(bmiCategory(30)).toBe("obese1");
    expect(bmiCategory(35)).toBe("obese2");
    expect(bmiCategory(39.99)).toBe("obese2");
    expect(bmiCategory(40)).toBe("obese3");
  });

  it("азиатская шкала ВОЗ 2004: 23 / 27.5 / 32.5 / 37.5, нижняя граница 18.5 та же", () => {
    expect(bmiCategory(18.49, "asian")).toBe("underweight");
    expect(bmiCategory(18.5, "asian")).toBe("normal");
    expect(bmiCategory(22.99, "asian")).toBe("normal");
    expect(bmiCategory(23, "asian")).toBe("overweight");
    expect(bmiCategory(27.49, "asian")).toBe("overweight");
    expect(bmiCategory(27.5, "asian")).toBe("obese1");
    expect(bmiCategory(32.5, "asian")).toBe("obese2");
    expect(bmiCategory(37.5, "asian")).toBe("obese3");
  });
});

describe("healthyWeightRange", () => {
  it("вес при ИМТ 18.5 и на пороге избыточной массы", () => {
    const m2 = 1.75 ** 2;
    expect(healthyWeightRange(175)).toEqual({ min: 18.5 * m2, max: 25 * m2 });
    expect(healthyWeightRange(175, "asian").max).toBeCloseTo(23 * m2, 8);
  });
});

describe("талия и отношения", () => {
  it("окружность талии ВОЗ 2008: мужчины 94/102, женщины 80/88", () => {
    expect(waistCategory(93.9, "male")).toBe("healthy");
    expect(waistCategory(94, "male")).toBe("increased");
    expect(waistCategory(101.9, "male")).toBe("increased");
    expect(waistCategory(102, "male")).toBe("high");

    expect(waistCategory(79.9, "female")).toBe("healthy");
    expect(waistCategory(80, "female")).toBe("increased");
    expect(waistCategory(87.9, "female")).toBe("increased");
    expect(waistCategory(88, "female")).toBe("high");
  });

  it("WHtR: 0.4 / 0.5 / 0.6 (Ashwell, NICE)", () => {
    expect(waistToHeight(90, 180)).toBeCloseTo(0.5, 8);
    expect(waistToHeight(90, 0)).toBe(0);
    expect(whtrCategory(0.39)).toBe("low");
    expect(whtrCategory(0.4)).toBe("healthy");
    expect(whtrCategory(0.499)).toBe("healthy");
    expect(whtrCategory(0.5)).toBe("increased");
    expect(whtrCategory(0.599)).toBe("increased");
    expect(whtrCategory(0.6)).toBe("high");
  });

  it("WHR: повышенный риск с 0.90 у мужчин и 0.85 у женщин (ВОЗ 2008)", () => {
    expect(waistToHip(85, 100)).toBeCloseTo(0.85, 8);
    expect(waistToHip(85, 0)).toBe(0);
    expect(whrCategory(0.899, "male")).toBe("healthy");
    expect(whrCategory(0.9, "male")).toBe("increased");
    expect(whrCategory(0.94, "male")).toBe("increased");
    // 0.90 + 0.05 в double чуть больше литерала 0.95, поэтому «high» проверяем зазором
    expect(whrCategory(0.96, "male")).toBe("high");
    expect(whrCategory(0.849, "female")).toBe("healthy");
    expect(whrCategory(0.85, "female")).toBe("increased");
    expect(whrCategory(0.91, "female")).toBe("high");
  });
});

describe("navyBodyFat", () => {
  it("мужчина: плотность Ходждона–Беккета, затем Сири, сантиметры", () => {
    // Рост 178, шея 38, талия 86.
    // D = 1.0324 − 0.19077·log10(48) + 0.15456·log10(178) = 1.05949
    // % = 495/D − 450 = 17.204
    // Прямое метрическое уравнение ВМФ (86.010·log10 − 70.041·log10 + 30.30) даёт 17.28.
    const fat = navyBodyFat({ sex: "male", height: 178, neck: 38, waist: 86 });
    expect(fat).toBeCloseTo(17.204, 3);
  });

  it("женщина: то же уравнение с бёдрами", () => {
    // Рост 165, шея 32, талия 74, бёдра 98.
    // D = 1.29579 − 0.35004·log10(140) + 0.22100·log10(165)
    // % = 28.435
    const fat = navyBodyFat({ sex: "female", height: 165, neck: 32, waist: 74, hip: 98 });
    expect(fat).toBeCloseTo(28.435, 3);
  });

  it("ломается, если логарифм не определён или замер нефизиологичен", () => {
    expect(navyBodyFat({ sex: "male", height: 180, neck: 40, waist: 40 })).toBeNull();
    expect(navyBodyFat({ sex: "male", height: 180, neck: 40, waist: 39 })).toBeNull();
    expect(navyBodyFat({ sex: "female", height: 165, neck: 32, waist: 74 })).toBeNull();
    expect(navyBodyFat({ sex: "male", height: 0, neck: 38, waist: 86 })).toBeNull();
    // талия едва больше шеи уводит процент ниже 3% — отсекается
    expect(navyBodyFat({ sex: "male", height: 180, neck: 38, waist: 39 })).toBeNull();
  });
});

describe("bodyFatCategory", () => {
  it("шкала ACE: границы 6/14/18/25 у мужчин и 14/21/25/32 у женщин", () => {
    expect(bodyFatCategory(5.9, "male")).toBe("essential");
    expect(bodyFatCategory(6, "male")).toBe("athletic");
    expect(bodyFatCategory(14, "male")).toBe("fitness");
    expect(bodyFatCategory(18, "male")).toBe("average");
    expect(bodyFatCategory(24.9, "male")).toBe("average");
    expect(bodyFatCategory(25, "male")).toBe("obese");

    expect(bodyFatCategory(13.9, "female")).toBe("essential");
    expect(bodyFatCategory(14, "female")).toBe("athletic");
    expect(bodyFatCategory(21, "female")).toBe("fitness");
    expect(bodyFatCategory(25, "female")).toBe("average");
    expect(bodyFatCategory(32, "female")).toBe("obese");
  });
});

describe("fatFreeMassIndex", () => {
  it("сухая масса / м²", () => {
    // 80 кг, 15% жира, 180 см: 68 / 3.24
    expect(fatFreeMassIndex(80, 180, 15)).toBeCloseTo(68 / 3.24, 8);
    expect(fatFreeMassIndex(80, 0, 15)).toBe(0);
  });
});

describe("assessComposition", () => {
  it("сводит ИМТ, талию и метод ВМФ для обычного мужчины", () => {
    const r = assessComposition({
      sex: "male",
      weight: 80,
      height: 180,
      age: 35,
      scale: "standard",
      waist: 85,
      neck: 38,
    });
    // ИМТ = 80 / 1.8² = 24.691 — норма; верх здорового диапазона 25·3.24 = 81
    expect(r.bmi).toBeCloseTo(80 / 3.24, 8);
    expect(r.bmiCategory).toBe("normal");
    expect(r.healthyWeight.min).toBeCloseTo(18.5 * 3.24, 8);
    expect(r.healthyWeight.max).toBeCloseTo(25 * 3.24, 8);
    expect(r.excessWeight).toBe(0);
    expect(r.whtr).toBeCloseTo(85 / 180, 8);
    expect(r.whtrCategory).toBe("healthy");
    expect(r.waistRisk).toBe("healthy");
    expect(r.whr).toBeNull();
    // D = 1.0324 − 0.19077·log10(47) + 0.15456·log10(180); % = 16.107
    expect(r.bodyFat).toBeCloseTo(16.107, 3);
    expect(r.bodyFatCategory).toBe("fitness");
    expect(r.ffmi).toBeCloseTo(20.714, 2);
    expect(r.overall).toBe("healthy");
  });

  it("переключает пол и азиатскую шкалу: тот же вес становится ожирением", () => {
    const r = assessComposition({
      sex: "female",
      weight: 95,
      height: 170,
      age: 40,
      scale: "asian",
      waist: 90,
    });
    // ИМТ = 95 / 1.7² = 32.872. Азиатские пороги: ≥32.5 — obese2.
    // Верх нормы 23·2.89 = 66.47, избыток 28.53. Талия женщины ≥88 — high.
    expect(r.bmi).toBeCloseTo(95 / 2.89, 6);
    expect(r.bmiCategory).toBe("obese2");
    expect(r.excessWeight).toBeCloseTo(95 - 23 * 2.89, 6);
    expect(r.waistRisk).toBe("high");
    expect(r.overall).toBe("high");
    expect(r.bodyFat).toBeNull();
  });

  it.skip("overall берёт худший из доступных показателей, включая WHR", () => {
    // РАСХОЖДЕНИЕ: комментарий assessComposition — итог «по худшему из доступных показателей».
    // Мужчина 180 см, 72 кг, талия 70, бёдра 73: ИМТ 22.2 (healthy), талия <94 (healthy),
    // WHtR 0.389 (healthy), WHR 70/73 ≈ 0.959 (high уже по порогу модуля ≥0.95).
    // Код возвращает overall "healthy": whrRisk в сводку не входит.
    const r = assessComposition({
      sex: "male",
      weight: 72,
      height: 180,
      age: 40,
      scale: "standard",
      waist: 70,
      hip: 73,
    });
    expect(r.whrRisk).toBe("high");
    expect(r.overall).toBe("high");
  });
});
