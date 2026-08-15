import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Блоки, доступные внутри MDX-статей.
 * Пример: <Callout type="warning" title="Осторожно">…</Callout>
 */

const CALLOUT_STYLES = {
  tip: { accent: "leaf", icon: "💡" },
  info: { accent: "ocean", icon: "ℹ️" },
  warning: { accent: "amber", icon: "⚠️" },
  danger: { accent: "berry", icon: "🚫" },
  science: { accent: "lavender", icon: "🔬" },
} as const;

export function Callout({
  type = "tip",
  title,
  children,
}: {
  type?: keyof typeof CALLOUT_STYLES;
  title?: string;
  children: ReactNode;
}) {
  const style = CALLOUT_STYLES[type] ?? CALLOUT_STYLES.tip;
  return (
    <aside
      data-accent={style.accent}
      className="not-prose my-8 rounded-2xl border border-[color-mix(in_oklab,var(--accent)_25%,var(--line))] bg-[var(--accent-tint)] p-5 md:p-6"
    >
      <div className="flex gap-3.5">
        <span aria-hidden="true" className="text-xl leading-none">
          {style.icon}
        </span>
        <div className="min-w-0">
          {title && <p className="font-display text-lg font-semibold">{title}</p>}
          <div className="mt-1 space-y-3 text-[0.98rem] leading-relaxed text-[var(--ink-soft)] [&_a]:font-semibold [&_a]:text-[var(--accent)] [&_a]:underline">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Блок «Коротко о главном» — хорошо заходит в сниппетах Google */
export function KeyPoints({ title, items }: { title?: string; items: string[] }) {
  return (
    <aside className="not-prose my-8 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-5 md:p-6">
      <p className="kicker">{title ?? "Коротко"}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-[0.98rem] leading-relaxed">
            <svg viewBox="0 0 24 24" className="mt-1 h-4 w-4 shrink-0 text-[var(--brand)]" fill="none" aria-hidden="true">
              <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Таблица сравнения / пищевой ценности с горизонтальным скроллом на мобильных */
export function DataTable({ head, rows, caption }: { head: string[]; rows: string[][]; caption?: string }) {
  return (
    <figure className="not-prose my-8">
      <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
        <table className="w-full border-collapse text-[0.92rem]">
          <thead>
            <tr>
              {head.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap bg-[var(--surface-2)] px-4 py-3 text-left text-[0.75rem] font-bold uppercase tracking-[0.04em] text-[var(--ink-soft)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-[var(--line)]">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <figcaption className="mt-2 text-center text-sm text-[var(--ink-faint)]">{caption}</figcaption>}
    </figure>
  );
}

/** Партнёрский блок товара — монетизация внутри текста */
export function ProductCard({
  title,
  description,
  href,
  image,
  price,
  cta = "Посмотреть",
  note,
}: {
  title: string;
  description?: string;
  href: string;
  image?: string;
  price?: string;
  cta?: string;
  note?: string;
}) {
  return (
    <aside className="not-prose my-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        {image && (
          <div className="relative h-28 w-28 shrink-0 self-center overflow-hidden rounded-xl border border-[var(--line)]">
            <Image src={image} alt={title} fill sizes="112px" className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold">{title}</p>
          {description && (
            <p className="mt-1 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">{description}</p>
          )}
          {price && <p className="mt-2 text-[0.95rem] font-bold text-[var(--brand-strong)]">{price}</p>}
        </div>
        <a
          href={href}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="btn btn-primary shrink-0 self-start sm:self-center"
        >
          {cta}
        </a>
      </div>
      <p className="border-t border-[var(--line)] bg-[var(--surface-2)] px-5 py-2.5 text-[0.72rem] text-[var(--ink-faint)]">
        {note ?? "Ссылка партнёрская: цена для вас не меняется, мы получаем комиссию."}
      </p>
    </aside>
  );
}

/** Карточка рецепта: параметры и КБЖУ одним блоком */
export function RecipeFacts({
  time,
  servings,
  kcal,
  protein,
  fat,
  carbs,
}: {
  time?: number;
  servings?: number;
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}) {
  const facts = [
    time && { label: "Время", value: `${time} мин` },
    servings && { label: "Порций", value: String(servings) },
    kcal && { label: "Ккал", value: String(kcal) },
    protein && { label: "Белки", value: `${protein} г` },
    fat && { label: "Жиры", value: `${fat} г` },
    carbs && { label: "Углеводы", value: `${carbs} г` },
  ].filter(Boolean) as { label: string; value: string }[];

  if (!facts.length) return null;

  return (
    <div className="not-prose my-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-6">
      {facts.map((f) => (
        <div key={f.label} className="bg-[var(--surface)] px-3 py-4 text-center">
          <p className="font-display text-lg font-semibold">{f.value}</p>
          <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {f.label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function Figure({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="not-prose my-8">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[var(--line)]">
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
      </div>
      {caption && <figcaption className="mt-2 text-center text-sm text-[var(--ink-faint)]">{caption}</figcaption>}
    </figure>
  );
}

/** Внутренняя перелинковка — важна для SEO, поэтому вынесена в отдельный блок */
export function ReadAlso({ href, title }: { href: string; title: string }) {
  return (
    <p className="not-prose my-6 rounded-xl border-l-[3px] border-[var(--brand)] bg-[var(--brand-tint)] px-4 py-3 text-[0.95rem]">
      <span className="font-semibold text-[var(--brand-strong)]">Читайте также: </span>
      <Link href={href} className="underline underline-offset-2">
        {title}
      </Link>
    </p>
  );
}
