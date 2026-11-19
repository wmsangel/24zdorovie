import { TOOLS } from "@/config/tools";
import { PROD_HOST } from "@/config/site";

/**
 * Словарь инструментов для сетевого маячка izn-beacon: slug → название на двух
 * языках. Ночной сборщик сети берёт его раз в сутки, чтобы в CRM были названия,
 * а не слаги (см. izn.project.stats/beacon/README.md). Источник — тот же реестр
 * TOOLS, из которого строятся сами страницы инструментов, поэтому словарь не
 * может разойтись со слагами в params.tool.
 */
export const dynamic = "force-static";

export function GET() {
  const tools: Record<string, { en: string; ru: string }> = {};
  for (const t of TOOLS) {
    tools[t.slug] = { en: t.name.en, ru: t.name.ru };
  }
  return Response.json({ site: PROD_HOST, tools });
}
