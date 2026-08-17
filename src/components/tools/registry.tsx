import type { Locale } from "@/config/site";
import { BiologicalAgeCalculator } from "./BiologicalAgeCalculator";
import { BodyCompositionCalculator } from "./BodyCompositionCalculator";
import { BurnoutSelfCheck } from "./BurnoutSelfCheck";
import { CaffeineCalculator } from "./CaffeineCalculator";
import { CalorieMacroCalculator } from "./CalorieMacroCalculator";
import { CvdRiskCalculator } from "./CvdRiskCalculator";
import { FiberCalculator } from "./FiberCalculator";
import { HeartRateZonesCalculator } from "./HeartRateZonesCalculator";
import { OvulationCalculator } from "./OvulationCalculator";
import { ProteinCalculator } from "./ProteinCalculator";
import { SleepCycleCalculator } from "./SleepCycleCalculator";
import { SymptomChecker } from "./SymptomChecker";
import { VitaminDCalculator } from "./VitaminDCalculator";
import { WaterIntakeCalculator } from "./WaterIntakeCalculator";

/**
 * Слаг инструмента → компонент.
 *
 * Те же компоненты подключены как MDX-блоки в src/components/mdx/Mdx.tsx,
 * поэтому калькулятор можно врезать и в обычную статью.
 */
const WIDGETS: Record<string, (props: { locale: Locale }) => React.ReactElement> = {
  "caffeine-calculator": CaffeineCalculator,
  "calorie-macro-calculator": CalorieMacroCalculator,
  "biological-age-calculator": BiologicalAgeCalculator,
  "burnout-test": BurnoutSelfCheck,
  "bmi-calculator": BodyCompositionCalculator,
  "heart-rate-zones-calculator": HeartRateZonesCalculator,
  "water-intake-calculator": WaterIntakeCalculator,
  "sleep-calculator": SleepCycleCalculator,
  "vitamin-d-calculator": VitaminDCalculator,
  "ovulation-calculator": OvulationCalculator,
  "protein-calculator": ProteinCalculator,
  "fiber-calculator": FiberCalculator,
  "cvd-risk-calculator": CvdRiskCalculator,
  "cold-flu-covid-checker": SymptomChecker,
};

export function ToolWidget({ slug, locale }: { slug: string; locale: Locale }) {
  const Widget = WIDGETS[slug];
  return Widget ? <Widget locale={locale} /> : null;
}
