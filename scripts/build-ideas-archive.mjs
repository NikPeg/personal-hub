import fs from 'node:fs';
import path from 'node:path';

const rawPath = 'raw/ideas.txt';
const outRoots = {
  ru: 'content/ideas/ru',
  en: 'content/ideas/en',
};
const publicRoots = {
  ru: 'public/ideas/ru.json',
  en: 'public/ideas/en.json',
};
const translationsPath = 'raw/ideas-translations-en.json';
const translationCache = fs.existsSync(translationsPath) ? JSON.parse(fs.readFileSync(translationsPath, 'utf8')) : {};

const monthMap = new Map(Object.entries({
  'январь': '01', 'февраль': '02', 'март': '03', 'апрель': '04', 'май': '05', 'июнь': '06',
  'июль': '07', 'август': '08', 'сентябрь': '09', 'октябрь': '10', 'ноябрь': '11', 'декабрь': '12',
}));

const tagPairs = [
  ['technology', 'технологии', [/нейро|ии|ai|бот|прилож|сайт|телег|telegram|яндекс|компьют|программ|алгоритм|расширен|смартфон|телефон|vr|ar|нейросет|автомат|данн|чат/i]],
  ['business', 'бизнес', [/бизнес|стартап|прода|магазин|клиент|покуп|маркет|реклам|донат|подпис|монет|цен[аы]|деньг|руб|плат/i]],
  ['art', 'искусство', [/книг|рассказ|роман|фильм|сериал|игр|сюжет|геро|персонаж|музык|мем|комикс|аниме|театр|рисова|искусств/i]],
  ['education', 'образование', [/учеб|образован|школ|егэ|универ|курс|лекц|знан|учить|обуч|студент|экзам/i]],
  ['science', 'наука', [/наук|исслед|эксперимент|биолог|физик|математ|мозг|косм|хим|статист|медиц|врач/i]],
  ['future', 'будущее', [/будущ|косми|робот|метавселен|колони|цивилиз|через \d|когда появ|невесом|марс/i]],
  ['society', 'общество', [/обще|люд|город|страна|соци|сообществ|пользовател|народ|человек|мир|массов/i]],
  ['politics', 'политика', [/полит|выбор|государ|путин|навальн|росси|закон|парти|власть|правитель/i]],
  ['psychology', 'психология', [/психолог|чувств|эмоц|мотивац|страх|желан|сон|памят|вниман|счаст|боль|мысл/i]],
  ['communication', 'коммуникация', [/общен|разговор|чат|сообщ|письм|коммент|объясн|спрос|ответ|диалог|коммуникац/i]],
  ['management', 'управление', [/управ|менедж|команд|задач|план|процесс|систем|организац|проект|продуктив/i]],
  ['relationships', 'отношения', [/отношен|друг|семь|девуш|парень|любов|мама|папа|родител|дет[еи]|свидан/i]],
  ['economics', 'экономика', [/эконом|рынок|капитал|налог|зарплат|стоим|банк|кредит|инвест|долг|микрозайм/i]],
  ['ethics', 'этика', [/этик|морал|справедлив|добро|зло|довер|обман|честн|стыд|вина|правильно/i]],
  ['culture', 'культура', [/культур|традиц|язык|слово|русск|англ|медиа|блог|канал|пост|видео/i]],
  ['philosophy', 'философия', [/философ|смысл|жизн|смерт|сознани|реальн|истин|бог|душ|судьб/i]],
  ['work', 'работа', [/работ|карьер|офис|сотруд|професс|делать|создать|сделать|задач/i]],
  ['history', 'история', [/истори|древн|прошл|войн|ссср|археолог|музе|эпох/i]],
];

