import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

/** Статический экспорт требует явно пометить метадата-роуты как статические */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/ru/search", "/en/search"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    // Директиву Host намеренно не выводим: Яндекс перестал её поддерживать
    // (с 2018 зеркало определяется 301-редиректами), а её наличие в robots.txt
    // Яндекс.Вебмастер отмечает как ошибку. Google Host никогда не использовал.
  };
}
