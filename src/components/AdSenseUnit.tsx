"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Один блок AdSense.
 *
 * Инициализация вынесена в useEffect не для красоты. Раньше рядом с <ins>
 * стоял инлайновый <script> с push({}) — на первой загрузке он срабатывал,
 * потому что HTML разбирает парсер браузера. Но при клиентском переходе по
 * ссылке React вставляет такой <script> в DOM, а браузер его не выполняет:
 * скрипты, созданные React, не запускаются. Проверено на живой странице —
 * после перехода на /ru/articles в DOM было 16 скриптов и ни одного вызова.
 * То есть объявления не показывались нигде, кроме первой открытой страницы.
 *
 * Отсюда же key по маршруту: при переходе нужен новый <ins>. AdSense метит
 * обработанные элементы и второй раз в тот же блок объявление не положит.
 */
export function AdSenseUnit(props: { client: string; slot: string; minHeight: number }) {
  const pathname = usePathname();
  return <Unit key={pathname} {...props} />;
}

function Unit({ client, slot, minHeight }: { client: string; slot: string; minHeight: number }) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || pushed.current) return;

    /* Атрибут ставит сам AdSense на уже обработанные <ins>. Повторный push
     * по заполненному блоку роняет всю очередь объявлений на странице,
     * поэтому проверка нужна и здесь, и через ref (StrictMode в dev
     * прогоняет эффект дважды). */
    if (el.getAttribute("data-adsbygoogle-status")) return;

    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn("[ads] блок не инициализировался", error);
    }
  }, []);

  return (
    <ins
      ref={ref}
      className="adsbygoogle block"
      style={{ display: "block", minHeight }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