const privateNameReplacements = [
  [/\bНикита\s+Пеганов\b/g, 'Н. П.'], [/\bПеганов\s+Никита\b/g, 'П. Н.'], [/\bПеганова\s+Никиты\b/g, 'П. Н.'],
  [/\bНаст[яи]\s+Подольск(?:ая|ой)\b/g, 'Н. П.'], [/\bАни\s+Беликовой\b/g, 'А. Б.'], [/\bАня\s+Беликова\b/g, 'А. Б.'],
  [/\bПаш[ауе]?\s+Юшковск(?:ий|ого|ому)\b/g, 'П. Ю.'], [/\bОлег\s+Сидоренков\b/g, 'О. С.'], [/\bБогдан[а]?\s+Чечин[а]?\b/g, 'Б. Ч.'],
  [/\bВаня\s+Абизм\b/g, 'В. А.'], [/\bДаяны\s+Тей\b/g, 'Д. Т.'], [/\bДаяна\s+Тей\b/g, 'Д. Т.'],
  [/\bШамшев[ауы]?\b/g, 'Ш.'], [/\bШамша\b/g, 'Ш.'],
  [/\bКат(?:я|и|е|ю)\b/g, 'К.'], [/\bОл(?:я|и|е|ю)\b/g, 'О.'], [/\bЮл(?:я|и|е|ю)\b/g, 'Ю.'], [/\bТан(?:я|и|е|ю)\b/g, 'Т.'],
  [/\bВан(?:я|и|е|ю)\b/g, 'В.'], [/\bВит(?:я|и|е|ю)\b/g, 'В.'], [/\bГог(?:а|и|е|у)\b/g, 'Г.'], [/\bМаш(?:а|и|е|у)\b/g, 'М.'],
  [/\bНаст(?:я|и|е|ю)\b/g, 'Н.'], [/\bАндре[йяю]\b/g, 'А.'], [/\bОндре[йяю]\b/g, 'О.'], [/\bПолин(?:а|ы|е|у)\b/g, 'П.'],
  [/\bЕв(?:а|е|у|ы)\b/g, 'Е.'], [/\bДенис(?:а|у|ом)?\b/g, 'Д.'], [/\bМакс(?:е|а|у|ом)?\b/g, 'М.'], [/\bМам(?:а|ы|е|у)\b/g, 'М.'],
];

const enNameReplacements = [
  [/\bН\. П\./g, 'N. P.'], [/\bП\. Н\./g, 'P. N.'], [/\bА\. Б\./g, 'A. B.'], [/\bП\. Ю\./g, 'P. Y.'], [/\bО\. С\./g, 'O. S.'], [/\bБ\. Ч\./g, 'B. C.'],
  [/\bВ\. А\./g, 'V. A.'], [/\bД\. Т\./g, 'D. T.'], [/\bШ\./g, 'Sh.'], [/\bК\./g, 'K.'], [/\bО\./g, 'O.'], [/\bЮ\./g, 'Y.'], [/\bТ\./g, 'T.'],
  [/\bВ\./g, 'V.'], [/\bГ\./g, 'G.'], [/\bМ\./g, 'M.'], [/\bН\./g, 'N.'], [/\bА\./g, 'A.'], [/\bП\./g, 'P.'], [/\bЕ\./g, 'E.'], [/\bД\./g, 'D.'],
];

const glossary = [
  ['идея', 'idea'], ['книга', 'book'], ['сайт', 'site'], ['приложение', 'app'], ['бот', 'bot'], ['нейросеть', 'neural network'], ['нейронка', 'neural net'],
  ['человек', 'person'], ['люди', 'people'], ['пользователь', 'user'], ['пользователи', 'users'], ['сделать', 'make'], ['создать', 'create'], ['можно', 'can'], ['нужно', 'need to'],
  ['например', 'for example'], ['история', 'story'], ['рассказ', 'short story'], ['фильм', 'film'], ['игра', 'game'], ['мемы', 'memes'], ['деньги', 'money'], ['магазин', 'store'],
  ['телефон', 'phone'], ['уведомления', 'notifications'], ['статистика', 'statistics'], ['образование', 'education'], ['будущее', 'future'], ['работа', 'work'], ['команда', 'team'],
  ['сообщество', 'community'], ['канал', 'channel'], ['пост', 'post'], ['видео', 'video'], ['текст', 'text'], ['подкаст', 'podcast'], ['комикс', 'comic'], ['автоматическое', 'automatic'],
  ['память', 'memory'], ['язык', 'language'], ['правила', 'rules'], ['космос', 'space'], ['власть', 'power'], ['мир', 'world'], ['жизнь', 'life'], ['смерть', 'death'],
];

function replacePersonal(out, pattern, repl) {
  return out.replace(new RegExp(`(?<![\\p{L}])(?:${pattern})(?![\\p{L}])`, 'giu'), repl);
}

