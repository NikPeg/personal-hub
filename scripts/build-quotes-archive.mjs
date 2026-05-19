import fs from 'node:fs';
import path from 'node:path';

const rawPath = 'raw/quotes.txt';
const outRoots = {
  ru: 'content/quotes/ru',
  en: 'content/quotes/en',
};
const publicRoots = {
  ru: 'public/quotes/ru.json',
  en: 'public/quotes/en.json',
};

const quoteDate = '2026-05';

const knownAttribution = {
  'quote-003': { author: 'Билл Бласс', source: '' },
  'quote-009': { author: 'преподаватель ПИ', source: '' },
  'quote-024': { author: 'Андрей Кончаловский', source: '' },
  'quote-068': { author: 'Макс Фрай', source: 'Кофейная книга' },
  'quote-061': { author: 'Макс Фрай', source: 'Наваждения' },
  'quote-071': { author: 'В.' },
  'quote-073': { author: 'Юлий Ким', source: 'Песня Остапа Бендера из фильма «12 стульев»' },
};

const englishOverrides = {
  'quote-001': {
    quote: 'If a person cannot understand another, attributing only evil intentions to them, and if they are constantly offended by others, that person impoverishes their own life and makes life harder for others.',
    author: 'Dmitry Likhachev',
  },
  'quote-003': {
    quote: 'When in doubt, wear red!',
    author: 'Bill Blass',
  },
  'quote-004': {
    quote: 'The dress must follow the lines of a woman\'s body, not the body fit the outline of the dress.',
    author: 'Hubert de Givenchy',
  },
  'quote-011': {
    quote: 'To humiliate oneself to the point of jealousy...',
    source: 'Anna Karenina',
  },
  'quote-020': {
    quote: 'I do not know the answer to your question, but sex is definitely the best answer.',
    author: 'Woody Allen',
  },
  'quote-024': {
    quote: 'We are all slaves to our image.',
    author: 'Andrei Konchalovsky',
  },
  'quote-069': {
    quote: 'A wife is like a candlestick. She has vibe, and you can put it in her.',
    author: 'P.',
  },
  'quote-070': {
    quote: 'There are only two important decisions in life: where to go and whom to take with you.',
    author: 'Jeffrey Gitomer',
    source: 'The Little Black Book of Connections',
  },
  'quote-072': {
    quote: '- Why do you want to go to a party like that?\n- The same reason people black out drink. There\'s nothing more fun than almost dying.',
    source: 'Krapopolis (https://www.wcostream.tv/krapopolis-season-2-episode-19-mazed-and-kingfused)',
  },
};

const tagPairs = [
  ['технологии', [/нейро|\bии\b|ai|алгоритм|данн|компьют|цифр|нол[ейя]|единиц/i]],
  ['психология', [/чувств|эмоц|желан|любов|страх|вина|стыд|счаст|ревност|самооцен|личност|мысл/i]],
  ['философия', [/жизн|смерт|морал|смысл|бог|душ|истин|справедлив|вселенн|человек/i]],
  ['культура', [/культур|язык|слов|книг|читает|песня|фильм|спектакль|литератур/i]],
  ['искусство', [/худож|красот|стиль|роман|кино|театр|игра|набоков|пастернак/i]],
  ['общество', [/обще|люд|мужчин|женщин|друз|начальств|цивилизац|расизм/i]],
  ['отношения', [/любов|друз|брак|поцелу|жен[аы]|дам[аеуы]|скарлетт|секс/i]],
  ['работа', [/работ|дел[оа]|достижен|цель|бизнес|имидж|начальств|подчин/i]],
  ['экономика', [/бизнес|заработ|капитал|рынок|цивилизац/i]],
  ['этика', [/морал|справедлив|зло|добро|вина|обман|правд|жесток/i]],
  ['история', [/египет|греци|пётр|декабрист|цивилизац|эпох/i]],
  ['наука', [/антрополог|математ|логик|факт|закономерн|прогноз/i]],
];

function anonymize(text) {
  return text
    .replace(/\bАни\b/g, 'А.')
    .replace(/\bАня\b/g, 'А.')
    .replace(/\bАне\b/g, 'А.')
    .replace(/\bАню\b/g, 'А.')
    .replace(/\bПолины\b/g, 'П.')
    .replace(/\bПолина\b/g, 'П.')
    .replace(/\bПолине\b/g, 'П.')
    .replace(/\bПолину\b/g, 'П.');
}

function emptyDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith('.md')) fs.unlinkSync(path.join(dir, name));
  }
}

function yamlString(value) {
  return JSON.stringify(value);
}

