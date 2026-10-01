"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/**
 * Один делегированный слушатель кликов на всю страницу. Любой элемент с
 * атрибутом `data-track="имя_события"` при клике шлёт событие в GA4 и Метрику;
 * все `data-track-*` становятся параметрами (data-track-offer → offer).
 *
 * Так серверные компоненты (ProductCard, OfferBlock, ReadAlso) остаются
 * серверными — им достаточно дописать атрибуты, превращать их в клиентские
 * ради аналитики не нужно.
 */
export function TrackClicks() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
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
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
