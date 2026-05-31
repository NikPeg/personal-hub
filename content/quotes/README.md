# Quotes

## Добавить новую цитату

Создай два файла напрямую — **не нужно трогать `raw/quotes.txt`**:

**`content/quotes/ru/quote-NNN.md`**
```
---
id: "quote-NNN"
tags:
  - тег
sourceIndex: NNN
author: "Автор"
source: "Источник (опционально)"
---

Текст цитаты.
```

**`content/quotes/en/quote-NNN.md`**
```
---
id: "quote-NNN"
tags:
  - tag
sourceIndex: NNN
author: "Author"
source: "Source (optional)"
---

English quote text.
```

`NNN` — следующий номер после последнего существующего файла.  
Затем пересобери JSON:

```bash
node scripts/build-quotes-archive.mjs
```

---

## Как это работает

- Скрипт читает все `.md`-файлы из этой директории и генерирует `public/quotes/{ru,en}.json`.
- Если файл `.md` уже существует — скрипт его **не трогает** (не перезаписывает и не удаляет).
- `raw/quotes.txt` — исторический архив. Цитаты оттуда генерируют `.md` только если файл ещё не существует. Новые цитаты в raw добавлять **не нужно**.
- Сортировка: по `sourceIndex` убывающе (новее = сверху).
