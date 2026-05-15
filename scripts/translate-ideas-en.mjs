import fs from 'node:fs';

const sourcePath = 'public/ideas/ru.json';
const outPath = 'raw/ideas-translations-en.json';
const concurrency = Number(process.argv[2] || 4);
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const cache = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : {};

async function translateText(text) {
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

let completed = 0;
const missing = source.filter((item) => !cache[item.id]?.body);
console.log(`Translating ${missing.length}/${source.length} missing ideas via Google Translate public endpoint`);

async function worker(queue) {
  while (queue.length) {
    const item = queue.shift();
    try {
      const body = await translateText(item.fullText);
      const title = body.split(/\n+/).map((line) => line.trim()).find(Boolean) || item.title;
      cache[item.id] = { title: title.slice(0, 120), body };
      completed += 1;
      if (completed % 25 === 0 || completed === missing.length) {
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
