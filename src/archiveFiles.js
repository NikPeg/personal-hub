const cache = new Map();

export async function loadArchive(kind, lang) {
  const safeKind = kind === 'quotes' ? 'quotes' : 'thoughts';
  const safeLang = lang === 'ru' ? 'ru' : 'en';
  const key = `${safeKind}:${safeLang}`;
  if (cache.has(key)) return cache.get(key);
  const response = await fetch(`/${safeKind}/${safeLang}.json?v=4`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Failed to load ${safeKind}: ${response.status}`);
  const items = await response.json();
  cache.set(key, items);
  return items;
}
