"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pickSpotlight, type SpotlightItem } from "@/config/spotlight";
import { type Locale } from "@/config/site";
import { translator } from "@/lib/i18n";

/**
 * Промо-слот. Что показать, решаем на клиенте по текущей дате (ISO-неделя),
 * чтобы набор менялся сам каждую неделю без пересборки и без hydration-конфликта:
 * на сервере и при первой отрисовке — ничего, элемент появляется после mount.
 */
export function Spotlight({ locale }: { locale: Locale }) {
  const [item, setItem] = useState<SpotlightItem | null>(null);
  useEffect(() => {
    setItem(pickSpotlight(new Date()));
  }, []);

  if (!item) return null;
  const tr = translator(locale);

  return (
    <aside className="my-12 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-5 md:p-6">
      <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--brand-strong)]">
        ★ {tr("spotlight_label")}
      </span>
      <Link
        href={item.href[locale]}
        data-track="spotlight_click"
        data-track-item={item.id}
        className="mt-3 flex items-start gap-4 no-underline"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--brand-tint)] text-2xl">
          {item.icon}
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[1.15rem] font-semibold leading-snug text-[var(--ink)]">
            {item.title[locale]}
          </span>
          <span className="mt-1 block text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
            {item.blurb[locale]}
          </span>
          <span className="mt-2 inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-[var(--brand-strong)]">
            {item.cta[locale]}
            <span aria-hidden="true">→</span>
          </span>
        </span>
      </Link>
    </aside>
  );
}
