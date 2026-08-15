"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/config/site";
import { t } from "@/lib/i18n";

type Theme = "light" | "dark";

const STORAGE_KEY = "24zdorovie-theme";
const EVENT = "24zdorovie-theme-change";

/** Инлайн-скрипт: ставит data-theme до первой отрисовки, чтобы не было вспышки. */
export const themeScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})()`;

/**
 * Источник правды — сам DOM: атрибут data-theme ставит инлайн-скрипт ещё до
 * гидратации. Читаем его через useSyncExternalStore, чтобы не дёргать setState
 * из эффекта и не ловить вспышку неправильной темы.
 */
function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ locale }: { locale: Locale }) {
  // На сервере темы не знаем — до гидратации рисуем нейтральную иконку.
  const theme = useSyncExternalStore<Theme | null>(subscribe, getSnapshot, () => null);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
      aria-label={t(locale, theme === "dark" ? "a11y_theme_light" : "a11y_theme_dark")}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 2.8v2M12 19.2v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.8 12h2M19.2 12h2M4.6 19.4 6 18M18 6l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
          <path
            d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
