import { describe, expect, it } from "vitest";
import { classifyBp } from "../../src/lib/blood-pressure";

/**
 * ESC/ESH: категория по более высокому из двух давлений.
 * Оптимальное <120 и <80.
 * Нормальное 120–129 и/или 80–84.
 * Высокое нормальное 130–139 и/или 85–89.
 * 1 степень 140–159 и/или 90–99.
 * 2 степень 160–179 и/или 100–109.
 * 3 степень ≥180 и/или ≥110.
 * Изолированная систолическая: САД ≥140 при ДАД <90.
 */

describe("classifyBp", () => {
  it("оба показателя в одной категории", () => {
    expect(classifyBp(119, 79).category.id).toBe("optimal");
    expect(classifyBp(119, 79).driver).toBe("both");
    expect(classifyBp(120, 80).category.id).toBe("normal");
    expect(classifyBp(129, 84).category.id).toBe("normal");
    expect(classifyBp(130, 85).category.id).toBe("high-normal");
    expect(classifyBp(139, 89).category.id).toBe("high-normal");
    expect(classifyBp(140, 90).category.id).toBe("grade-1");
    expect(classifyBp(159, 99).category.id).toBe("grade-1");
    expect(classifyBp(160, 100).category.id).toBe("grade-2");
    expect(classifyBp(179, 109).category.id).toBe("grade-2");
    expect(classifyBp(180, 110).category.id).toBe("grade-3");
  });

  it("берётся более высокая из двух категорий и запоминается, кто её задал", () => {
    const sbpDriven = classifyBp(152, 82);
    expect(sbpDriven.category.id).toBe("grade-1");
    expect(sbpDriven.driver).toBe("sbp");

    const dbpDriven = classifyBp(125, 92);
    expect(dbpDriven.category.id).toBe("grade-1");
    expect(dbpDriven.driver).toBe("dbp");
    expect(dbpDriven.index).toBe(3);
  });

  it("изолированная систолическая гипертония и порог 3 степени", () => {
    const isolated = classifyBp(140, 89);
    expect(isolated.isolatedSystolic).toBe(true);
    expect(isolated.category.id).toBe("grade-1");
    expect(isolated.crisis).toBe(false);

    expect(classifyBp(140, 90).isolatedSystolic).toBe(false);
    expect(classifyBp(139, 70).isolatedSystolic).toBe(false);

    const crisis = classifyBp(180, 70);
    expect(crisis.category.id).toBe("grade-3");
    expect(crisis.crisis).toBe(true);
    expect(crisis.isolatedSystolic).toBe(true);
    expect(crisis.driver).toBe("sbp");

    const diastolicCrisis = classifyBp(119, 110);
    expect(diastolicCrisis.category.id).toBe("grade-3");
    expect(diastolicCrisis.crisis).toBe(true);
    expect(diastolicCrisis.driver).toBe("dbp");
    expect(diastolicCrisis.isolatedSystolic).toBe(false);
  });
});
