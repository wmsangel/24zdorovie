import Link from "next/link";
import type { Locale } from "@/config/site";
import { localePath } from "@/lib/i18n";

export function Logo({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  return (
    <Link
      href={localePath(locale)}
      className="group inline-flex items-center gap-2.5"
      aria-label="24zdorovie"
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand)] text-white shadow-[0_6px_16px_-6px_var(--brand)] transition-transform duration-300 group-hover:-rotate-6">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M12 21s-1.6-1.1-3.3-2.9C6.2 15.6 4 13 4 10a4 4 0 0 1 7.2-2.4L12 8.6l.8-1A4 4 0 0 1 20 10c0 3-2.2 5.6-4.7 8.1C13.6 19.9 12 21 12 21Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M6.5 12h3l1.2-2.2L13 14l1.2-2h3.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-[1.35rem] font-semibold tracking-tight">
          <span className="text-[var(--brand)]">24</span>zdorovie
        </span>
      )}
    </Link>
  );
}
