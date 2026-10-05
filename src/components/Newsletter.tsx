"use client";

import { useEffect } from "react";
import { SITE, type Locale } from "@/config/site";
import { translator } from "@/lib/i18n";

/**
 * Подписка на email-дайджест через MailerLite (встраиваемая форма).
 *
 * На статическом хостинге своего API нет, поэтому форму целиком рендерит
 * MailerLite: мы грузим их universal.js один раз и ставим `<div class="ml-embedded">`.
 * Сама форма (поля, тексты, кнопка, double opt-in, согласие) настраивается в
 * кабинете MailerLite — отсюда ею не управляем, чтобы не дублировать заголовки.
 *
 * Пока `SITE.newsletter.account`/`form` пустые — блок не рендерится (как раньше
 * при пустом endpoint): мёртвое поле ввода хуже, чем его отсутствие.
 */

let mlScriptRequested = false;

function loadMailerLite(account: string) {
  if (mlScriptRequested || typeof window === "undefined") return;
  mlScriptRequested = true;
  const w = window as unknown as { ml?: ((...a: unknown[]) => void) & { q?: unknown[] } };
  w.ml =
    w.ml ||
    function (...args: unknown[]) {
      (w.ml!.q = w.ml!.q || []).push(args);
    };
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://assets.mailerlite.com/js/universal.js";
  document.head.appendChild(s);
  w.ml("account", account);
}

export function Newsletter({
  locale,
  variant = "full",
}: {
  locale: Locale;
  variant?: "full" | "compact";
}) {
  const tr = translator(locale);
  const { account, form, formRu } = SITE.newsletter;
  // RU-страницы берут отдельную русскую форму, если она заведена; иначе — общую.
  const formCode = locale === "ru" && formRu ? formRu : form;

  useEffect(() => {
    if (account) loadMailerLite(account);
  }, [account]);

  if (!account || !formCode) return null;

  // Форма MailerLite самодостаточна (свои заголовок/поля/кнопка/согласие).
  const embed = <div className="ml-embedded" data-form={formCode} />;

  if (variant === "compact") {
    return (
      <div>
        <p className="text-sm font-semibold">{tr("newsletter_title")}</p>
        <div className="mt-3">{embed}</div>
      </div>
    );
  }

  return (
    <section className="card relative overflow-hidden p-6 md:p-8">
      <div
        className="organic-blob -right-16 -top-24 h-72 w-72 bg-[var(--brand)]"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="text-lg font-bold md:text-xl">{tr("newsletter_title")}</p>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">{tr("newsletter_magnet")}</p>
        <div className="mt-4">{embed}</div>
      </div>
    </section>
  );
}
