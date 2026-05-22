import { useEffect, useMemo, useRef, useState } from 'react';
import { content } from './content.js';
import { dictionary } from './i18n.js';
import { loadArchive } from './archiveFiles.js';
import './styles.css';

const preloadedImages = new Set();

function preloadImage(src) {
  if (!src || preloadedImages.has(src) || typeof Image === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      preloadedImages.add(src);
      resolve();
    };
    image.onerror = resolve;
    image.src = src;
  });
}

function preloadImages(sources) {
  sources.filter(Boolean).forEach((src) => {
    preloadImage(src);
  });
}

const pathToTab = (pathname) => {
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '');
  if (!slug || slug === 'index.html') return 'home';
  if (['feed', 'channels', 'ideas', 'thoughts', 'quotes', 'projects', 'photos'].includes(slug)) return slug;
  if (['startup-fantasy', 'edu', 'scribo', 'slidebot'].includes(slug)) return `project:${slug}`;
  return 'home';
};

function Header({ tab, go, lang, setLang, theme, setTheme, t }) {
  const nav = [
    ['home', t.navHome], ['feed', t.navFeed], ['channels', t.navChannels], ['projects', t.navProjects], ['ideas', t.navIdeas], ['thoughts', t.navThoughts], ['quotes', t.navQuotes], ['photos', t.navPhotos]
  ];
  return <header className="site-header">
    <button className="brand ghost" onClick={() => go('home')} aria-label={`${t.brandName} home`}><img className="brand-logo" src="/logo.svg" alt="" /><span className="brand-text">{t.brandName}</span></button>
    <nav className="nav" aria-label="Main navigation">
      {nav.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => go(id)}>{label}</button>)}
    </nav>
    <div className="controls"><button className="pill" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}>{lang === 'en' ? 'RU' : 'EN'}</button><button className="pill icon-pill" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☾' : '☀'}</button></div>
  </header>;
}

