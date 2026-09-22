"use client";

import { useState } from "react";
import type { Locale } from "@/config/site";
import { SITE } from "@/config/site";
import wallets from "@/config/donate.json";

/**
 * Страница поддержки: приём крипто-чаевых + блок «бесплатные способы помочь».
 *
 * Адреса, сети и имена файлов QR берём из src/config/donate.json — единого
 * источника, который проверяет и рисует QR скрипт scripts/gen-donate-qr.mjs.
 * Здесь адреса не дублируются руками, поэтому QR, кнопка «копировать» и текст
 * на странице не могут разойтись.
 *
 * QR лежат у нас в public/donate/*.svg (не с чужого image-API) — приватность и
 * защита от подмены адреса. Показываем через обычный <img>: это статичный SVG
 * без ресайза, оптимизатор картинок ему не нужен.
 */

const GITHUB_URL = "https://github.com/wmsangel/24zdorovie";

const COPY = {
  ru: {
    walletsTitle: "Крипто-кошельки",
    walletsHint:
      "Отсканируйте QR или скопируйте адрес. Начните с небольшой тестовой суммы — переводы в блокчейне необратимы.",
    onlySend: (assets: string, chain: string, std: string) =>
      `Отправляйте только ${assets} по сети ${chain} (${std}). Перевод в другой сети или другого актива необратим — средства будут потеряны.`,
    copy: "Скопировать адрес",
    copied: "Скопировано ✓",
    qrAlt: (chain: string) => `QR-код адреса ${chain}`,
    freeTitle: "Бесплатные способы помочь",
    freeHint:
      "Донат — это здорово, но ссылка на нас помогает даже сильнее: она приводит новых читателей из поиска.",
    shareLabel: "Поделиться сайтом",
    shareText: "Здоровье без мифов — доказательные разборы, калькуляторы и рецепты",
    recommendTitle: "Сослаться на нас",
    recommendText:
      "Пишете статью, ведёте блог или отвечаете на форуме о здоровье? Ссылка на конкретный разбор или калькулятор 24zdorovie — самая ценная поддержка проекта.",
    copyLink: "Скопировать ссылку на сайт",
    linkCopied: "Ссылка скопирована ✓",
    githubTitle: "Звезда на GitHub",
    githubText: "Проект с открытым исходным кодом. Звезда на GitHub повышает его видимость.",
    githubCta: "★ Star на GitHub",
    tgTitle: "Подписаться на канал",
    tgText: "Короткие заметки о здоровье выходят ежедневно. Подписка бесплатна и помогает росту.",
    tgCta: "Telegram-канал",
  },
  en: {
    walletsTitle: "Crypto wallets",
    walletsHint:
      "Scan the QR or copy the address. Start with a small test amount — on-chain transfers are irreversible.",
    onlySend: (assets: string, chain: string, std: string) =>
      `Send only ${assets} on the ${chain} network (${std}). Sending on a different network, or a different asset, is irreversible — the funds will be lost.`,
    copy: "Copy address",
    copied: "Copied ✓",
    qrAlt: (chain: string) => `QR code for the ${chain} address`,
    freeTitle: "Free ways to help",
    freeHint:
      "Donations are great, but a link to us helps even more: it brings new readers in from search.",
    shareLabel: "Share the site",
    shareText: "Health without the myths — evidence-based explainers, calculators and recipes",
    recommendTitle: "Link to us",
    recommendText:
      "Writing an article, running a blog, or answering a health question on a forum? A link to a specific 24zdorovie explainer or calculator is the most valuable support there is.",
    copyLink: "Copy link to the site",
    linkCopied: "Link copied ✓",
    githubTitle: "Star on GitHub",
    githubText: "The project is open source. A star on GitHub boosts its visibility.",
    githubCta: "★ Star on GitHub",
    tgTitle: "Follow the channel",
    tgText: "Short health notes go out daily. Following is free and helps us grow.",
    tgCta: "Telegram channel",
  },
} as const;

function CopyButton({
  value,
  idle,
  done,
  className = "",
}: {
  value: string;
  idle: string;
  done: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* буфер недоступен — молча игнорируем */
    }
  }
  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? done : idle}
    </button>
  );
}

