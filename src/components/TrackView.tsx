"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/**
 * Разовый пинг события-просмотра при монтировании. Нужен для view-событий,
 * которые нельзя поймать кликом (например, какой инструмент открыли).
 * Серверная страница просто вставляет <TrackView event="tool_view" ... />.
 */
export function TrackView({
  event,
  params = {},
}: {
  event: string;
  params?: Record<string, string | number>;
}) {
  const key = JSON.stringify(params);
  useEffect(() => {
    track(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, key]);
  return null;
}