function Hero({ t, lang }) {
  const scrollToFeed = () => {
    document.querySelector('.post-feed .post-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return <section className="hero section reveal visible">
    <div className="hero-copy">
      {t.eyebrow && <p className="eyebrow">{t.eyebrow}</p>}
      <h1 className={`rotating-title ${lang === 'ru' ? 'ru-title' : ''}`}><span className="rotating-words">{t.heroPhrases.map((phrase, index) => <span key={phrase} style={{ animationDelay: `${index * 2.1}s` }}>{phrase}</span>)}</span><span className="static-name">{t.heroStaticName}</span></h1>
      <p className="lead">{t.heroLead}</p>
      <div className="hero-actions">
        <a className="btn primary" href="https://t.me/nikpeg" target="_blank" rel="noreferrer">{t.contact}</a>
        <a className="btn secondary" href="https://nikpeg.github.io/docs/CV.pdf" target="_blank" rel="noreferrer">{t.cv}</a>
      </div>
    </div>
    <aside className="hero-card" aria-label="Identity card">
      <div className="portrait-wrap"><img src="/assets/nikpeg-portrait.jpg" alt={t.portraitAlt} className="portrait" /></div>
      <div className="status-line"><span>{t.identityLabel}</span><strong>{t.identityValue}</strong></div>
      <div className="metric-grid system-metrics"><div><b>94</b><span>{t.metricRepos}</span></div><div><b>99.95%</b><span>SLO</span></div><div><b>∞</b><span>{t.metricIdeas}</span></div></div>
    </aside>
    <button className="hero-scroll" type="button" onClick={scrollToFeed} aria-label="Scroll to latest post">↓</button>
  </section>;
}

function PageHeading({ eyebrow, title, lead }) {
  return <div className="section-heading page-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{lead && <p className="lead">{lead}</p>}</div>;
}

function NextLink({ label, onClick }) {
  return <div className="next-section-wrap"><button className="next-section-card" onClick={onClick}><span>{label}</span><strong>→</strong></button></div>;
}

function ImageCarousel({ images = [], title, eager = false, preloadNeighbors = false }) {
  const [index, setIndex] = useState(0);
  const [pendingIndex, setPendingIndex] = useState(null);
  const navigationRef = useRef(0);

  useEffect(() => {
    setIndex(0);
    setPendingIndex(null);
  }, [images]);

  useEffect(() => {
    if (!preloadNeighbors || !images.length) return;
    const current = images[index];
    const next = images[(index + 1) % images.length];
    const previous = images[(index - 1 + images.length) % images.length];
    preloadImages([current?.src, next?.src, previous?.src]);
  }, [images, index, preloadNeighbors]);

  if (!images.length) return null;
  const image = images[index];
  const navigate = (event, step) => {
    event.stopPropagation();
    const baseIndex = pendingIndex ?? index;
    const nextIndex = (baseIndex + step + images.length) % images.length;
    const requestId = navigationRef.current + 1;
    navigationRef.current = requestId;
    setPendingIndex(nextIndex);
    preloadImage(images[nextIndex]?.src).then(() => {
      if (navigationRef.current !== requestId) return;
      setIndex(nextIndex);
      setPendingIndex(null);
      const neighborIndex = (nextIndex + step + images.length) % images.length;
      preloadImage(images[neighborIndex]?.src);
    });
  };
  const previous = (event) => navigate(event, -1);
  const next = (event) => navigate(event, 1);
  return <div className={`carousel ${pendingIndex !== null ? 'is-loading-next' : ''}`}>
    <img src={image.src} alt={image.alt || title} loading={eager ? 'eager' : 'lazy'} decoding="async" />
    {images.length > 1 && <>
      <button className="carousel-arrow carousel-arrow-left" type="button" onClick={previous} aria-label="Previous image">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <button className="carousel-arrow carousel-arrow-right" type="button" onClick={next} aria-label="Next image">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
      </button>
    </>}
  </div>;
}

function OpenCard({ item, children, onOpen, className = 'card' }) {
  const open = () => onOpen(item);
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  };
  return <div className={`${className} open-card`} role="button" tabIndex={0} onClick={open} onKeyDown={handleKeyDown}>{children}</div>;
}

function QuoteCredit({ item }) {
  return <div className="quote-credit">
    {item.author && <span>{item.author}</span>}
    {item.source && <cite>{item.source}</cite>}
  </div>;
}

function QuoteCard({ item, onOpen }) {
  return <OpenCard className="card quote-row" item={item} key={item.id} onOpen={onOpen}>
    <div className="quote-row-top"><span className="tag">{item.tags?.join(' · ')}</span></div>
    <blockquote>{item.quote || item.fullText || item.text}</blockquote>
    <QuoteCredit item={item} />
  </OpenCard>;
}

function DetailModal({ item, onClose, t }) {
  const [copied, setCopied] = useState(false);
  if (!item) return null;
  const isQuote = item.type === 'quote' || Boolean(item.quote);
  const body = item.quote || item.fullText || item.text || item.description;
  const quoteLengthClass = isQuote
    ? body.length > 900 ? 'quote-modal-xl'
      : body.length > 420 ? 'quote-modal-long'
        : body.length > 180 ? 'quote-modal-medium'
          : 'quote-modal-short'
    : '';
  const credit = item.credit || (item.date ? `${item.date} by NikPeg` : 'by NikPeg');
  const quoteCredit = isQuote ? [item.author, item.source].filter(Boolean).join(', ') : credit;
  const copyText = [isQuote ? body : item.title, isQuote ? quoteCredit : body, isQuote ? null : credit].filter(Boolean).join('\n\n');
  async function copyToClipboard() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyText);
      } else {
        const area = document.createElement('textarea');
        area.value = copyText;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      setCopied(false);
    }
  }
  return <div className="modal-backdrop" role="presentation" onClick={onClose}>
    <article className={`modal-card ${isQuote ? 'quote-modal' : ''} ${quoteLengthClass}`} role="dialog" aria-modal="true" aria-label={isQuote ? body.slice(0, 80) : item.title} onClick={(event) => event.stopPropagation()}>
      <div className="modal-tools"><button className="copy-button" onClick={copyToClipboard} aria-label={t.copy}>{copied ? '✓' : '⧉'}</button>{item.telegramUrl && <a className="copy-button telegram-button" href={item.telegramUrl} target="_blank" rel="noreferrer" aria-label="Telegram post" onClick={(event) => event.stopPropagation()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.7 3.4 18.4 20c-.2 1-.8 1.2-1.6.8l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 13.4 1 11.8c-1-.3-1-1 .2-1.5L20.1 3c.9-.3 1.7.2 1.6.4Z" /></svg></a>}<button className="modal-close" onClick={onClose} aria-label={t.close}>×</button></div>
      <div className="modal-meta"><span className="tag">{item.tags?.join(' · ') || item.tag || item.type || t.note}</span>{!isQuote && item.date && <time>{item.date}</time>}</div>
      {isQuote ? <>
        <blockquote>{body}</blockquote>
        <QuoteCredit item={item} />
      </> : <>
        <h2>{item.title}</h2>
        <ImageCarousel images={item.images} title={item.title} eager preloadNeighbors />
        <p>{item.fullText || item.text || item.description}</p>
      </>}
    </article>
  </div>;
}



function Feed({ t, data, embedded = false, onOpen, go, nextLabel }) {
  const pageSize = 10;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef(null);
  const visiblePosts = data.posts.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [data.posts]);

  useEffect(() => {
    const firstPostImages = data.posts
      .slice(0, 10)
      .flatMap((post) => post.images?.map((image) => image.src) || []);
    preloadImages(firstPostImages);
  }, [data.posts]);

  useEffect(() => {
    if (visibleCount >= data.posts.length) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisibleCount((count) => Math.min(count + pageSize, data.posts.length));
    }, { rootMargin: '320px 0px' });
    const node = sentinelRef.current;
    if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount, data.posts.length]);

  return <section className={`section reveal visible ${embedded ? '' : 'page-hero'}`}>
    <div className="section-heading feed-heading"><p className="eyebrow">{t.feedEyebrow}</p>{!embedded && <><h2>{t.feedTitle}</h2><p className="lead">{t.feedLead}</p><a className="btn primary feed-subscribe" href="https://t.me/nikpeg_dramas" target="_blank" rel="noreferrer" aria-label={t.feedSubscribe}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.7 3.4 18.4 20c-.2 1-.8 1.2-1.6.8l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 13.4 1 11.8c-1-.3-1-1 .2-1.5L20.1 3c.9-.3 1.7.2 1.6.4Z" /></svg><span>{t.feedSubscribe}</span></a></>}</div>
    <div className="post-feed">{visiblePosts.map((post, postIndex) => <OpenCard className="card post-card" item={post} key={post.id} onOpen={onOpen}><span className="tag">{t[post.status] ?? post.status} · {post.tag}</span><ImageCarousel images={post.images} title={post.title} eager={postIndex < 10} preloadNeighbors={postIndex < 10} /><h3>{post.title}</h3><p>{post.fullText || post.text}</p></OpenCard>)}</div>
    <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />
    {go && nextLabel && <NextLink label={nextLabel} onClick={() => go('channels')} />}
  </section>;
}

