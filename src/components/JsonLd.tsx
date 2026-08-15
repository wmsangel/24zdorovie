/** Вставка schema.org разметки. null-значения выкидываем, чтобы не мусорить в HTML. */
export function JsonLd({ data }: { data: unknown | unknown[] }) {
  const payload = Array.isArray(data) ? data.filter(Boolean) : data;
  if (!payload || (Array.isArray(payload) && payload.length === 0)) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload, (_key, value) => (value === undefined ? undefined : value)),
      }}
    />
  );
}
