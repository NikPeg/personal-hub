const cache = new Map();

export async function loadThoughts(lang) {
  const safeLang = lang === 'ru' ? 'ru' : 'en';
  if (cache.has(safeLang)) return cache.get(safeLang);
  const response = await fetch(`/thoughts/${safeLang}.json?v=3`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Failed to load thoughts: ${response.status}`);
  const items = await response.json();
  cache.set(safeLang, items);
  return items;
}