function ArchivePage({ t, lang, onOpen, go, kind = 'thoughts' }) {
  const pageSize = 10;
  const archiveLabels = kind === 'ideas'
    ? { eyebrow: t.ideasEyebrow, title: t.ideasTitle, lead: t.ideasLead, loading: t.loading, next: t.nextThoughts, nextTab: 'thoughts' }
    : kind === 'quotes'
      ? { eyebrow: t.quotesEyebrow, title: t.quotesTitle, lead: t.quotesLead, loading: t.loadingQuotes, next: t.nextPhotos, nextTab: 'photos' }
      : { eyebrow: t.thoughtsEyebrow, title: t.thoughtsTitle, lead: t.thoughtsLead, loading: t.loading, next: t.nextQuotes, nextTab: 'quotes' }; 
  const [tag, setTag] = useState('all');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setTag('all');
    setVisibleCount(pageSize);
    loadArchive(kind, lang).then((loadedItems) => { if (active) { setItems(loadedItems); setLoading(false); } }).catch(() => { if (active) { setItems([]); setLoading(false); } });
    return () => { active = false; };
  }, [kind, lang]);
  const tags = useMemo(() => Array.from(new Set(items.flatMap((item) => item.tags || []))).sort(), [items]);
  const filteredItems = tag === 'all' ? items : items.filter((item) => item.tags?.includes(tag));
  const sortedItems = useMemo(() => [...filteredItems].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(b.sourceIndex || 0) - Number(a.sourceIndex || 0)), [filteredItems]);
  const visibleItems = sortedItems.slice(0, visibleCount);
  useEffect(() => {
    if (loading || visibleCount >= sortedItems.length) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisibleCount((count) => Math.min(count + pageSize, sortedItems.length));
    }, { rootMargin: '320px 0px' });
    const node = sentinelRef.current;
    if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [loading, visibleCount, sortedItems.length]);
  return <section className="section page-hero reveal visible">
    <PageHeading eyebrow={archiveLabels.eyebrow} title={archiveLabels.title} lead={archiveLabels.lead} />
    {loading ? <div className="glass-panel loading-panel">{archiveLabels.loading}</div> : <>
      <div className="toolbar tag-toolbar"><span>{t.filterByTag}</span><button className={tag === 'all' ? 'active' : ''} onClick={() => { setTag('all'); setVisibleCount(pageSize); }}>{t.allTags}</button>{tags.map((item) => <button key={item} className={tag === item ? 'active' : ''} onClick={() => { setTag(item); setVisibleCount(pageSize); }}>{item}</button>)}</div>
      <div className={kind === 'quotes' ? 'quote-list' : 'thought-list'}>{visibleItems.map(item => kind === 'quotes'
        ? <QuoteCard item={item} key={item.id} onOpen={onOpen} />
        : <OpenCard className="card thought-row" item={item} key={item.id} onOpen={onOpen}><div className="thought-row-top"><span className="tag">{item.tags?.join(' · ') || t.draft}</span>{item.date && <time className="thought-date">{item.date}</time>}</div><h3>{item.title}</h3><p>{item.fullText || item.text}</p></OpenCard>)}</div>
      <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />
      {archiveLabels.next && <NextLink label={archiveLabels.next} onClick={() => go(archiveLabels.nextTab)} />}
    </>}
  </section>;
}

