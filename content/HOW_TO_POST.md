# Как выложить пост на сайт

## Шаги

### 1. Картинки → `public/assets/posts/`

Переименуй и перемести:
```bash
mv photo_2026-07-03_22-16-31.jpg public/assets/posts/my-slug-1.jpg
mv photo_2026-07-03_22-16-40.jpg public/assets/posts/my-slug-2.jpg
# и т.д.
```

### 2. Запись поста → `src/content.js`

Добавь **в начало** массива `posts` в обеих секциях — `en.posts` и `ru.posts`.

```js
{
  id: 'my-slug',
  tag: 'аналитика',          // или: эссе | проект
  title: 'Заголовок поста',
  status: 'published',
  date: '2026-07-03',
  telegramUrl: 'https://t.me/nikpeg_dramas/79',
  images: [
    { src: '/assets/posts/my-slug-1.jpg', alt: 'описание' },
    { src: '/assets/posts/my-slug-2.jpg', alt: 'описание' },
  ],
  text: 'Короткий превью — первые 1-2 предложения.',
  fullText: 'Полный текст поста.\n\nАбзацы разделяются \\n\\n.'
}
```

> `text` — превью в карточке ленты  
> `fullText` — раскрывается по клику «читать дальше»  
> Если поста только на одном языке — скопируй запись в оба блока, текст можно не переводить

### 3. Собери и запушь

```bash
git add public/assets/posts/ src/content.js
git commit -m "Feed: add post 'Название'"
git push
```

CI сам задеплоит на `nikpeg.me`.

---

## Ключевые файлы

| Что | Где |
|-----|-----|
| Данные постов (RU + EN) | `src/content.js` → `ru.posts` / `en.posts` |
| Картинки постов | `public/assets/posts/` |
| Мысли (thoughts) | `content/thoughts/ru/` и `content/thoughts/en/` + `node scripts/build-thoughts-archive.mjs` |
