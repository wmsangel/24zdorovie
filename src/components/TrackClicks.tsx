"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";
import { goUrl, slugFromPath } from "@/lib/gotoken";

/**
 * Один делегированный слушатель кликов на всю страницу. Любой элемент с
 * атрибутом `data-track="имя_события"` при клике шлёт событие в GA4, Метрику и
 * маячок; все `data-track-*` становятся параметрами (data-track-offer → offer).
 *
 * Так серверные компоненты (ProductCard, OfferBlock, ReadAlso) остаются
 * серверными — им достаточно дописать атрибуты.
 *
 * Партнёрские ссылки Amazon (`a[data-go]`) — вариант B' сетевого стандарта:
 * в HTML только href="#", data-go и (для поиска) data-go-q. При ДОВЕРЕННОМ
 * нажатии (pointerdown, touchstart, Enter, контекстное меню) сюда вписывается
 * подписанный /go-адрес с метками страницы — переход остаётся настоящим кликом
 * по ссылке. Скриптовый клик (isTrusted=false) оставляет "#" и отменяется,
 * события не шлёт. См. src/lib/gotoken.ts.
 */
function goAnchor(e: Event): HTMLAnchorElement | null {
  const el = e.target as Element | null;
  return (el?.closest?.("a[data-go]") as HTMLAnchorElement | null) ?? null;
}

function arm(e: Event): HTMLAnchorElement | null {
  const a = goAnchor(e);
  if (!a) return null;
  const id = a.dataset.go;
  if (!e.isTrusted || !id) return a;
  a.setAttribute("href", goUrl(id, slugFromPath(location.pathname), a.dataset.goQ ?? ""));
  return a;
}

export function TrackClicks() {
  useEffect(() => {
    const onArm = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Enter") return;
      arm(e);
    };
    const onClick = (e: MouseEvent) => {
      if (e.type === "auxclick" && e.button !== 1) return;
      const a = arm(e);
      if (a && (a.getAttribute("href") || "#") === "#") {
        // Недоверенный клик: адреса нет, перехода и события не будет.
        e.preventDefault();
        return;
      }
      const target = e.target as Element | null;
      const el = target?.closest?.("[data-track]");
      if (!el) return;
      const name = el.getAttribute("data-track");
      if (!name) return;
      const params: Record<string, string> = {};
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith("data-track-")) params[attr.name.slice(11)] = attr.value;
      }
      track(name, params);
    };
    const opts = { capture: true } as const;
    const armEvents = ["pointerdown", "mousedown", "touchstart", "keydown", "contextmenu"];
    for (const t of armEvents) document.addEventListener(t, onArm, opts);
    document.addEventListener("click", onClick, opts);
    document.addEventListener("auxclick", onClick, opts);
    return () => {
      for (const t of armEvents) document.removeEventListener(t, onArm, opts);
      document.removeEventListener("click", onClick, opts);
      document.removeEventListener("auxclick", onClick, opts);
    };
  }, []);

  return null;
}