export function SupportWidget({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const enc = encodeURIComponent;
  // Со слэшем на конце: сайт на trailingSlash, иначе краулеры соцсетей идут
  // через 308-редирект перед тем, как прочитать OG.
  const shareUrl = `${SITE.url}/${locale}/support/`;
  const siteUrl = `${SITE.url}/${locale}/`;
  const telegram = locale === "ru" ? SITE.social.telegramRu : SITE.social.telegramEn;

  const shareTargets = [
    { name: "X", href: `https://x.com/intent/tweet?url=${enc(siteUrl)}&text=${enc(t.shareText)}` },
    { name: "Reddit", href: `https://www.reddit.com/submit?url=${enc(siteUrl)}&title=${enc(t.shareText)}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${enc(siteUrl)}&text=${enc(t.shareText)}` },
  ];

  const pill =
    "rounded-full border border-[var(--line)] px-4 py-2 text-[0.85rem] font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand-strong)]";

  return (
    <div className="not-prose">
      {/* ── Крипто-кошельки ─────────────────────────────────────────── */}
      <h2 className="font-display text-2xl font-semibold">{t.walletsTitle}</h2>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">{t.walletsHint}</p>

      <div className="mt-6 grid gap-5">
        {wallets.map((w) => {
          const assets = w.assets.join(", ");
          return (
            <div
              key={w.id}
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-soft)]"
            >
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
                <div className="shrink-0 self-center rounded-xl border border-[var(--line)] bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.qr} alt={t.qrAlt(w.chain)} width={128} height={128} className="h-32 w-32" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-semibold">{w.chain}</span>
                    <span className="rounded-full bg-[var(--brand-tint)] px-2.5 py-0.5 text-[0.72rem] font-bold text-[var(--brand-strong)]">
                      {w.standard}
                    </span>
                    <span className="text-[0.85rem] text-[var(--ink-faint)]">{assets}</span>
                  </div>
                  <p className="mt-3 break-all rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5 font-mono text-[0.82rem] leading-relaxed">
                    {w.address}
                  </p>
                  <CopyButton
                    value={w.address}
                    idle={t.copy}
                    done={t.copied}
                    className="btn btn-primary mt-3 text-[0.85rem]"
                  />
                </div>
              </div>
              <p className="border-t border-[color-mix(in_oklab,var(--accent,#d97706)_25%,var(--line))] bg-[color-mix(in_oklab,#d97706_10%,transparent)] px-5 py-3 text-[0.82rem] leading-relaxed text-[var(--ink-soft)]">
                ⚠ {t.onlySend(assets, w.chain, w.standard)}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Бесплатные способы помочь (беклинки) ─────────────────────── */}
      <h2 className="mt-14 font-display text-2xl font-semibold">{t.freeTitle}</h2>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">{t.freeHint}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Поделиться */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="font-display text-lg font-semibold">{t.shareLabel}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {shareTargets.map((s) => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className={pill}>
                {s.name}
              </a>
            ))}
            <CopyButton value={siteUrl} idle={t.copyLink} done={t.linkCopied} className={pill} />
          </div>
        </div>

        {/* GitHub star */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="font-display text-lg font-semibold">{t.githubTitle}</p>
          <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">{t.githubText}</p>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={`${pill} mt-3 inline-block`}>
            {t.githubCta}
          </a>
        </div>

        {/* Telegram */}
        {telegram && (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <p className="font-display text-lg font-semibold">{t.tgTitle}</p>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">{t.tgText}</p>
            <a href={telegram} target="_blank" rel="noopener noreferrer" className={`${pill} mt-3 inline-block`}>
              {t.tgCta}
            </a>
          </div>
        )}

        {/* Рекомендовать / линк на нас */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="font-display text-lg font-semibold">{t.recommendTitle}</p>
          <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">{t.recommendText}</p>
          <CopyButton
            value={shareUrl}
            idle={t.copyLink}
            done={t.linkCopied}
            className={`${pill} mt-3 inline-block`}
          />
        </div>
      </div>
    </div>
  );
}
