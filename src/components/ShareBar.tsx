"use client";

import { useState } from "react";
import type { Locale } from "@/config/site";
import { translator } from "@/lib/i18n";

export function ShareBar({ url, title, locale }: { url: string; title: string; locale: Locale }) {
  const tr = translator(locale);
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

  const targets = [
    { name: "Telegram", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
    { name: "X", href: `https://x.com/intent/tweet?url=${enc(url)}&text=${enc(title)}` },
    { name: "VK", href: `https://vk.com/share.php?url=${enc(url)}&title=${enc(title)}` },
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
          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[0.8rem] font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand-strong)]"
        >
          {s.name}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[0.8rem] font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand-strong)]"
      >
        {copied ? tr("copied") : tr("copy_link")}
      </button>
    </div>
  );
}
