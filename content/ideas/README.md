# Ideas

## Добавить новую идею

Создай два файла напрямую — **не нужно трогать `raw/ideas.txt`**:

**`content/ideas/ru/idea-NNN.md`**
```
---
id: "idea-NNN"
date: "YYYY-MM"
tags:
  - тег
sourceIndex: NNN
---

# Название идеи

Описание идеи.
```

**`content/ideas/en/idea-NNN.md`**
```
---
id: "idea-NNN"
date: "YYYY-MM"
tags:
  - tag
sourceIndex: NNN
---

# Idea Title

English description.
```

`NNN` — следующий номер после последнего существующего файла.  
Затем пересобери JSON:

```bash
node scripts/build-ideas-archive.mjs
```

---

## Как это работает

- Скрипт читает все `.md`-файлы из этой директории и генерирует `public/ideas/{ru,en}.json`.
- Если файл `.md` уже существует — скрипт его **не трогает** (не перезаписывает и не удаляет).
- `raw/ideas.txt` — исторический архив. Идеи оттуда генерируют `.md` только если файл ещё не существует. Новые идеи в raw добавлять **не нужно**.
- Сортировка: по `sourceIndex` возрастающе (старее = выше, новые появляются внизу).
