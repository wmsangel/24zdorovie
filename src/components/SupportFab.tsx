"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SITE, type Locale } from "@/config/site";
import { localePath } from "@/lib/i18n";

/**
 * Плавающая мини-панель снизу справа: обратная связь + поддержка.
 * Клик по кнопке раскрывает два действия:
 *   — «Сообщить о проблеме» → mailto на info@ с префиллом (тип + URL страницы).
 *     На статике своего бэкенда нет; mailto не тащит инфраструктуру, секреты и
 *     не требует правки Privacy (данные никуда, кроме почтового клиента, не идут).
 *   — «Поддержать проект» → страница /support.
 * Компактная, сворачиваемая, не перекрывает контент; закрывается по Esc и клику вне.
 */

const COPY = {
  ru: {
    toggle: "Связь и поддержка",
    feedback: "Сообщить о проблеме",
    feedbackDesc: "Нашли ошибку или неточность?",
    donate: "Поддержать проект",
    donateDesc: "Крипто-чаевые, если было полезно",
    close: "Закрыть",
    subject: "Обратная связь — 24zdorovie",
    body: (url: string) =>
      `Страница: ${url}\n\nОпишите проблему или предложение (по возможности с цитатой спорного места и ссылкой на источник):\n`,
  },
  en: {
    toggle: "Feedback & support",
    feedback: "Report a problem",
    feedbackDesc: "Spotted an error or inaccuracy?",
    donate: "Support the project",
    donateDesc: "A crypto tip, if it helped",
    close: "Close",
    subject: "Feedback — 24zdorovie",
    body: (url: string) =>
      `Page: ${url}\n\nDescribe the problem or suggestion (ideally with a quote of the disputed passage and a link to the source):\n`,
  },
} as const;

export function SupportFab({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  function reportHref() {
    // URL текущей страницы подставляем в момент клика — компонент общий для всех страниц.
    const url = typeof window !== "undefined" ? window.location.href : SITE.url;
    return `mailto:${SITE.email}?subject=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(t.body(url))}`;
  }

  return (
    <div ref={rootRef} className="fixed bottom-4 right-4 z-50 print:hidden">
      {open && (
        <div
          role="menu"
          aria-label={t.toggle}
          className="mb-3 w-72 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lift)]"
        >
          <a
            role="menuitem"
            href={reportHref()}
            onClick={() => setOpen(false)}
            className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-3.5 transition-colors hover:bg-[var(--surface-2)]"
          >
            <span aria-hidden="true" className="mt-0.5 text-xl leading-none">💬</span>
            <span className="min-w-0">
              <span className="block font-semibold">{t.feedback}</span>
              <span className="block text-[0.82rem] text-[var(--ink-soft)]">{t.feedbackDesc}</span>
            </span>
          </a>
          <Link
            role="menuitem"
            href={localePath(locale, "/support")}
            onClick={() => setOpen(false)}
            className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-2)]"
          >
            <span aria-hidden="true" className="mt-0.5 text-xl leading-none">☕</span>
            <span className="min-w-0">
              <span className="block font-semibold">{t.donate}</span>
              <span className="block text-[0.82rem] text-[var(--ink-soft)]">{t.donateDesc}</span>
            </span>
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t.toggle}
        className="ml-auto flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 font-semibold shadow-[var(--shadow-lift)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand-strong)]"
      >
        <span aria-hidden="true" className="text-lg leading-none">{open ? "✕" : "💬"}</span>
        <span className="hidden text-[0.9rem] sm:inline">{open ? t.close : t.toggle}</span>
      </button>
    </div>
  );
}
