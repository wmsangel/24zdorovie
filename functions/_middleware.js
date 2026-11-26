/**
 * Cloudflare Pages middleware — динамическая часть, которую раньше делал
 * public/.htaccess (mod_rewrite) и src/proxy.ts. Выполняется на edge перед
 * отдачей статики.
 *
 * Покрывает:
 *   1. выбор локали на `/` (кука locale → Accept-Language → ru);
 *   2. нормализацию legacy-слагов тегов (регистр и пробел → дефис);
 *   3. пути без префикса локали `/nutrition/x` → `/ru/nutrition/x`.
 *
 * Всё остальное (www→apex, HTTPS, фид, заголовки, кэш) — в настройках зоны,
 * _redirects и _headers.
 */

// Префиксы/папки, которые нельзя трогать правилом «без локали».
// Должны совпадать с реальными корневыми папками out/ (ru, en, _next,
// _not-found, og, covers, ads, rss, donate, 404) — иначе их бы увело на /ru/…
const RESERVED = /^\/(ru|en|_next|_not-found|og|covers|ads|rss|donate|404)(\/|$)/;
// Root-файлы и любые файлы с расширением обслуживаем как есть.
// Верхняя граница — 12 символов: расширения бывают длиннее пяти
// (manifest.webmanifest — 11), иначе такой файл уезжает на /ru/… и даёт 404.
const HAS_EXT = /\.[a-z0-9]{2,12}$/i;
// Файлы подтверждения прав в вебмастерах: корневые google<hex>.html и
// yandex_<hex>.html. Pages отдаёт такой файл и по адресу без «.html» (308),
// а безрасширенный адрес правило «без локали» увело бы на /ru/… → 404,
// и права в GSC/Яндексе отвалились бы при перепроверке.
const VERIFY = /^\/(google[0-9a-z]+|yandex_[0-9a-z]+)(\.html)?$/i;

function safeDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function redirect(location, status) {
  return new Response(null, { status, headers: { Location: location } });
}

/**
 * Жест-гейт партнёрского перехода /go (сетевой стандарт 20.11.2026, образец —
 * pawdget functions/go). Редирект получает только настоящий клик человека:
 * боты и префетч иначе засчитываются сетью как клики без единой продажи.
 *
 * Возвращает "click" / "click-legacy" (пропустить) либо причину отказа (→ 204).
 */
function goVerdict(request, url) {
  const h = request.headers;
  const ua = h.get("user-agent") || "";

  // 1. Не браузер или назвавшийся бот.
  if (!/Mozilla/i.test(ua) || /\b(bot|crawler|spider|scrape|preview|headless|monitor)\b/i.test(ua)) {
    return "bot-ua";
  }

  // 2. Префетч и пререндер — не клик, даже из настоящего браузера.
  const purpose = [h.get("sec-purpose"), h.get("purpose"), h.get("x-moz"), h.get("x-purpose")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/prefetch|prerender|preview|preload/.test(purpose)) return "prefetch";

  // 3. Переход по ссылке — всегда navigate/document, и в новой вкладке тоже.
  const mode = h.get("sec-fetch-mode");
  const dest = h.get("sec-fetch-dest");
  const site = h.get("sec-fetch-site");
  if ((mode && mode !== "navigate") || (dest && dest !== "document")) return "not-navigation";

  let sameHost = false;
  try {
    sameHost = new URL(h.get("referer") || "").host === url.host;
  } catch {
    /* Referer пуст или битый */
  }

  // 4. Sec-Fetch-* шлют Chrome 76+, Firefox 90+, Safari 16.4+ (и все iOS-браузеры
  //    на его движке). Без них пропускаем только действительно старую версию —
  //    и только со своим Referer; современный UA без заголовков — подделка.
  if (!mode && !dest && !site) {
    return sameHost && isLegacyBrowser(ua) ? "click-legacy" : "ua-mismatch";
  }

  // 5. `Sec-Fetch-User: ?1` приходит только после действия человека (клик, тап,
  //    Enter), в том числе по ссылке с target="_blank".
  if (h.get("sec-fetch-user") !== "?1") return "no-user-gesture";

  // 6. Клик должен прийти со страницы самого сайта.
  if (!(site === "same-origin" || site === "same-site" || sameHost)) return "no-referer";

  return "click";
}

