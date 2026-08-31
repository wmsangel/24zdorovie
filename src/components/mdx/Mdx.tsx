import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { BiologicalAgeCalculator } from "../tools/BiologicalAgeCalculator";
import { BloodPressureChecker } from "../tools/BloodPressureChecker";
import { BloodUnitConverter } from "../tools/BloodUnitConverter";
import { DueDateCalculator } from "../tools/DueDateCalculator";
import { BodyCompositionCalculator } from "../tools/BodyCompositionCalculator";
import { BurnoutSelfCheck } from "../tools/BurnoutSelfCheck";
import { CaffeineCalculator } from "../tools/CaffeineCalculator";
import { CalorieMacroCalculator } from "../tools/CalorieMacroCalculator";
import { CvdRiskCalculator } from "../tools/CvdRiskCalculator";
import { FiberCalculator } from "../tools/FiberCalculator";
import { HeartRateZonesCalculator } from "../tools/HeartRateZonesCalculator";
import { IdealWeightCalculator } from "../tools/IdealWeightCalculator";
import { OvulationCalculator } from "../tools/OvulationCalculator";
import { ProteinCalculator } from "../tools/ProteinCalculator";
import { SleepCycleCalculator } from "../tools/SleepCycleCalculator";
import { SymptomChecker } from "../tools/SymptomChecker";
import { VitaminDCalculator } from "../tools/VitaminDCalculator";
import { WaterIntakeCalculator } from "../tools/WaterIntakeCalculator";
import {
  Callout,
  DataTable,
  Figure,
  KeyPoints,
  ProductCard,
  ReadAlso,
  RecipeFacts,
} from "./blocks";

/** Внутренние ссылки идут через next/link, внешние — с rel="noopener" */
function A({ href = "", ...props }: ComponentPropsWithoutRef<"a">) {
  const isInternal = href.startsWith("/") || href.startsWith("#");
  if (isInternal) return <Link href={href} {...props} />;
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
}

/** Таблицы из GFM оборачиваем в скроллируемый контейнер */
function Table(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="my-8 overflow-x-auto rounded-2xl border border-[var(--line)]">
      <table {...props} />
    </div>
  );
}

const components = {
  a: A,
  table: Table,
  Callout,
  KeyPoints,
  DataTable,
  ProductCard,
  RecipeFacts,
  Figure,
  ReadAlso,
  // Интерактив: те же виджеты, что и на страницах /tools/, но врезкой в статью.
  // Локаль передаётся пропом явно — MDX не знает, из какой папки его прочитали.
  CaffeineCalculator,
  CalorieMacroCalculator,
  BiologicalAgeCalculator,
  BurnoutSelfCheck,
  BodyCompositionCalculator,
  HeartRateZonesCalculator,
  WaterIntakeCalculator,
  SleepCycleCalculator,
  VitaminDCalculator,
  OvulationCalculator,
  ProteinCalculator,
  FiberCalculator,
  CvdRiskCalculator,
  SymptomChecker,
  BloodUnitConverter,
  BloodPressureChecker,
  DueDateCalculator,
  IdealWeightCalculator,
};

export function Mdx({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        // Статьи лежат в репозитории, а не приходят от пользователя, поэтому
        // выражения в MDX разрешены — иначе next-mdx-remote вырезает пропсы
        // вида items={[...]}. Блокировка опасных глобалей остаётся включённой.
        blockJS: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            [
              rehypeAutolinkHeadings,
              {
                behavior: "append",
                properties: { className: "heading-anchor", ariaHidden: true, tabIndex: -1 },
                content: { type: "text", value: "#" },
              },
            ],
          ],
        },
      }}
    />
  );
}
