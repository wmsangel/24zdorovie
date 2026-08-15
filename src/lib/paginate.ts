/**
 * Постраничная разбивка листингов.
 *
 * Архив всех статей рос вместе с сайтом и к сотне материалов стал отдавать
 * одну страницу с сотней карточек и сотней превью-картинок. Разбивка режет
 * её на части: первая страница остаётся по прежнему адресу
 * (/{locale}/articles/), остальные живут на /{locale}/articles/page/{n}/.
 *
 * Первая страница намеренно без /page/1 — иначе один и тот же список
 * доступен по двум адресам, и поисковику приходится выбирать.
 */

/**
 * Карточек на страницу. Кратно шести: ленты вставляют рекламный блок
 * после каждой шестой карточки, и при некратном размере последний блок
 * на странице оказывался бы висящим.
 */
export const PER_PAGE = 24;

export type Page<T> = {
  items: T[];
  /** Текущая страница, с единицы */
  page: number;
  /** Всего страниц, минимум 1 даже при пустом списке */
  pages: number;
  total: number;
  prev: number | null;
  next: number | null;
};

export function pageCount(total: number, perPage = PER_PAGE): number {
  return Math.max(1, Math.ceil(total / perPage));
}

export function paginate<T>(items: T[], page: number, perPage = PER_PAGE): Page<T> {
  const pages = pageCount(items.length, perPage);
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), pages);
  const start = (current - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    page: current,
    pages,
    total: items.length,
    prev: current > 1 ? current - 1 : null,
    next: current < pages ? current + 1 : null,
  };
}

/** Путь страницы листинга: первая — без суффикса */
export function pagePath(base: string, page: number): string {
  return page <= 1 ? base : `${base}/page/${page}`;
}

/**
 * Номера для навигации: всегда первая и последняя, соседи текущей,
 * между ними — многоточие. Возвращает null на месте пропуска.
 */
export function pageWindow(page: number, pages: number, radius = 1): (number | null)[] {
  const shown = new Set<number>([1, pages]);
  for (let i = page - radius; i <= page + radius; i++) {
    if (i >= 1 && i <= pages) shown.add(i);
  }

  const sorted = [...shown].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push(null);
    out.push(n);
    prev = n;
  }
  return out;
}
