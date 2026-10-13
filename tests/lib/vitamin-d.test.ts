import { describe, expect, it } from "vitest";
import {
  IOM_SUFFICIENT_NMOL,
  NGML_TO_NMOL,
  TARGET_NMOL,
  UL_DAILY,
  bmiOf,
  bodyFactor,
  classify,
  toNgml,
  toNmol,
  vitaminDPlan,
} from "../../src/lib/vitamin-d";

/**
 * 1 нг/мл = 2.496 нмоль/л.
 * Пороги нмоль/л: <25 тяжёлый, <50 дефицит (IOM), <75 недостаточность
 * (Endocrine Society, цель насыщения), <125 цель-потолок, <250 выше, иначе токсично.
 * van Groningen, Eur J Endocrinol 2010:
 * суммарная доза МЕ = 40 × (75 − уровень) × масса.
 * Поддержка без анализа: 1500 МЕ, с 70 лет 2000, × поправка на ИМТ, округление до 500.
 * Поправка Ekwaru: <25 → 1, <30 → 1.5, <35 → 2, иначе 2.5.
 */

describe("единицы и классы", () => {
  it("нг/мл ↔ нмоль/л", () => {
    expect(NGML_TO_NMOL).toBe(2.496);
    expect(toNmol(20)).toBeCloseTo(49.92, 8);
    expect(toNgml(75)).toBeCloseTo(75 / 2.496, 8);
    expect(TARGET_NMOL).toBe(75);
    expect(IOM_SUFFICIENT_NMOL).toBe(50);
    expect(UL_DAILY).toBe(4000);
  });

  it("границы статуса", () => {
    expect(classify(24.9)).toBe("severe");
    expect(classify(25)).toBe("deficient");
    expect(classify(49.9)).toBe("deficient");
    expect(classify(50)).toBe("insufficient");
    expect(classify(74.9)).toBe("insufficient");
    expect(classify(75)).toBe("target");
    expect(classify(124.9)).toBe("target");
    expect(classify(125)).toBe("above");
    expect(classify(249.9)).toBe("above");
    expect(classify(250)).toBe("toxic");
  });

  it("поправка на ИМТ включается на 25, 30 и 35", () => {
    expect(bodyFactor(24.9)).toBe(1);
    expect(bodyFactor(25)).toBe(1.5);
    expect(bodyFactor(30)).toBe(2);
    expect(bodyFactor(35)).toBe(2.5);
    expect(bmiOf(70, 175)).toBeCloseTo(70 / 1.75 ** 2, 8);
  });
});

describe("vitaminDPlan", () => {
  it("без анализа — профилактика 1500 МЕ, после 70 лет 2000", () => {
    const adult = vitaminDPlan({ weight: 70, height: 175, age: 40, currentDose: 0 });
    expect(adult.factor).toBe(1);
    expect(adult.maintenance).toBe(1500);
    expect(adult.maintenanceCapped).toBe(false);
    expect(adult.loading).toBeUndefined();
    expect(adult.status).toBeUndefined();
    expect(adult.needsTest).toBe(false);
    expect(adult.ulShare).toBeCloseTo(1500 / 4000, 8);
    // от нулевого baseline: 1.5 × 7 / 10 / 17 нмоль/л
    expect(adult.projected).toEqual({ low: 10.5, mid: 15, high: 25.5 });

    const older = vitaminDPlan({ weight: 70, height: 175, age: 70, currentDose: 0 });
    expect(older.maintenance).toBe(2000);
  });

  it("ожирение удваивает профилактическую дозу", () => {
    // 90 кг, 170 см: ИМТ 31.14 → фактор 2 → 3000 МЕ
    const r = vitaminDPlan({ weight: 90, height: 170, age: 40, currentDose: 0 });
    expect(r.bmi).toBeCloseTo(90 / 1.7 ** 2, 6);
    expect(r.factor).toBe(2);
    expect(r.maintenance).toBe(3000);
    expect(r.needsTest).toBe(true);
    expect(r.response.mid).toBe(5);
  });

  it("дефицит: van Groningen и поддержка до потолка 4000", () => {
    // Уровень 30, масса 80, рост 180, ИМТ 24.69 → фактор 1.
    // Насыщение: 40·(75−30)·80 = 144000 МЕ; 144000/56 ≈ 2571 → 2500 МЕ/сут; недель 50000: round(2.88) = 3.
    // Поддержка: разрыв 45 / 10 нмоль на 1000 МЕ = 4500 → срез до 4000.
    const r = vitaminDPlan({
      weight: 80,
      height: 180,
      age: 45,
      level: 30,
      currentDose: 0,
    });
    expect(r.status).toBe("deficient");
    expect(r.baseline).toBe(30);
    expect(r.maintenance).toBe(4000);
    expect(r.maintenanceCapped).toBe(true);
    expect(r.loading).toEqual({ total: 144000, daily: 2500, weeks: 3, aboveCap: false });
    expect(r.needsTest).toBe(true);
    expect(r.projected.mid).toBeCloseTo(30 + 4 * 10, 8);
  });

  it("уже достигнутая цель держится профилактической дозой, насыщения нет", () => {
    const r = vitaminDPlan({
      weight: 70,
      height: 175,
      age: 40,
      level: 80,
      currentDose: 0,
    });
    expect(r.status).toBe("target");
    expect(r.loading).toBeUndefined();
    expect(r.maintenance).toBe(1500);
    expect(r.baseline).toBe(80);
  });

  it("текущая добавка вычитается из уровня, прежде чем считать поддержку", () => {
    // Фактор 1, ответ 10 нмоль на 1000 МЕ. 2000 МЕ «объясняют» 20 нмоль из 50.
    // Чистый уровень 30, разрыв до 75 = 45 → 4500 МЕ, срез до 4000.
    const r = vitaminDPlan({
      weight: 70,
      height: 175,
      age: 40,
      level: 50,
      currentDose: 2000,
    });
    expect(r.baseline).toBe(30);
    expect(r.maintenance).toBe(4000);
    expect(r.status).toBe("insufficient");
  });
});
