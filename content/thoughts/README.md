# Thoughts

## Добавить новую мысль

Создай два файла напрямую — имя файла может быть как числовым (`thought-NNN.md`), так и slug-based (`my-thought-slug.md`):

**`content/thoughts/ru/<slug-или-thought-NNN>.md`**
```
---
id: thought-NNN
date: YYYY-MM
tags:
  - тег
sourceIndex: NNN
---

# Заголовок мысли

Текст мысли.
```

**`content/thoughts/en/<тот-же-slug>.md`**
```
---
id: thought-NNN
date: YYYY-MM
tags:
  - tag
sourceIndex: NNN
---

# Thought Title

English text.
```

`NNN` — следующий номер после последнего существующего `sourceIndex`.  
Затем пересобери JSON:

```bash
node scripts/build-thoughts-archive.mjs
```

---

## Как это работает

- Скрипт читает все `.md`-файлы из этой директории и генерирует `public/thoughts/{ru,en}.json`.
- Ни один существующий файл не удаляется и не перезаписывается.
- `raw/thoughts.txt` — исторический архив. Новые мысли в raw добавлять **не нужно**.
- Сортировка: по `sourceIndex` возрастающе (мысли — хронологический журнал). Файлы без `sourceIndex` появляются в конце.
- Названия файлов RU и EN должны совпадать (один slug на оба языка).
