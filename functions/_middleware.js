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

const LOCALES = ["ru", "en"];
// Префиксы, которые нельзя трогать правилом «без локали»
const RESERVED = /^\/(ru|en|_next|og|covers|ads)\//;
// Root-файлы и любые файлы с расширением обслуживаем как есть
const HAS_EXT = /\.[a-z0-9]{2,5}$/i;

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

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const p = url.pathname;

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

  // 2. Нормализация legacy-слагов тегов: регистр + пробел → дефис.
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

  // 3. Пути без префикса локали → русская версия (постоянный редирект).
  const noLocale =
    !RESERVED.test(p) &&
    !/^\/(ru|en)$/.test(p) &&
    !HAS_EXT.test(p) &&
    p !== "/";
  if (noLocale) {
    return redirect(`${url.origin}/ru${p}`, 301);
  }

  return next();
}
