import fs from 'node:fs';

const sourcePath = 'public/quotes/ru.json';
const outPath = 'raw/quotes-translations-en.json';
const concurrency = Number(process.argv[2] || 4);
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const cache = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : {};

function hasCyrillic(text = '') {
  return /[А-Яа-яЁё]/.test(text);
}

async function translateText(text) {
  if (!text || !hasCyrillic(text)) return text || '';
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'ru');
  url.searchParams.set('tl', 'en');
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);
  const response = await fetch(url, { headers: { 'User-Agent': 'personal-hub-import/1.0' } });
  if (!response.ok) throw new Error(`translate failed ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return (data?.[0] || []).map((part) => part?.[0] || '').join('').trim();
}

function needsTranslation(item) {
  const cached = cache[item.id] || {};
  return hasCyrillic(item.quote) && !cached.quote
    || hasCyrillic(item.author) && !cached.author
    || hasCyrillic(item.source) && !cached.source;
}

const missing = source.filter(needsTranslation);
let completed = 0;
console.log(`Translating ${missing.length}/${source.length} missing quotes via Google Translate public endpoint`);

async function worker(queue) {
  while (queue.length) {
    const item = queue.shift();
    try {
      const existing = cache[item.id] || {};
      cache[item.id] = {
        quote: existing.quote || await translateText(item.quote),
        author: existing.author || await translateText(item.author),
        source: existing.source || await translateText(item.source),
      };
      completed += 1;
      if (completed % 10 === 0 || completed === missing.length) {
        fs.writeFileSync(outPath, JSON.stringify(cache, null, 0));
        console.log(`Translated ${completed}/${missing.length}`);
      }
    } catch (error) {
      console.error(`Failed ${item.id}: ${error.message}`);
      throw error;
    }
  }
}

await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker(missing)));
fs.writeFileSync(outPath, JSON.stringify(cache, null, 0));
console.log(`Wrote ${Object.keys(cache).length} translations to ${outPath}`);
