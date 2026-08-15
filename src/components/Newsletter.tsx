"use client";

import { useState } from "react";
import { SITE, type Locale } from "@/config/site";
import { translator } from "@/lib/i18n";

/**
 * Форма подписки. Адрес уходит на внешний сервис рассылок из
 * SITE.newsletterEndpoint — на статическом хостинге своего API нет.
 * Пока эндпоинт не задан, форма не рендерится: мёртвое поле ввода
 * хуже, чем его отсутствие.
 */
export function Newsletter({
  locale,
  variant = "full",
}: {
  locale: Locale;
  variant?: "full" | "compact";
}) {
  const tr = translator(locale);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  if (!SITE.newsletterEndpoint) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("loading");
    try {
      const res = await fetch(SITE.newsletterEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  const form = (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor={`nl-${variant}`}>
        {tr("newsletter_placeholder")}
      </label>
      <input
        id={`nl-${variant}`}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={tr("newsletter_placeholder")}
        className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[0.95rem] outline-none transition-colors placeholder:text-[var(--ink-faint)] focus:border-[var(--brand)]"
      />
      <button type="submit" className="btn btn-primary" disabled={state === "loading"}>
        {state === "loading" ? "…" : tr("newsletter_cta")}
      </button>
    </form>
  );

  if (variant === "compact") {
    return (
      <div>
        <p className="text-sm font-semibold">{tr("newsletter_title")}</p>
        <div className="mt-3">
          {state === "done" ? (
            <p className="text-sm text-[var(--brand-strong)]">{tr("newsletter_done")}</p>
          ) : (
            form
          )}
        </div>
        <p className="mt-2 text-xs text-[var(--ink-faint)]">{tr("newsletter_privacy")}</p>
      </div>
    );
  }

  return (
    <section className="card relative overflow-hidden p-8 md:p-12">
      <div
        className="organic-blob -right-16 -top-24 h-72 w-72 bg-[var(--brand)]"
        aria-hidden="true"
      />
      <div className="relative max-w-xl">
        <p className="kicker">{tr("newsletter_cta")}</p>
        <h2 className="mt-3 text-3xl md:text-4xl">{tr("newsletter_title")}</h2>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-[var(--ink-soft)]">
          {tr("newsletter_text")}
        </p>
        <div className="mt-6">
          {state === "done" ? (
            <p className="text-[1.05rem] font-semibold text-[var(--brand-strong)]">
              {tr("newsletter_done")}
            </p>
          ) : (
            form
          )}
          {state === "error" && (
            <p className="mt-2 text-sm text-[#b8447a]">
              {locale === "ru" ? "Что-то пошло не так. Попробуйте позже." : "Something went wrong. Try again later."}
            </p>
          )}
          <p className="mt-3 text-xs text-[var(--ink-faint)]">{tr("newsletter_privacy")}</p>
        </div>
      </div>
    </section>
  );
}
