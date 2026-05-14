const ruModules = import.meta.glob('../content/thoughts/ru/*.md', { query: '?raw', import: 'default', eager: true });
const enModules = import.meta.glob('../content/thoughts/en/*.md', { query: '?raw', import: 'default', eager: true });

function parseValue(value) {
  return value.replace(/^['"]|['"]$/g, '').trim();
}

function parseThought(raw, path) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const frontmatter = match[1].split('\n');
  const body = match[2].trim();
  const meta = { tags: [] };
  let currentKey = null;
  for (const line of frontmatter) {
    if (/^\s+-\s+/.test(line) && currentKey === 'tags') {
      meta.tags.push(parseValue(line.replace(/^\s+-\s+/, '')));
      continue;
    }
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (pair) {
      currentKey = pair[1];
      if (currentKey === 'tags') {
        meta.tags = pair[2] ? pair[2].replace(/[\[\]]/g, '').split(',').map((tag) => parseValue(tag)).filter(Boolean) : [];
      } else {
        meta[currentKey] = parseValue(pair[2]);
      }
    }
  }
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : meta.id;
  const text = body.replace(/^#\s+.+\n?/, '').trim();
  return {
    ...meta,
    title,
    text,
    fullText: text,
    tag: meta.tags?.[0] || 'thought',
    path
  };
}

function load(modules) {
  return Object.entries(modules)
    .map(([path, raw]) => parseThought(raw, path))
    .filter(Boolean)
    .sort((a, b) => Number(a.sourceIndex) - Number(b.sourceIndex));
}

export const thoughtFiles = {
  ru: load(ruModules),
  en: load(enModules)
};
