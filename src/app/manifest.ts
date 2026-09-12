import type { MetadataRoute } from "next";
import { SITE, SITE_META } from "@/config/site";

/** Статический экспорт требует явно пометить метадата-роуты как статические */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_META.ru.title} — ${SITE_META.ru.tagline}`,
    short_name: SITE.name,
    description: SITE_META.ru.description,
    start_url: "/ru",
    display: "standalone",
    background_color: "#fbfaf6",
    theme_color: "#1fa268",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