function anonymizeRu(text) {
  let out = text;
  for (const [re, repl] of privateNameReplacements) out = out.replace(re, repl);
  const fullNames = [
    ['Никита\\s+Пеганов|Пеганов\\s+Никита|Пеганова\\s+Никиты|Nik\\s+Peg', 'Н. П.'],
    ['Наст[яи]\\s+Подольск(?:ая|ой)|Ани\\s+Беликовой|Аня\\s+Беликова|Ани\\s+Бывальцевой|Аня\\s+Бывальцева', 'А. Б.'],
    ['Паш[ауе]?\\s+Юшковск(?:ий|ого|ому)|Олег(?:а)?\\s+Сидоренков(?:а)?|Богдан[а]?\\s+Чечин[а]?|Ваня\\s+Абизм|Даяны\\s+Тей|Даяна\\s+Тей', (m) => m[0].toUpperCase() + '. ' + m.split(/\\s+/).at(-1)[0].toUpperCase() + '.'],
  ];
  for (const [pattern, repl] of fullNames) out = replacePersonal(out, pattern, repl);
  const singleNames = [
    ['Шамш(?:ев[ауы]?|ева|евым|еве|ем|а|у|е)?', 'Ш.'], ['Никит(?:а|ы|е|у|ой)?', 'Н.'], ['Кат(?:я|и|е|ю)|Карин(?:а|ы|е|у)', 'К.'], ['Ол(?:я|и|е|ю)|Олег(?:а|у|ом)?|Оскар(?:ом|а|у)?', 'О.'],
    ['Юл(?:я|и|е|ю)', 'Ю.'], ['Тан(?:я|и|е|ю)', 'Т.'], ['Ван(?:я|и|е|ю)|Вит(?:я|и|е|ю)', 'В.'], ['Гог(?:а|и|е|у)', 'Г.'],
    ['Маш(?:а|и|е|у)|Мам(?:а|ы|е|у)', 'М.'], ['Наст(?:я|и|е|ю)|Наташ(?:а|и|е|у)', 'Н.'], ['Андре[йяю]|Ондре[йяю]|Ан(?:я|и|е|ю)', 'А.'],
    ['Полин(?:а|ы|е|у)|Паш(?:а|и|е|у)', 'П.'], ['Ев(?:а|е|у|ы)', 'Е.'], ['Денис(?:а|у|ом)?|Даш(?:а|и|е|у)|Даян(?:а|ы|е|у)', 'Д.'],
    ['Макс(?:е|а|у|ом)?', 'М.'], ['Кабо', 'К.'],
  ];
  for (const [pattern, repl] of singleNames) out = replacePersonal(out, pattern, repl);
  return out;
}

function anonymizeEn(text) {
  let out = text;
  for (const [re, repl] of enNameReplacements) out = out.replace(re, repl);
  return out;
}

