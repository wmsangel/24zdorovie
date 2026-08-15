"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/config/site";
import { translator } from "@/lib/i18n";
import type { Heading } from "@/lib/toc";

export function Toc({ headings, locale }: { headings: Heading[]; locale: Locale }) {
  const tr = translator(locale);
  const [active, setActive] = useState<string>(headings[0]?.id ?? "");

  useEffect(() => {
    if (!headings.length) return;
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <nav aria-label={tr("toc")} className="text-[0.88rem]">
      <p className="kicker mb-3">{tr("toc")}</p>
      <ul className="space-y-1.5 border-l border-[var(--line)]">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
            <a
              href={`#${h.id}`}
              className={`-ml-px block border-l-2 py-1 pl-3 leading-snug transition-colors ${
                active === h.id
                  ? "border-[var(--brand)] font-semibold text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
