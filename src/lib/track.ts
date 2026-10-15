import { SITE } from "@/config/site";

/**
 * Единая отправка событий в GA4 и Яндекс.Метрику.
 *
 * Счётчики подключаются в src/components/Analytics.tsx (глобальные gtag и ym).
 * Здесь — тонкая обёртка: одно имя события уходит в обе системы. Аналитика
 * никогда не должна ронять интерфейс, поэтому всё в try/catch.
 *
 * GA4: кладём объект `arguments` прямо в dataLayer — ровно так же делает сам
 * gtag(). Это queue-safe: если инлайн-скрипт gtag ещё не выполнился (гонка на
 * монтировании), gtag.js разберёт очередь, когда загрузится, и событие не теряется.
 *
 * В Метрике имена событий надо завести как цели (reachGoal), в GA4 ключевые —
 * отметить конверсиями. См. docs/WEEK-PLAN.md.
 */
type TrackParams = Record<string, string | number | boolean | undefined>;

export function track(name: string, params: TrackParams = {}) {
  if (!name || typeof window === "undefined") return;
  // Сетевое соглашение: у каждого события есть строковый `item` — главный разрез
  // «что именно произошло» (слаг инструмента, оффер, канал…). По нему центральная
  // система сети строит разбивку. Если явно не задан — выводим из основного параметра.
  const p: TrackParams = { ...params };
  if (p.item == null) {
    const primary =
      params.offer ??
      params.ad ??
      params.tool ??
      params.target ??
      params.kind ??
      params.search_term ??
      params.action ??
      params.where ??
      name;
    p.item = typeof primary === "string" ? primary : String(primary);
  }
  try {
    const w = window as unknown as {
      dataLayer?: unknown[];
      ym?: (...args: unknown[]) => void;
    };
    const dataLayer = (w.dataLayer = w.dataLayer || []);
    // arguments = ["event", name, params] — форма, которую ждёт gtag.js
    const gtagPush = function () {
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    } as (...args: unknown[]) => void;
    gtagPush("event", name, p);

    const id = SITE.analytics.yandexMetrikaId;
    if (typeof w.ym === "function" && id) w.ym(Number(id), "reachGoal", name, p);
  } catch {
    /* аналитика не должна ломать страницу */
  }
}