function titleFrom(text, fallback) {
  const first = text
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean) || fallback;
  return first
    .replace(/^[#\s\"'«»“”„❝❞-]+/, '')
    .replace(/[\"'«»“”„❝❞]+$/, '')
    .slice(0, 96)
    .trim() || fallback;
}

function tagsFor(text) {
  const found = [];
  for (const [tag, patterns] of tagPairs) {
    if (patterns.some((re) => re.test(text))) found.push(tag);
  }
  return found.length ? found.slice(0, 3) : ['культура'];
}

function normalizeLine(line) {
  return line.trim().replace(/^📚\s*/, '').replace(/^\(с\)\s*/i, '').trim();
}

function stripQuoteWrap(text) {
  return text
    .replace(/^\s*[❝«„“\"]\s*/, '')
    .replace(/\s*[❞»“”\"]\s*$/, '')
    .trim();
}

function cleanCredit(text) {
  return stripQuoteWrap(text).replace(/[,.;:]$/, '').trim();
}

function removeAsciiQuoteMarks(text) {
  return text.replace(/"/g, '').trim();
}

function ensureTerminalPunctuation(text) {
  const trimmed = text.trimEnd();
  if (!trimmed) return trimmed;
  if (/[.!?…][»”\"❞]?$/.test(trimmed)) return trimmed;
  if (/[»”\"❞]$/.test(trimmed)) return trimmed.replace(/([»”\"❞])$/, '.$1');
  return trimmed + '.';
}

function splitPersonAndSource(line) {
  const cleaned = normalizeLine(line).replace(/[.]$/, '').trim();
  const bookMatch = cleaned.match(/^(.+?)\s+["«](.+?)["»]$/);
  if (bookMatch) return { author: cleanCredit(bookMatch[1]), source: cleanCredit(bookMatch[2]) };
  const quotedBook = cleaned.match(/^["«](.+?)["»],?\s+(.+)$/);
  if (quotedBook) return { author: cleanCredit(quotedBook[2]), source: cleanCredit(quotedBook[1]) };
  const commaParts = cleaned.split(',').map((part) => part.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    const [first, ...rest] = commaParts;
    if (/^["«]/.test(first) || /фильм|песня|сериал|книга|роман/i.test(first)) {
      return { source: cleanCredit(first), author: cleanCredit(rest.join(', ')) };
    }
    return { author: cleanCredit(first), source: cleanCredit(rest.join(', ')) };
  }
  const dotParts = cleaned.split('.').map((part) => part.trim()).filter(Boolean);
  if (dotParts.length === 2 && dotParts[0].split(/\s+/).length <= 3) {
    return { author: cleanCredit(dotParts[0]), source: cleanCredit(dotParts[1]) };
  }
  if (/^(?:фильм|песня|из воспоминаний|с ниса|крапополис|анна каренина)/i.test(cleaned)) {
    return { source: cleanCredit(cleaned.replace(/^Фильм\s+/i, '')) };
  }
  return { author: cleanCredit(cleaned) };
}

function isAttributionLine(line) {
  const cleaned = normalizeLine(line);
  if (!cleaned) return false;
  if (/^преподаватель ПИ$/i.test(cleaned)) return true;
  if (/^[-—]/.test(cleaned) || /\s—\s/.test(cleaned)) return false;
  if (/^(?:[А-ЯA-Z]\.|[А-ЯA-Z]\.\s*[А-ЯA-Z]\.|от\s+[А-ЯA-Z]\.)$/.test(cleaned)) return true;
  if (/^(?:Фильм|Песня|Из воспоминаний|Крапополис|С НИСа)/i.test(cleaned)) return true;
  if (/["«].+["»]/.test(cleaned) && /,/.test(cleaned) && cleaned.length < 90) return true;
  if (/[,\.]/.test(cleaned) && /[А-ЯЁA-Z][а-яёa-z]+/.test(cleaned) && cleaned.length < 120) return true;
  const words = cleaned.split(/\s+/);
  return words.length <= 5 && /^[А-ЯЁA-Z]/.test(cleaned);
}

function isLikelyPersonLine(line) {
  const cleaned = normalizeLine(line);
  return /^[А-ЯЁA-Z][\p{L}.]+(?:\s+[А-ЯЁA-Z][\p{L}.]+){0,3}$/u.test(cleaned);
}

function extractQuoteMeta(body, sourceNote) {
  const paragraphs = body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const lines = body.split('\n').map((line) => line.trim()).filter(Boolean);
  let author = sourceNote ? sourceNote.replace(/^от\s+/i, '') : '';
  let source = '';

  if (lines.length > 2 && /^["«].+["»]$/.test(normalizeLine(lines.at(-1))) && isLikelyPersonLine(lines.at(-2))) {
    source = cleanCredit(lines.pop());
  }

  while (lines.length > 1 && isAttributionLine(lines.at(-1))) {
    const line = lines.pop();
    const split = splitPersonAndSource(line);
    if (split.author && !author) author = split.author;
    if (split.source && !source) source = split.source;
  }

  const singleLine = lines.length === 1 ? lines[0] : '';
  const dashAttribution = singleLine.match(/^(.+?)\s+[—-]\s+([^—-]{2,80})$/);
  if (dashAttribution && !author) {
    lines[0] = dashAttribution[1].trim();
    author = normalizeLine(dashAttribution[2]);
  }

  const inlineQuotedSource = lines.length === 1
    ? lines[0].match(/^["«](.+?)["»]\s+(.{2,80})$/)
    : null;
  if (inlineQuotedSource && !source && /^[А-ЯЁA-Z]/.test(inlineQuotedSource[2])) {
    lines[0] = inlineQuotedSource[1].trim();
    source = normalizeLine(inlineQuotedSource[2]);
  }

  const quote = ensureTerminalPunctuation(removeAsciiQuoteMarks(lines.join('\n')));
  if (!source && paragraphs.length > 1 && paragraphs.at(-1).length < 120 && isAttributionLine(paragraphs.at(-1))) {
    const split = splitPersonAndSource(paragraphs.at(-1));
    if (split.author && !author) author = split.author;
    if (split.source && !source) source = split.source;
  }

  return {
    quote: quote || ensureTerminalPunctuation(removeAsciiQuoteMarks(body)),
    author: author.trim(),
    source: source.trim(),
  };
}

function parseQuotes(raw) {
  const normalized = anonymize(raw).replace(/\r\n/g, '\n');
  const matches = [...normalized.matchAll(/^#цитата\s*([^\n]*)$/gim)];
  if (!matches.length) return [];

  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? normalized.length;
    const inlineText = match[1].trim();
    const sourceNote = /^(?:от\s+)?[А-ЯA-Z]\.$/.test(inlineText) ? inlineText : '';
    const leadingText = sourceNote ? '' : inlineText;
    const body = [leadingText, normalized.slice(start, end).trim()].filter(Boolean).join('\n').trim();
    return { body, sourceNote };
  }).filter((item) => item.body);
}

function markdown({ id, date, tags, sourceIndex, title, quote, author, source }) {
  const tagBlock = tags.map((tag) => '  - ' + tag).join('\n');
  const authorLine = author ? 'author: ' + yamlString(author) + '\n' : '';
  const sourceLine = source ? 'source: ' + yamlString(source) + '\n' : '';
  return '---\n'
    + 'id: ' + yamlString(id) + '\n'
    + 'date: ' + yamlString(date) + '\n'
    + 'tags:\n' + tagBlock + '\n'
    + 'sourceIndex: ' + sourceIndex + '\n'
    + authorLine
    + sourceLine
    + '---\n\n'
    + quote + '\n';
}

const parsed = parseQuotes(fs.readFileSync(rawPath, 'utf8')).map((item, index) => {
  const sourceIndex = index + 1;
  const id = 'quote-' + String(sourceIndex).padStart(3, '0');
  const meta = extractQuoteMeta(item.body, item.sourceNote);
  Object.assign(meta, knownAttribution[id] || {});
  const title = titleFrom(meta.quote, 'Цитата ' + sourceIndex);
  const tags = tagsFor([meta.quote, meta.author, meta.source].filter(Boolean).join('\n'));
  return {
    type: 'quote',
    id,
    date: quoteDate,
    sourceIndex,
    title,
    quote: meta.quote,
    text: meta.quote,
    fullText: meta.quote,
    author: meta.author,
    source: meta.source,
    tags,
    tag: tags[0],
  };
});

function asEnglishItem(item) {
  const override = englishOverrides[item.id] || {};
  const quote = ensureTerminalPunctuation(override.quote || item.quote);
  const author = override.author ?? item.author;
  const source = override.source ?? item.source;
  return {
    ...item,
    title: titleFrom(quote, item.title),
    quote,
    text: quote,
    fullText: quote,
    author,
    source,
  };
}

for (const dir of Object.values(outRoots)) emptyDir(dir);

const ruJson = [];
const enJson = [];

for (const item of parsed) {
  const filename = item.id + '.md';
  fs.writeFileSync(path.join(outRoots.ru, filename), markdown({
    id: item.id,
    date: item.date,
    tags: item.tags,
    sourceIndex: item.sourceIndex,
    title: item.title,
    quote: item.quote,
    author: item.author,
    source: item.source,
  }));

  const enItem = asEnglishItem(item);

  fs.writeFileSync(path.join(outRoots.en, filename), markdown({
    id: enItem.id,
    date: enItem.date,
    tags: enItem.tags,
    sourceIndex: enItem.sourceIndex,
    title: enItem.title,
    quote: enItem.quote,
    author: enItem.author,
    source: enItem.source,
  }));

  ruJson.push(item);
  enJson.push(enItem);
}

ruJson.sort((a, b) => b.sourceIndex - a.sourceIndex);
enJson.sort((a, b) => b.sourceIndex - a.sourceIndex);

for (const [lang, file] of Object.entries(publicRoots)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(lang === "ru" ? ruJson : enJson, null, 0));
}

console.log('Built ' + parsed.length + ' quotes into content/quotes/{ru,en} and public/quotes/{ru,en}.json');