function Channels({ t, data, go }) {
  const sections = data.channelSections || [{ id: 'links', title: t.channelsTitle, items: data.channels || [] }];

  return <section className="section page-hero reveal visible">
    <PageHeading eyebrow={t.channelsEyebrow} title={t.channelsTitle} lead={t.channelsLead} />
    <div className="channel-sections">{sections.map(section => <section className={`channel-section ${section.muted ? 'muted-channel-section' : ''}`} key={section.id}>
      <h3>{section.title}</h3>
      <div className="cards channel-grid">{section.items.map(channel => <a className="card channel-card" key={channel.id} href={channel.url} target="_blank" rel="noreferrer"><span className="tag">{channel.type}</span><h3>{channel.title}</h3><p>{channel.description}</p><strong>{t.open}</strong></a>)}</div>
    </section>)}</div>
    <NextLink label={t.nextProjects} onClick={() => go('projects')} />
  </section>;
}

function Projects({ t, data, go }) {
  return <section className="section page-hero reveal visible projects-index">
    <PageHeading eyebrow={t.projectsEyebrow} title={t.projectsTitle} lead={t.projectsLead} />
    <div className="cards three project-index-grid">{data.projects.map((project) => <button className="card project-card" key={project.id} onClick={() => go(`project:${project.slug}`)}>
      <span className="tag">{project.tag}</span>
      <h3>{project.title}</h3>
      <p>{project.text}</p>
      <strong>{t.openLanding}</strong>
    </button>)}</div>
    <NextLink label={t.nextIdeas} onClick={() => go('ideas')} />
  </section>;
}

