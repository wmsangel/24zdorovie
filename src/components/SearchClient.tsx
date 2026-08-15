"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import { translator } from "@/lib/i18n";

export type SearchItem = {
  t: string; // title
  d: string; // description
  u: string; // url
  c: string; // category slug
  g: string[]; // tags
  m: number; // minutes
  p: string; // published
};

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, "е").trim();

/** Простой скоринг: заголовок весит больше описания, теги — больше всего при точном совпадении */
function score(item: SearchItem, terms: string[]): number {
  const title = normalize(item.t);
  const desc = normalize(item.d);
  const tags = item.g.map(normalize);

  let total = 0;
  for (const term of terms) {
    let hit = 0;
    if (title.startsWith(term)) hit += 12;
    if (title.includes(term)) hit += 8;
    if (tags.some((tag) => tag === term)) hit += 7;
    if (tags.some((tag) => tag.includes(term))) hit += 3;
    if (desc.includes(term)) hit += 2;
    if (item.c.includes(term)) hit += 2;
    if (hit === 0) return 0; // все слова запроса должны находиться
    total += hit;
  }
  return total;
}

export function SearchClient({ index, locale }: { index: SearchItem[]; locale: Locale }) {
  const tr = translator(locale);
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  // Держим ?q= в URL, чтобы результатами можно было делиться
  useEffect(() => {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url.toString());
  }, [query]);

  const results = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return index
      .map((item) => ({ item, s: score(item, terms) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || +new Date(b.item.p) - +new Date(a.item.p))
      .slice(0, 40)
      .map((r) => r.item);
  }, [query, index]);

  return (
    <div>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--ink-faint)]"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.4" stroke="currentColor" strokeWidth="1.8" />
          <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tr("search_placeholder")}
          aria-label={tr("nav_search")}
          className="w-full rounded-full border border-[var(--line)] bg-[var(--surface)] py-4 pl-14 pr-5 text-[1.05rem] outline-none transition-colors placeholder:text-[var(--ink-faint)] focus:border-[var(--brand)]"
        />
      </div>

      {query.trim() === "" ? (
        <p className="mt-10 text-center text-[var(--ink-faint)]">{tr("search_hint")}</p>
      ) : results.length === 0 ? (
        <p className="mt-10 text-center text-[var(--ink-soft)]">{tr("search_empty")}</p>
      ) : (
        <>
          <p className="mt-8 text-[0.85rem] text-[var(--ink-faint)]">
            {tr("search_results")}: {results.length}
          </p>
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {results.map((item) => (
              <li key={item.u}>
                <Link href={item.u} className="group block py-5">
                  <h2 className="font-display text-lg font-semibold transition-colors group-hover:text-[var(--brand-strong)]">
                    {item.t}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
                    {item.d}
                  </p>
                  <p className="mt-2 text-[0.78rem] text-[var(--ink-faint)]">
                    {item.c} · {item.m} {tr("min_read")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
