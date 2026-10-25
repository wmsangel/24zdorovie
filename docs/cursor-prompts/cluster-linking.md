# Cursor-промт — добить перелинковку кластеров (EN): burnout и biological age

**Пункт плана:** Очередь #4 — усилить перелинковку кластеров «статья↔инструмент» под проявленный спрос (burnout, biological age). Режим `→гибрид`: карта ссылок — автор (ниже, готова), расстановка по шаблону — Cursor.
**Важно:** бо́льшая часть ссылок уже стоит. Это добивание ТОЧЕЧНЫХ пробелов — добавить ровно перечисленные `<ReadAlso/>`, ничего больше не менять.

---

```
Задача: добавить недостающие внутренние ссылки <ReadAlso/> в EN-кластерах burnout и
biological age. Только эти вставки — не переписывай текст, не трогай другие ссылки,
RU-версии НЕ трогай (задача только про EN).

Контекст репо: Next.js 16, MDX-контент. Компонент <ReadAlso href="..." title="..." />
уже используется в этих файлах — копируй его синтаксис 1-в-1. Инструменты живут на
/en/tools/{slug}; статьи — /en/{category}/{slug}.

ПЕРЕД каждой вставкой проверь, нет ли уже такой ссылки (того же href) в файле — если есть,
пропусти (без дублей). Ставь новую строку <ReadAlso/> рядом с существующим блоком ReadAlso
в конце статьи (или сразу после наиболее релевантного раздела), той же разметкой и отступами.

Вставки (5 штук, по файлам):

1. content/en/longevity/vo2max-and-lifespan.mdx
   Добавить:
   <ReadAlso href="/en/tools/biological-age-calculator" title="Biological Age Calculator: PhenoAge From a Blood Test" />
   (VO₂max — маркер биологического возраста; страница сейчас на инструмент биовозраста не ссылается.)

2. content/en/longevity/biological-age-calculator → это страница ИНСТРУМЕНТА:
   content/tools/en/biological-age-calculator.mdx
   Добавить:
   <ReadAlso href="/en/longevity/how-to-lower-biological-age" title="How to Lower Your Biological Age: What Actually Works" />
   (ключевая actionable-статья-компаньон; сейчас инструмент ссылается на biological-age-tests и horvath-clock, но не на неё.)
   Если реальный title статьи в её frontmatter отличается — используй title из самой статьи.

3. content/tools/en/burnout-test.mdx
   Добавить:
   <ReadAlso href="/en/mental-health/student-burnout" title="Student Burnout: Symptoms, Causes and What Helps" />
   (у инструмента есть раздел про студентов, но ссылки на статью student-burnout нет; signs-recovery и dsm-5 уже стоят.)
   Если реальный title статьи отличается — используй title из самой статьи.

Контрольные точки (НЕ требуют изменений, просто убедись, что ссылки на месте; если какой-то
нет — добавь по тому же принципу, иначе пропусти):
- content/en/mental-health/burnout-dsm-5.mdx → /en/tools/burnout-test  (есть)
- content/en/mental-health/burnout-signs-recovery.mdx → /en/tools/burnout-test  (есть)
- content/en/mental-health/student-burnout.mdx → /en/tools/burnout-test  (есть)
- content/en/longevity/how-to-lower-biological-age.mdx → /en/tools/biological-age-calculator  (есть)

Критерии готовности / как проверить:
- Добавлены ровно недостающие <ReadAlso/> из списка (1–3), дублей нет.
- npm run build — без ошибок.
- npm run lint — чисто.
- Все href ведут на реально существующие страницы (проверь путём поиска файла в content/).
- В ответе: какие строки в какие файлы добавлены (или пропущены как дубль) + подтверждение build/lint.
```