function StartupFantasyLanding({ t }) {
  const isRu = t.brandName === 'НикПег';
  const copy = isRu ? {
    eyebrow: 'Fantasy Startup League',
    title: 'Фэнтези-лига стартапов',
    lead: 'Читаешь про стартапы, думаешь «я бы вложился» — но миллионов нет, да и не хочется рисковать. $10M виртуального капитала, реальные стартапы, годовой сезон. К концу видно, насколько хорошо ты чувствуешь рынок.',
    cta: 'Запросить ранний доступ',
    secondary: 'Посмотреть интерфейс',
    f1Title: 'Жанр: фэнтези-спорт',
    f1Text: 'В фэнтези-спорте участники получают бюджет и выбирают реальных игроков или команды — а очки считаются из настоящих результатов. Цель не в том, чтобы болеть за любимца, а в том, чтобы при ограничениях собрать состав, который принесёт максимум очков. Так просмотр любого соревнования превращается в управленческую игру.',
    bridgeTitle: 'Та же механика, но для венчурного рынка',
    bridgeText: 'Стартапы вместо спортсменов, год на рынке вместо соревновательного сезона. Виртуальный капитал у всех одинаковый — так стратегия видна отдельно от кошелька.',
    phoneTitle: 'Draft Room',
    webTitle: 'Portfolio Terminal',
    score: 'Счет сезона',
    budget: 'Кэш',
    rank: 'Место',
    nav: ['Портфель', 'Маркет', 'Новости'],
    valuation: 'Оценка портфеля',
    pnl: 'Доходность',
    committed: 'Инвестировано',
    cashLabel: 'Свободный кэш',
    draftAction: 'Купить',
    newsTitle: 'Стартап-новости недели',
    news: [
      ['Orbital Kitchens', 'поднял $48M Series B после запуска робо-кухонь в Сингапуре', '+420 pts'],
      ['Quiet Ledger', 'получил SOC 2 и подписал трех банковских клиентов', '+185 pts'],
      ['Neural Forge', 'потерял CTO, рынок режет мультипликатор AI-infra', '-96 pts']
    ],
    companies: [
      ['Neural Forge', 'AI infra', '$182M', '+24%', 'Купить'],
      ['Quiet Ledger', 'B2B fintech', '$74M', '+11%', 'Держать'],
      ['Cell Harbor', 'Bio tools', '$39M', '+7%', 'Купить'],
      ['Orbital Kitchens', 'Robotics', '$128M', '+31%', 'Следить']
    ],
    thesis: 'Тезис',
    thesisText: 'AI-инфраструктура и скучные B2B-рынки дадут больше очков, чем потребительский хайп.',
    mechanicsTitle: 'Как это работает',
    mechanics: ['Каждый игрок получает одинаковый виртуальный капитал.', 'На старте сезона он покупает доли в стартапах из общего рынка.', 'Очки начисляются за раунды, рост выручки, найм, запуски, публичные сигналы и выживаемость.', 'Таблица лидеров показывает не только результат, но и стиль мышления игрока.'],
    modelsTitle: 'Портфель многое говорит о человеке',
    models: ['Одни берут самое громкое — раунды, медиа, хайп.', 'Другие смотрят на основателей и скорость исполнения.', 'Третьи собирают скучное: B2B, инфраструктуру, всё что работает без шума.', 'Четвёртые идут all-in на одну ставку, пятые спорят с риском через диверсификацию.'],
    footer: 'Способ проверить своё понимание рынка — без настоящего капитала, но с настоящими стартапами.',
    finalLead: 'Монополия взлетела, потому что попала в нужный нерв — людям хотелось чувствовать себя инвесторами, пусть и виртуально. Fantasy Startup League — та же история, только рынок теперь венчурный.'
  } : {
    eyebrow: 'Fantasy Startup League',
    title: 'Fantasy Startup League',
    lead: 'You read about startups, think «I\'d invest» — but no millions, no desire to risk them. $10M virtual capital, real startups, a full season. By the end, you\'ll know how well you actually read the market.',
    cta: 'Request early access',
    secondary: 'View interface',
    f1Title: 'The genre: fantasy sport',
    f1Text: 'In fantasy sport, participants get a budget and pick real players or teams — then score points from actual results. The goal is not to root for a favorite but to build the roster that scores best under constraints. Watching the competition becomes a management problem.',
    bridgeTitle: 'The same mechanic, rebuilt for venture',
    bridgeText: 'Startups replace athletes, a market year replaces the competitive season. Every player starts with the same virtual capital — so strategy shows separately from resources.',
    phoneTitle: 'Draft Room',
    webTitle: 'Portfolio Terminal',
    score: 'Season score',
    budget: 'Cash',
    rank: 'Rank',
    nav: ['Portfolio', 'Market', 'News'],
    valuation: 'Portfolio value',
    pnl: 'Return',
    committed: 'Committed',
    cashLabel: 'Available cash',
    draftAction: 'Draft',
    newsTitle: 'Startup news this week',
    news: [
      ['Orbital Kitchens', 'raised a $48M Series B after launching robot kitchens in Singapore', '+420 pts'],
      ['Quiet Ledger', 'cleared SOC 2 and signed three banking customers', '+185 pts'],
      ['Neural Forge', 'lost its CTO, AI-infra multiples compress', '-96 pts']
    ],
    companies: [
      ['Neural Forge', 'AI infra', '$182M', '+24%', 'BUY'],
      ['Quiet Ledger', 'B2B fintech', '$74M', '+11%', 'HOLD'],
      ['Cell Harbor', 'Bio tools', '$39M', '+7%', 'BUY'],
      ['Orbital Kitchens', 'Robotics', '$128M', '+31%', 'WATCH']
    ],
    thesis: 'Thesis',
    thesisText: 'AI infrastructure and boring B2B markets will outscore consumer hype.',
    mechanicsTitle: 'How it works',
    mechanics: ['Every player receives the same virtual capital.', 'At the season start, they buy startup stakes from a shared market.', 'Points come from rounds, revenue growth, hiring, launches, public signals, and survival.', 'Leaderboards show not only performance, but each player’s thinking style.'],
    modelsTitle: 'Your portfolio reveals how you think',
    models: ['Some pick the loudest names: big rounds, media, hype.', 'Others look at founders and execution speed.', 'Some collect the boring stuff: B2B, infrastructure, everything that works without noise.', 'One player goes all-in on a single bet. Another argues with uncertainty through diversification.'],
    footer: 'A way to test how well you read the market — without real capital, with real startups.',
    finalLead: 'Monopoly took off because it hit the right nerve — people wanted to feel like investors, even virtually. Fantasy Startup League is the same idea, but the market is venture.'
  };

  return <section className="startup-fantasy-page reveal visible" id="projects">
    <div className="startup-fantasy-hero">
      <div className="startup-fantasy-copy">
        <p className="startup-kicker">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.lead}</p>
        <div className="startup-actions">
          <a className="startup-btn primary" href="https://t.me/nikpeg" target="_blank" rel="noreferrer">{copy.cta}</a>
          <a className="startup-btn secondary" href="#fantasy-interface">{copy.secondary}</a>
        </div>
      </div>
      <div className="startup-hero-board" aria-label={copy.webTitle}>
        <div className="league-ticket">
          <span>SEASON 2026</span>
          <strong>$10.0M BANKROLL</strong>
        </div>
        <div className="league-market-card">
          <div><span>{copy.valuation}</span><strong>$13.8M</strong></div>
          <div><span>{copy.pnl}</span><strong>+38.4%</strong></div>
          <div><span>{copy.committed}</span><strong>$8.7M</strong></div>
        </div>
        <div className="league-line-chart" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div className="league-orbit" aria-hidden="true"><span>AI</span><span>B2B</span><span>Bio</span><span>Fin</span></div>
        <div className="league-score-card">
          <small>{copy.score}</small>
          <strong>18,420</strong>
          <span>+14.8% / week · #128 global</span>
        </div>
      </div>
    </div>

    <div className="startup-explain-grid">
      <article>
        <span className="startup-label">01</span>
        <h2>{copy.f1Title}</h2>
        <p>{copy.f1Text}</p>
      </article>
      <article>
        <span className="startup-label">02</span>
        <h2>{copy.bridgeTitle}</h2>
        <p>{copy.bridgeText}</p>
      </article>
    </div>

    <div className="startup-product" id="fantasy-interface">
      <div className="phone-mockup" aria-label={copy.phoneTitle}>
        <div className="phone-speaker"></div>
        <div className="phone-screen">
          <div className="phone-status"><span>9:41</span><span>5G 86%</span></div>
          <div className="phone-top"><span>{copy.phoneTitle}</span><strong>$10.0M</strong></div>
          <div className="mobile-chart" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
          <div className="startup-card hot"><span>01</span><strong>Neural Forge</strong><em>AI infra · $2.4M ticket · +24%</em></div>
          <div className="startup-card"><span>02</span><strong>Quiet Ledger</strong><em>B2B fintech · $1.8M ticket · +11%</em></div>
          <div className="startup-card"><span>03</span><strong>Cell Harbor</strong><em>Bio tools · $1.5M ticket · +7%</em></div>
          <div className="phone-order"><span>{copy.cashLabel}</span><strong>$1.3M</strong><button type="button">{copy.draftAction}</button></div>
        </div>
      </div>
      <div className="desktop-mockup" aria-label={copy.webTitle}>
        <div className="desktop-top"><span></span><span></span><span></span><strong>{copy.webTitle}</strong></div>
        <div className="desktop-nav">{copy.nav.map((item) => <span key={item}>{item}</span>)}</div>
        <div className="dashboard-grid">
          <div className="dash-card score"><small>{copy.score}</small><strong>18,420</strong><span>Top 4%</span></div>
          <div className="dash-card"><small>{copy.valuation}</small><strong>$13.8M</strong><span>+38.4%</span></div>
          <div className="dash-card"><small>{copy.budget}</small><strong>$1.3M</strong><span>available</span></div>
          <div className="dash-chart"><i></i><i></i><i></i><i></i><i></i><i></i><b>$10M</b><b>$13.8M</b></div>
          <div className="dash-thesis"><small>{copy.thesis}</small><p>{copy.thesisText}</p></div>
          <div className="portfolio-table">{copy.companies.map((company) => <div key={company[0]}><strong>{company[0]}</strong><span>{company[1]}</span><b>{company[2]}</b><em>{company[3]}</em><small>{company[4]}</small></div>)}</div>
        </div>
      </div>
    </div>

    <div className="startup-news">
      <h2>{copy.newsTitle}</h2>
      <div>{copy.news.map((item) => <article key={item[0]}><strong>{item[0]}</strong><p>{item[1]}</p><span>{item[2]}</span></article>)}</div>
    </div>

    <div className="startup-detail-grid">
      <article>
        <h2>{copy.mechanicsTitle}</h2>
        <ul>{copy.mechanics.map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
      <article>
        <h2>{copy.modelsTitle}</h2>
        <ul>{copy.models.map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
    </div>

    <div className="startup-closing">
      <p>{copy.footer}</p>
      <a className="startup-btn dark" href="https://t.me/nikpeg" target="_blank" rel="noreferrer">{copy.cta}</a>
    </div>
  </section>;
}

function ProjectLanding({ t, data, slug, go }) {
  const project = data.projects.find((item) => item.slug === slug) || data.projects[0];
  if (project.slug === 'startup-fantasy') return <StartupFantasyLanding t={t} />;
  return <section className="section page-hero reveal visible landing-page">
    <p className="eyebrow">{project.tag}</p>
    <h2>{project.title}</h2>
    <p className="lead">{project.landingLead}</p>
    <div className="glass-panel landing-panel"><p>{project.landingText}</p><div className="hero-actions"><button className="btn primary" onClick={() => go('projects')}>{t.backToProjects}</button><a className="btn secondary" href="https://t.me/nikpeg" target="_blank" rel="noreferrer">Telegram</a></div></div>
  </section>;
}

function Photos({ t, go }) {
  return <section className="section page-hero reveal visible">
    <PageHeading eyebrow={t.photosEyebrow} title={t.photosTitle} lead={t.photosLead} />
    <div className="glass-panel empty-room"><span>◌</span></div>
    <NextLink label={t.nextHome} onClick={() => go('home')} />
  </section>;
}

export default function App() {
  const [tab, setTab] = useState(() => pathToTab(window.location.pathname));
  const [selected, setSelected] = useState(null);
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') === 'light' ? 'light' : 'dark');
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') === 'ru' ? 'ru' : 'en');
  const t = dictionary[lang] || dictionary.en;
  const data = content[lang] || content.en;

  useEffect(() => {
    const handlePopState = () => {
      setTab(pathToTab(window.location.pathname));
      setSelected(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [tab]);

  useEffect(() => {
    if (tab === 'project:startup-fantasy') {
      document.title = lang === 'ru' ? 'Фэнтези-лига стартапов' : 'Fantasy Startup League';
    } else {
      document.title = lang === 'en' ? 'Who is NikPeg?' : 'Кто такой НикПег?';
    }
  }, [tab, lang]);

  function go(nextTab) {
    setTab(nextTab);
    setSelected(null);
    const path = nextTab.startsWith('project:') ? `/${nextTab.split(':')[1]}` : nextTab === 'home' ? '/' : `/${nextTab}`;
    window.history.pushState({}, '', path);
  }
  function setTheme(value) { setThemeState(value); localStorage.setItem('theme', value); document.documentElement.dataset.theme = value; }
  function setLang(value) { setLangState(value); localStorage.setItem('lang', value); document.documentElement.lang = value; }
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = lang;

  return <>
    <div className="aurora" aria-hidden="true"></div><div className="grain" aria-hidden="true"></div>
    <Header tab={tab} go={go} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />
    <main className="page-shell" key={tab}>
      {tab === 'home' && <><Hero t={t} lang={lang} /><Feed t={t} data={data} embedded onOpen={setSelected} go={go} nextLabel={t.nextChannels} /></>}
      {tab === 'feed' && <Feed t={t} data={data} onOpen={setSelected} go={go} nextLabel={t.nextChannels} />}
      {tab === 'channels' && <Channels t={t} data={data} go={go} />}
      {tab === 'ideas' && <ArchivePage t={t} lang={lang} onOpen={setSelected} go={go} kind="ideas" />}
      {tab === 'thoughts' && <ArchivePage t={t} lang={lang} onOpen={setSelected} go={go} kind="thoughts" />}
      {tab === 'quotes' && <ArchivePage t={t} lang={lang} onOpen={setSelected} go={go} kind="quotes" />}
      {tab === 'projects' && <Projects t={t} data={data} go={go} />}
      {tab === 'photos' && <Photos t={t} go={go} />}
      {tab.startsWith('project:') && <ProjectLanding t={t} data={data} slug={tab.split(':')[1]} go={go} />}
    </main>
    <DetailModal item={selected} onClose={() => setSelected(null)} t={t} />
    <footer className="footer"><span>{t.footerText}</span><nav className="footer-links" aria-label={t.footerLinksLabel}><a href="https://t.me/nikpeg" target="_blank" rel="noreferrer">Telegram</a><a href="https://www.linkedin.com/in/nikpeg/" target="_blank" rel="noreferrer">LinkedIn</a><a href="https://github.com/NikPeg" target="_blank" rel="noreferrer">GitHub</a></nav></footer>
  </>;
}
