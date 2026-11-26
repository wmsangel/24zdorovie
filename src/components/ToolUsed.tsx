"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/track";

/**
 * Шаг воронки «инструментом воспользовались»: одно событие `tool_used` на
 * открытие страницы — при первом вводе или нажатии внутри виджета.
 *
 * Зачем обёртка, а не вызовы в каждом компоненте: калькуляторов почти три
 * десятка, большинство считает на лету и своего «момента результата» не имеет
 * (см. use-tool-result.ts). Первое взаимодействие ловится одинаково у всех, и
 * новый инструмент получает событие без единой строки в своём коде.
 *
 * Что уходит: слаг инструмента и вид действия (input | click). Значения полей
 * не читаются и не отправляются — в событии нет ничего введённого человеком.
 *
 * `display: contents` — обёртка не создаёт своего бокса и не трогает вёрстку
 * виджета; события всплывают через неё как обычно.
 */
export function ToolUsed({ tool, children }: { tool: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let fired = false;

    function fire(action: "input" | "click") {
      if (fired) return;
      fired = true;
      track("tool_used", { tool, action });
      off();
    }
    function onInput() {
      fire("input");
    }
    function onClick(e: Event) {
      // Ссылки внутри виджета (на статьи, источники) использованием не считаем.
      const t = e.target as Element | null;
      if (t?.closest?.("button, [role='button'], [role='radio'], [role='tab'], [role='switch']")) {
        fire("click");
      }
    }
    function off() {
      el?.removeEventListener("input", onInput, true);
      el?.removeEventListener("change", onInput, true);
      el?.removeEventListener("click", onClick, true);
    }

    el.addEventListener("input", onInput, true);
    el.addEventListener("change", onInput, true);
    el.addEventListener("click", onClick, true);
    return off;
  }, [tool]);

  return (
    <div ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
