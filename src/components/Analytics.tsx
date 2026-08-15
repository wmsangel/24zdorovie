import Script from "next/script";
import { SITE } from "@/config/site";

/**
 * Аналитика. Всё выключено, пока в конфигах пустые id — в разработке
 * страницы чистые. Рекламный загрузчик здесь не подключается: он обязан
 * стоять в <head>, поэтому живёт в src/app/[locale]/layout.tsx.
 */
export function Analytics() {
  const { gaId, yandexMetrikaId } = SITE.analytics;

  return (
    <>
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}')`}
          </Script>
        </>
      )}

      {yandexMetrikaId && (
        <>
          {/*
            id тега НЕ должен совпадать с именем глобальной переменной снипета.
            При id="ym" браузер по правилу named access заводит window.ym,
            ссылающийся на сам <script>. Снипет делает m[i]=m[i]||function(){…},
            видит непустое значение, заглушку не создаёт — и следующий за ним
            вызов ym(...) падает с «ym is not a function». Счётчик при этом
            молча не инициализируется: tag.js грузится, но Ya._metrika.counters пуст.
          */}
          <Script id="yandex-metrika" strategy="afterInteractive">
            {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${yandexMetrikaId}','ym');ym(${yandexMetrikaId},'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true})`}
          </Script>
          <noscript>
            <div>
              {/* Пиксель Метрики — next/image здесь неприменим: нужен обычный тег без JS */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://mc.yandex.ru/watch/${yandexMetrikaId}`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </div>
          </noscript>
        </>
      )}

      {/*
        Загрузчик AdSense живёт в <head> в src/app/[locale]/layout.tsx.
        Здесь его быть не должно: два тега adsbygoogle.js на странице
        AdSense считает ошибкой реализации.
      */}
    </>
  );
}