function cleanBody(text) {
  return anonymizeRu(text)
    .replace(/^\s*#(?:идея|книга)\s*$/gmi, '')
    .replace(/(^|\s)#(?:идея|книга)(?=\s|$|[:.,;!?])/gmi, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseEntries(raw) {
  const re = /(?:^|\n)(январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь)\s+(20\d{2})\s*(?=\n|$)/gi;
  const entries = [];
  let lastEnd = 0;
  let match;
  while ((match = re.exec(raw))) {
    const chunk = raw.slice(lastEnd, match.index).trim();
    if (chunk) entries.push({ raw: chunk, date: `${match[2]}-${monthMap.get(match[1].toLowerCase())}` });
    lastEnd = re.lastIndex;
  }
  const tail = raw.slice(lastEnd).trim();
  if (tail) throw new Error(`Unparsed tail after final date: ${tail.slice(0, 80)}`);
  return entries;
}

function titleFrom(text, fallback) {
  const first = text.split(/\n+/).map((line) => line.trim()).find(Boolean) || fallback;
  return first.replace(/^[#\-–—\s]+/, '').slice(0, 86).trim() || fallback;
}

function tagsFor(text, lang) {
  const found = [];
  for (const [en, ru, patterns] of tagPairs) {
    if (patterns.some((re) => re.test(text))) found.push(lang === 'ru' ? ru : en);
  }
  if (!found.length) found.push(lang === 'ru' ? 'общество' : 'society');
  return found.slice(0, 3);
}

function yamlString(value) {
  return JSON.stringify(value);
}

function markdown({ id, date, tags, sourceIndex, title, body }) {
  return `---\nid: ${yamlString(id)}\ndate: ${yamlString(date)}\ntags:\n${tags.map((tag) => `  - ${tag}`).join('\n')}\nsourceIndex: ${sourceIndex}\n---\n\n# ${title}\n\n${body}\n`;
}

function roughTranslate(text) {
  // Offline fallback translator: keeps structure and proper nouns, expands common archive terms,
  // and marks the result as a draft translation rather than leaking raw private names.
  let out = anonymizeEn(text);
  const protectedBrands = new Map();
  let i = 0;
  out = out.replace(/\b(?:Telegram|VK|YouTube|Yandex|Taggo|Donatello|Minecraft|Netflix|Google|Apple|Tinder|Twitter|GitHub|OpenAI|ChatGPT|Figma|Notion|Wikipedia|Навальный|Путин|Pelevin|Нолан|Kafka)\b/gi, (m) => {
    const key = `__BRAND_${i++}__`; protectedBrands.set(key, m); return key;
  });
  for (const [ru, en] of glossary) {
    out = out.replace(new RegExp(`\\b${ru}\\b`, 'giu'), en);
  }
  out = out
    .replace(/#([\p{L}\d_-]+)/gu, '#$1')
    .replace(/\bгг\b/giu, 'main character')
    .replace(/\bмб\b/giu, 'maybe')
    .replace(/\bтг\b/giu, 'Telegram')
    .replace(/\bирл\b/giu, 'IRL')
    .replace(/\bтд\b/giu, 'etc.')
    .replace(/\bт\.д\./giu, 'etc.')
    .replace(/\bт\.п\./giu, 'and so on');
  for (const [key, value] of protectedBrands) out = out.replaceAll(key, value);
  return `Draft English translation (offline):\n\n${out}`;
}


const raw = fs.readFileSync(rawPath, 'utf8');
const parsed = parseEntries(raw).map((entry, index) => {
  const sourceIndex = index + 1;
  const id = `idea-${String(sourceIndex).padStart(3, '0')}`;
  const ruBody = cleanBody(entry.raw);
  const ruTitle = titleFrom(ruBody, `Идея ${sourceIndex}`);
  const cachedTranslation = translationCache[id];
  const enBody = cachedTranslation?.body || roughTranslate(ruBody);
  const enTitle = (cachedTranslation?.title || roughTranslate(ruTitle).replace(/^Draft English translation \(offline\):\n\n/, '')).slice(0, 86);
  const ruTags = tagsFor(ruBody, 'ru');
  const enTags = tagsFor(ruBody, 'en');
  return { id, date: entry.date, sourceIndex, ruBody, ruTitle, enBody, enTitle, ruTags, enTags };
});

// Ensure output dirs exist — never delete existing files
for (const dir of Object.values(outRoots)) fs.mkdirSync(dir, { recursive: true });

// Write .md from raw only for files that don't already exist
for (const item of parsed) {
  const filename = `${item.id}.md`;
  const ruPath = path.join(outRoots.ru, filename);
  const enPath = path.join(outRoots.en, filename);

  if (!fs.existsSync(ruPath)) {
    fs.writeFileSync(ruPath, markdown({ id: item.id, date: item.date, tags: item.ruTags, sourceIndex: item.sourceIndex, title: item.ruTitle, body: item.ruBody }));
  }
  if (!fs.existsSync(enPath)) {
    fs.writeFileSync(enPath, markdown({ id: item.id, date: item.date, tags: item.enTags, sourceIndex: item.sourceIndex, title: item.enTitle, body: item.enBody }));
  }
}

// Parse an idea .md file into a JSON item
function parseMd(text, lang) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  const fm = m[1];
  const rawBody = m[2].trim();
  const id = (fm.match(/^id:\s*"([^"]+)"/m) || [])[1] || '';
  const date = (fm.match(/^date:\s*"([^"]+)"/m) || [])[1] || '';
  const sourceIndex = Number((fm.match(/^sourceIndex:\s*(\d+)/m) || [])[1] || 0);
  const tags = [...fm.matchAll(/^\s+-\s+(.+)$/gm)].map(t => t[1].trim());
  if (!id) return null;
  const h1 = rawBody.match(/^#\s+(.+)$/m);
  const title = h1 ? h1[1].trim() : titleFrom(rawBody, id);
  const body = rawBody.replace(/^#[^\n]*\n?/, '').trim();
  const fallbackTag = lang === 'ru' ? 'общество' : 'society';
  return {
    tags: tags.length ? tags : [fallbackTag],
    id, date, sourceIndex,
    title, text: body, fullText: body,
    tag: tags[0] || fallbackTag,
  };
}

// Build JSON from ALL .md files (raw-generated + manually added), sorted ASC by sourceIndex
function buildJson(dir, lang) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => parseMd(fs.readFileSync(path.join(dir, f), 'utf8'), lang))
    .filter(Boolean)
    .sort((a, b) => {
      if (!a.sourceIndex && !b.sourceIndex) return (b.date || '').localeCompare(a.date || '');
      if (!a.sourceIndex) return 1;
      if (!b.sourceIndex) return -1;
      return a.sourceIndex - b.sourceIndex;
    });
}

for (const [lang, file] of Object.entries(publicRoots)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(buildJson(outRoots[lang], lang), null, 0));
}

const total = fs.readdirSync(outRoots.ru).filter(f => f.endsWith('.md')).length;
console.log(`Built ${total} ideas into content/ideas/{ru,en} and public/ideas/{ru,en}.json (${parsed.length} from raw, ${total - parsed.length} added manually)`);
