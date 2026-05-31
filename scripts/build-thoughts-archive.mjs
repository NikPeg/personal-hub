import fs from 'node:fs';
import path from 'node:path';

const outRoots = {
  ru: 'content/thoughts/ru',
  en: 'content/thoughts/en',
};
const publicRoots = {
  ru: 'public/thoughts/ru.json',
  en: 'public/thoughts/en.json',
};

// Parse a thought .md file into a JSON item
function parseMd(text, lang) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  const fm = m[1];
  const rawBody = m[2].trim();

  // id may be quoted or unquoted
  const id = (fm.match(/^id:\s*"?([^"\n]+?)"?\s*$/m) || [])[1]?.trim() || '';
  const date = (fm.match(/^date:\s*"?([^"\n]+?)"?\s*$/m) || [])[1]?.trim() || '';
  const sourceIndex = Number((fm.match(/^sourceIndex:\s*(\d+)/m) || [])[1] || 0);
  const tags = [...fm.matchAll(/^\s+-\s+(.+)$/gm)].map(t => t[1].trim());
  if (!id) return null;

  const h1 = rawBody.match(/^#\s+(.+)$/m);
  const title = h1 ? h1[1].trim() : rawBody.split('\n').find(Boolean) || id;
  const body = rawBody.replace(/^#[^\n]*\n?/, '').trim();
  const fallbackTag = lang === 'ru' ? 'общество' : 'society';

  return {
    tags: tags.length ? tags : [fallbackTag],
    id, date, sourceIndex,
    title, text: body, fullText: body,
    tag: tags[0] || fallbackTag,
  };
}

// Build JSON from ALL .md files — sorted ASC by sourceIndex
// Items without sourceIndex (0) go to the end (manual additions not yet numbered)
function buildJson(dir, lang) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => parseMd(fs.readFileSync(path.join(dir, f), 'utf8'), lang))
    .filter(Boolean)
    .sort((a, b) => {
      if (!a.sourceIndex && !b.sourceIndex) return (b.date || '').localeCompare(a.date || '');
      if (!a.sourceIndex) return 1;  // no index → goes to end
      if (!b.sourceIndex) return -1;
      return a.sourceIndex - b.sourceIndex; // ASC: oldest first
    });
}

for (const [lang, file] of Object.entries(publicRoots)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const items = buildJson(outRoots[lang], lang);
  fs.writeFileSync(file, JSON.stringify(items, null, 0));
  console.log(`Built ${items.length} thoughts into ${file}`);
}
