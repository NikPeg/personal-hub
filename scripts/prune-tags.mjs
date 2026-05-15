import fs from 'node:fs';
import path from 'node:path';

const MAX_TAGS = Number(process.argv[2] || 35);
const archives = (process.argv[3] || 'thoughts,ideas').split(',').map((item) => item.trim()).filter(Boolean);
const langs = ['ru', 'en'];
const roots = archives.flatMap((archive) => langs.map((lang) => [`content/${archive}/${lang}`, `public/${archive}/${lang}.json`, lang, archive]));

function readMarkdown(file) {
  return fs.readFileSync(file, 'utf8');
}

function getTagsFromMarkdown(text) {
  const tags = [];
  const lines = text.split('\n');
  let inTags = false;
  for (const line of lines) {
    if (line === 'tags:') { inTags = true; continue; }
    if (inTags && /^\s+-\s+/.test(line)) tags.push(line.replace(/^\s+-\s+/, '').trim().replace(/^['\"]|['\"]$/g, ''));
    else if (inTags && line && !line.startsWith(' ')) break;
  }
  return tags;
}

function setTagsInMarkdown(text, tags) {
  const block = `tags:\n${tags.map((tag) => `  - ${tag}`).join('\n')}`;
  return text.replace(/tags:\n(?:\s+-\s+.*\n?)+/, `${block}\n`);
}

for (const [mdDir, jsonPath, lang, archive] of roots) {
  if (!fs.existsSync(mdDir) || !fs.existsSync(jsonPath)) {
    console.warn(`Skipping ${archive}/${lang}: missing ${mdDir} or ${jsonPath}`);
    continue;
  }
  const files = fs.readdirSync(mdDir).filter((name) => name.endsWith('.md')).map((name) => path.join(mdDir, name));
  const counts = new Map();
  for (const file of files) {
    for (const tag of getTagsFromMarkdown(readMarkdown(file))) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, MAX_TAGS).map(([tag]) => tag);
  const keep = new Set(top);
  let changedFiles = 0;
  for (const file of files) {
    const text = readMarkdown(file);
    const tags = getTagsFromMarkdown(text);
    const pruned = tags.map((tag) => tag.replace(/^['\"]|['\"]$/g, '')).filter((tag) => keep.has(tag));
    const finalTags = pruned.length ? pruned : [top[0]];
    const nextText = setTagsInMarkdown(text, finalTags);
    if (nextText !== text) {
      fs.writeFileSync(file, nextText);
      changedFiles += 1;
    }
  }
  const items = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let changedJson = 0;
  for (const item of items) {
    const tags = (item.tags || []).map((tag) => String(tag).replace(/^['\"]|['\"]$/g, '')).filter((tag) => keep.has(tag));
    item.tags = tags.length ? tags : [top[0]];
    item.tag = item.tags[0];
    if ((item.tags || []).join('\0') !== tags.join('\0')) changedJson += 1;
  }
  fs.writeFileSync(jsonPath, JSON.stringify(items, null, 0));
  console.log(`\n${archive}/${lang}: kept ${top.length}/${counts.size} tags, markdown changed: ${changedFiles}`);
  console.table([...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, Math.max(MAX_TAGS, 35)).map(([tag, count], index) => ({ rank: index + 1, tag, count, kept: keep.has(tag) })));
}
