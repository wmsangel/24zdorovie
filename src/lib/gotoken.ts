/**
 * Click-time token для /go (клиент + сервер). Сетевой стандарт 27.11.2026,
 * вариант B' (образец — calclumen 977e622, costtrek 86c22e0): в HTML нет ни
 * партнёрского, ни /go-адреса — только href="#" и data-go. При доверенном
 * нажатии браузер вписывает в href /go/<id>?s=<страница>&q=<запрос>&t=<время>&k=<подпись>,
 * а functions/_middleware.js отдаёт редирект только со свежей подписью (15 мин).
 * Сохранённый список ссылок протухает за минуты. Это препятствие для повтора
 * собранных адресов, а не криптография: соль лежит в клиентском бандле.
 *
 * ВАЖНО: тот же алгоритм продублирован в functions/_middleware.js (Pages
 * Functions не импортируют из src). Менять синхронно; проверка — scripts/test-gotoken.mjs.
 */
const SALT = "24zdorovie/go/v1/5e9b30a7c4d2";
export const GO_TOKEN_TTL_S = 900;

function fnv1a(str: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function goSig(id: string, slug: string, q: string, t: string): string {
  const s = `${SALT}|${id}|${slug}|${q}|${t}`;
  const r = s.split("").reverse().join("");
  return fnv1a(s, 0x811c9dc5).toString(36) + fnv1a(r, 0x9747b28c).toString(36);
}

/** Слаг страницы для sub-id: `/en/sleep/jet-lag/` → `en_sleep_jet-lag`. */
export function slugFromPath(pathname: string): string {
  return pathname
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\//g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 64);
}

/** Адрес /go для клика, происходящего сейчас. Строится в браузере. */
export function goUrl(id: string, slug: string, q = "", nowMs: number = Date.now()): string {
  const t = Math.floor(nowMs / 1000).toString(36);
  const p = new URLSearchParams();
  if (slug) p.set("s", slug);
  if (q) p.set("q", q);
  p.set("t", t);
  p.set("k", goSig(id, slug, q, t));
  return `/go/${encodeURIComponent(id)}?${p.toString()}`;
}
