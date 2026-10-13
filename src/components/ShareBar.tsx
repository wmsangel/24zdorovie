"use client";

import { useState, useSyncExternalStore } from "react";
import type { Locale } from "@/config/site";
import { translator } from "@/lib/i18n";

/** Адрес страницы не меняется, пока открыт калькулятор — подписываться не на что. */
const subscribeNever = () => () => {};

/**
 * Канонический адрес текущей страницы: origin + pathname, без query и hash.
 * В шаринг результата нельзя класть введённые пользователем значения.
 */
export function useShareUrl(): string {
  return useSyncExternalStore(
    subscribeNever,
    () => window.location.origin + window.location.pathname,
    () => "",
  );
}

export function ShareBar({
  url,
  title,
  locale,
  text,
  tool,
}: {
  url: string;
  title: string;
  locale: Locale;
  /** Фраза для соцсетей. Без неё уходит title — старые вызовы не меняются. */
  text?: string;
  /** Слаг инструмента: уходит в аналитику как data-track-tool. */
  tool?: string;
}) {
  const tr = translator(locale);
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const message = text ?? title;
  const toolAttr = tool ? { "data-track-tool": tool } : {};

  const targets = [
    { name: "Telegram", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(message)}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${enc(`${message} ${url}`)}` },
    { name: "X", href: `https://x.com/intent/tweet?url=${enc(url)}&text=${enc(message)}` },
    { name: "VK", href: `https://vk.com/share.php?url=${enc(url)}&title=${enc(message)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* буфер недоступен — молча игнорируем */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[0.82rem] font-semibold text-[var(--ink-faint)]">
        {tr("share")}:
      </span>
      {targets.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          data-track="share"
          data-track-target={s.name}
          {...toolAttr}
          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[0.8rem] font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand-strong)]"
        >
          {s.name}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        data-track="share"
        data-track-target="copy_link"
        {...toolAttr}
        className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[0.8rem] font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand-strong)]"
      >
        {copied ? tr("copied") : tr("copy_link")}
      </button>
    </div>
  );
}
