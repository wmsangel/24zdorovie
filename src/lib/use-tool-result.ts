import { useEffect, useRef } from "react";
import { track } from "./track";

/**
 * Разовое событие «инструмент досчитан / тест пройден».
 *
 * Шлётся один раз за монтирование, когда результат впервые становится готов
 * (ready: false → true). Парно к `tool_view` (открытие) — вместе дают воронку
 * «открыл → довёл до результата» по каждому инструменту.
 *
 * Слаг инструмента совпадает с ключом в src/components/tools/registry.tsx,
 * чтобы tool_view и tool_result сходились по одному `tool`.
 *
 * Вешать только на инструменты с настоящим гейтом завершения (тесты-опросники,
 * где результат = null, пока не отвечены все вопросы). Калькуляторы, которые
 * считают на лету по мере ввода, завершения не имеют — для них событие шумит.
 */
export function useToolResult(tool: string, ready: boolean) {
  const fired = useRef(false);
  useEffect(() => {
    if (ready && !fired.current) {
      fired.current = true;
      track("tool_result", { tool });
    }
  }, [ready, tool]);
}
