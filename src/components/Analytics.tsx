import Script from "next/script";
import { SITE, PROD_HOST, CONSENT_REQUIRED_REGIONS } from "@/config/site";

/**
 * Загрузка счётчиков. Три вещи решаются здесь, до того как уйдёт хоть один хит:
 *
 *   1. Хост. Считаем только на боевом домене (PROD_HOST). Зеркало на
 *      `*.pages.dev`, превью и локальная сборка отдают тот же HTML и иначе
 *      слились бы в ту же проперти. На зеркале вдобавок стоит 301 в
 *      functions/_middleware.js — это подстраховка на уровне клиента.
 *   2. GA4. Consent Mode уже выставлен в <head> (layout.tsx, consent-init):
 *      в ЕЭЗ/UK/CH аналитические и рекламные cookies по умолчанию denied,
 *      поэтому GA шлёт оттуда обезличенные обращения без cookies, а баннер
 *      не нужен. Здесь только gtag('config') после дефолтов.
 *   3. Яндекс.Метрика. Region-параметра у неё нет, поэтому страну спрашиваем
 *      у Cloudflare (`/cdn-cgi/trace`) и в ЕЭЗ/UK/CH не грузим её вовсе.
 *      Не ответил или страна неизвестна — тоже не грузим.
 *
 * Описание для людей — на странице privacy, держать синхронно.
 * Загрузчик AdSense живёт в <head> (layout.tsx) и слушает те же consent-дефолты.
 */
export function Analytics() {
  const { gaId, yandexMetrikaId } = SITE.analytics;
  if (!gaId && !yandexMetrikaId) return null;

  const code = `(function(){
  if (location.hostname !== ${JSON.stringify(PROD_HOST)}) return;
  var dl = window.dataLayer = window.dataLayer || [];
  var gtag = window.gtag = window.gtag || function(){dl.push(arguments)};
${
  gaId
    ? `  gtag('js', new Date());
  gtag('config', ${JSON.stringify(gaId)});
  var ga = document.createElement('script');
  ga.async = true;
  ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + ${JSON.stringify(gaId)};
  document.head.appendChild(ga);
`
    : ""
}${
    yandexMetrikaId
      ? `  var ymId = ${Number(yandexMetrikaId)};
  var consentRegions = ${JSON.stringify([...CONSENT_REQUIRED_REGIONS])};
  function startMetrika(){
    window.ym = window.ym || function(){(window.ym.a = window.ym.a || []).push(arguments)};
    window.ym.l = +new Date();
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + ymId;
    document.head.appendChild(s);
    ym(ymId, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer:document.referrer, url:location.href, accurateTrackBounce:true, trackLinks:true});
  }
  fetch('/cdn-cgi/trace', {credentials:'omit'})
    .then(function(r){return r.text()})
    .then(function(txt){ var m = /(?:^|\\n)loc=([A-Z]{2})/.exec(txt); if (m && consentRegions.indexOf(m[1]) === -1) startMetrika(); })
    .catch(function(){});
`
      : ""
  }})();`;

  return (
    <Script id="analytics-init" strategy="afterInteractive">
      {code}
    </Script>
  );
}