/** Версия браузера старше той, с которой он шлёт Sec-Fetch-*. */
function isLegacyBrowser(ua) {
  let m;
  // iOS-браузеры (CriOS/FxiOS/Safari) — все на WebKit, версия = версия iOS.
  if ((m = ua.match(/\bOS (\d+)[_.](\d+)[\d_.]* like Mac OS X/))) {
    return Number(m[1]) < 16 || (Number(m[1]) === 16 && Number(m[2]) < 4);
  }
  if ((m = ua.match(/\b(?:Chrome|Chromium)\/(\d+)/))) return Number(m[1]) < 76;
  if ((m = ua.match(/\bFirefox\/(\d+)/))) return Number(m[1]) < 90;
  if ((m = ua.match(/\bVersion\/(\d+)\.(\d+).*\bSafari\//))) {
    return Number(m[1]) < 16 || (Number(m[1]) === 16 && Number(m[2]) < 4);
  }
  return false;
}

/**
 * Метка источника для партнёрской ссылки: слаг страницы, с которой кликнули.
 * `/en/sleep/jet-lag/` → `en_sleep_jet-lag`. Только [a-z0-9_-], до 64 знаков.
 */
function goSubId(src, referer, host) {
  let raw = src || "";
  if (!raw && referer) {
    try {
      const r = new URL(referer);
      if (r.host === host) raw = r.pathname;
    } catch {
      /* битый Referer — метки не будет */
    }
  }
  return raw
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\//g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 64);
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const p = url.pathname;

  // 0. Зеркало *.pages.dev → боевой домен. Один канонический хост: копия на
  //    pages.dev иначе отдаёт тот же контент и ту же аналитику (дубль + лишний
  //    счётчик). 301 с сохранением пути и query. Боевой апекс под правило не
  //    попадает, поэтому петли нет. Образец сети: prodom, pawdget, almanackit.
  if (url.hostname.endsWith(".pages.dev")) {
    return redirect("https://24zdorovie.com" + url.pathname + url.search, 301);
  }

  // 1. Корень: выбор локали. Ответ индивидуален (кука/язык) — не кэшируем.
  if (p === "/") {
    const cookie = request.headers.get("Cookie") || "";
    const m = cookie.match(/(?:^|;\s*)locale=(ru|en)\b/i);
    let loc = m ? m[1].toLowerCase() : null;
    if (!loc) {
      const al = (request.headers.get("Accept-Language") || "").trim();
      loc = /^en/i.test(al) ? "en" : "ru";
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/${loc}/`,
        "Cache-Control": "private, no-store",
        Vary: "Cookie, Accept-Language",
      },
    });
  }

  // 1b. Партнёрский редирект Amazon: /go/amazon-<ASIN> → Amazon с тегом проекта.
  //     302 (временный), /go/ закрыт в robots.txt — чтобы боты, идущие по прямой
  //     ссылке, не засчитывались как клики в Amazon Associates. Должно стоять до
  //     правила «без локали» (#4), иначе /go/… увело бы на /ru/go/….
  const amazonGo = p.match(/^\/go\/amazon-([A-Za-z0-9]{10})\/?$/i);
  if (amazonGo) {
    const verdict = goVerdict(request, url);
    // Строка в логах Pages (Real-time Logs): счётчика в БД у проекта нет.
    console.log(JSON.stringify({ go: "amazon", asin: amazonGo[1], verdict }));
    const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
    if (verdict !== "click" && verdict !== "click-legacy") {
      return new Response(null, { status: 204, headers: noStore });
    }
    // Метка страницы-источника: аккаунт Associates общий на сеть, без неё отчёт
    // не говорит, какая статья дала клик. Явный ?src= важнее Referer.
    const sub = goSubId(url.searchParams.get("src"), request.headers.get("referer"), url.host);
    const target =
      `https://www.amazon.com/dp/${amazonGo[1]}?tag=24zdorovie-20` +
      (sub ? `&ascsubtag=${sub}` : "");
    return new Response(null, { status: 302, headers: { Location: target, ...noStore } });
  }

  // 2. Старые адреса фида → русский RSS (до правила «без локали», иначе оно
  //    увело бы /rss на /ru/rss).
  if (/^\/(rss|feed)\/?$/.test(p)) {
    return redirect(url.origin + "/rss/ru.xml", 301);
  }

  // 3. Нормализация legacy-слагов тегов: регистр + пробел → дефис.
  //    Валидные адреса (строчные, через дефис) проходят без изменений.
  const tag = p.match(/^\/(ru|en)\/tag\/(.+?)\/?$/);
  if (tag) {
    const decoded = safeDecode(tag[2]);
    const norm = decoded.replace(/\s+/g, "-").toLowerCase();
    if (norm !== decoded.toLowerCase() || /[A-ZА-Я]/.test(decoded)) {
      const target = `/${tag[1]}/tag/${encodeURIComponent(norm)}/`;
      if (target !== `${p.replace(/\/?$/, "/")}`) return redirect(url.origin + target, 301);
    }
  }

  // 4. Пути без префикса локали → русская версия (постоянный редирект).
  const noLocale =
    !RESERVED.test(p) &&
    !VERIFY.test(p) &&
    !/^\/(ru|en)$/.test(p) &&
    !HAS_EXT.test(p) &&
    p !== "/";
  if (noLocale) {
    return redirect(`${url.origin}/ru${p}`, 301);
  }

  return next();
}
