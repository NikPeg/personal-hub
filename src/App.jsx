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
  if (slug === 'startup-fantasy') return 'project:startup-fantasy';
  if (slug === 'empathy-ai') return 'project:empathy-ai';
  if (slug === 'marketplace-site') return 'project:marketplace-site';
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
    <div className="cards three project-index-grid">{data.projects.map((project) => <button className="card project-card" key={project.id} onClick={() => project.url ? window.open(project.url, '_blank', 'noreferrer') : go(`project:${project.slug}`)}>
      <span className="tag">{project.tag}</span>
      <h3>{project.title}{project.url && <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" style={{marginLeft:'6px',verticalAlign:'middle',opacity:0.4}}><path fill="currentColor" d="M6 3h7v7l-2-2-3 3-1.5-1.5 3-3L7.5 5 6 3zm-3 1h2v2H3v6h6v-2h2v4H1V4h2z"/></svg>}</h3>
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
        <div className="league-orbit" aria-hidden="true"><span>AI</span><span>B2B</span><span>Bio</span><span>Fin</span><span>EdTech</span></div>
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

function EmpathyAiLanding({ t }) {
  const isRu = t.brandName === 'НикПег';
  const [statsIdx, setStatsIdx] = useState(0);
  const [statsManual, setStatsManual] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [reviewManual, setReviewManual] = useState(false);
  useEffect(() => {
    if (statsManual) return;
    const timer = setInterval(() => setStatsIdx(i => (i + 1) % 2), 5000);
    return () => clearInterval(timer);
  }, [statsManual]);
  useEffect(() => {
    if (reviewManual) return;
    const timer = setInterval(() => setReviewIdx(i => (i + 1) % 5), 7000);
    return () => clearInterval(timer);
  }, [reviewManual]);

  const c = isRu ? {
    eyebrow: 'Эдя · ИИ-психолог',
    title: 'Пишет первым.',
    lead: 'Не ждёт, пока напишешь. Сам выходит на связь — и помнит всё, о чём говорили. Проект прошёл в следующий этап гранта «Студенческий стартап».',
    cta: 'Попробовать в Telegram',
    ctaContact: 'Обсудить проект',
    statsPages: [
      [
        { val: '382',   label: 'пользователей\nзарегистрировалось' },
        { val: '14K+',  label: 'сообщений\nобработано' },
        { val: '24 / 7',label: 'доступен\nбез очередей' },
        { val: 'Грант', label: '«Студенческий\nстартап»', accent2: true },
      ],
      [
        { val: '118',  label: 'активных\nпользователей' },
        { val: '37',   label: 'сообщений\nв среднем' },
        { val: '12',   label: 'дней подряд —\nрекорд активности' },
        { val: '340',  label: 'сообщений\nза один день' },
      ],
    ],
    webEyebrow: 'Скоро · Веб-версия',
    webTitle: 'Отследи, как меняется твоё состояние',
    webPeriod: 'Дек 2024 — Май 2025',
    webUser: 'Азамат',
    webMoodLabel: 'Настроение',
    webStressLabel: 'Уровень стресса',
    webMonths: ['Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май'],
    f1t: 'Пишет первым', f1d: 'Большинство ботов ждут. Эдя сам пишет — о планах, интересах, как прошёл день. LLM генерирует каждое напоминание с учётом истории разговоров.',
    f2t: 'Помнит разговоры', f2d: 'Хранит историю. Если в понедельник ты рассказал о новом проекте, во вторник Эдя спросит, как всё прошло.',
    f3t: 'Анонимно и 24/7', f3d: 'Никаких записей, очередей, стигматизации. Работает в личных и групповых чатах в Telegram.',
    rt: '6 типов напоминаний', rd: 'Каждое сообщение — уникальный запрос к LLM. Интересы, планы, комплименты, юмор, ситуативное, «как дела» — ни одно не выглядит шаблонным.',
    rems: ['Интересы', 'Планы', 'Как дела', 'Комплименты', 'Юмор', 'Ситуативное'],
    m1: 'Привет! Как прошёл понедельник? Ты говорил, что начинаешь новый проект 👀',
    m2: 'Всё хорошо, спасибо что спросил',
    m3: 'Рад слышать! Расскажи — что за проект?',
    m4: 'Делаю AI-бот для психологической поддержки',
    m5: 'Это важная тема 🧠 Что делает его особенным?',
    m6: 'Сам пишет первым — не ждёт, пока напишут ему',
    notifySub: 'написал вам · только что',
    reviewsEyebrow: 'Отзывы',
    reviewsTitle: 'Что говорят пользователи',
    reviews: [
      { text: 'Не ожидал, что буду открываться боту — но Эдя умеет задавать именно те вопросы, которые нужны. Уже месяц пишу каждый день.', name: 'Азамат', role: 'студент' },
      { text: 'Была сложная неделя. Эдя написал сам — я даже не планировал открывать телеграм. Просто поговорил с ним и стало легче.', name: 'анонимно', role: '' },
      { text: 'Нравится, что он помнит. Рассказала про конфликт с подругой — через два дня спросил, как всё разрешилось.', name: 'Варя', role: '' },
      { text: 'Скептически относился к таким вещам, но тут работает. Наверное, потому что не навязывает советы — просто слушает и спрашивает.', name: 'Дмитрий', role: '' },
      { text: 'Начала разговор в 3 ночи, когда было совсем плохо. Он ответил сразу, без осуждения. Это много значит.', name: 'анонимно', role: '' },
    ],
    roadEyebrow: 'Планы',
    roadTitle: 'Куда движемся',
    road: [
      { phase: '✦ Сейчас', title: 'Telegram-бот', desc: '382 зарегистрированных пользователя, 118 активных. Проактивные напоминания, память разговоров, групповые чаты, реферальная система.', active: true },
      { phase: '→ Следующий шаг', title: 'Веб-версия', desc: 'Полноценный веб-интерфейс с историей диалогов, настройками и визуальной аналитикой настроения на основе NLP.', active: false },
      { phase: '→ Мобильные', title: 'Android и iOS', desc: 'Нативные приложения с push-уведомлениями, голосовыми сообщениями и офлайн-режимом.', active: false },
      { phase: '→ Интеграции', title: 'Сервисы психологов', desc: 'Когда бот замечает, что человеку нужна живая поддержка — проактивно предлагает подходящего специалиста прямо в чате. Партнёрство с платформами поиска психологов.', active: false },
    ],
    footer: 'Психологическая поддержка, которая не ждёт, пока ты попросишь.',
  } : {
    eyebrow: 'Edya · AI Psychologist',
    title: 'He writes first.',
    lead: 'Doesn\'t wait for you to start. Reaches out on its own — and remembers everything you\'ve shared. The project reached the next round of the "Student Startup" grant.',
    cta: 'Try on Telegram',
    ctaContact: 'Discuss the project',
    statsPages: [
      [
        { val: '382',   label: 'users\nregistered' },
        { val: '14K+',  label: 'messages\nprocessed' },
        { val: '24 / 7',label: 'always\navailable' },
        { val: 'Grant', label: '"Student\nStartup"', accent2: true },
      ],
      [
        { val: '118',  label: 'active\nusers' },
        { val: '37',   label: 'avg messages\nper user' },
        { val: '12',   label: 'day streak —\nactivity record' },
        { val: '340',  label: 'messages\nin one day' },
      ],
    ],
    webEyebrow: 'Coming soon · Web version',
    webTitle: 'Track how you feel over time',
    webPeriod: 'Dec 2024 — May 2025',
    webUser: 'Azamat',
    webMoodLabel: 'Mood',
    webStressLabel: 'Stress level',
    webMonths: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
    f1t: 'Writes first', f1d: 'Most bots wait. Edya reaches out on its own — about plans, interests, how the day went. LLM generates each reminder using conversation history.',
    f2t: 'Remembers conversations', f2d: 'Stores history. If you mentioned a new project on Monday, it will ask how it went on Tuesday.',
    f3t: 'Anonymous and 24/7', f3d: 'No registration, no waitlist, no stigma. Works in personal and group Telegram chats.',
    rt: '6 reminder types', rd: 'Every message is a unique LLM request. Interests, plans, compliments, humor, situational, check-ins — none looks like a template.',
    rems: ['Interests', 'Plans', 'Check-in', 'Compliments', 'Humor', 'Situational'],
    m1: 'Hey! How was Monday? You mentioned starting a new project 👀',
    m2: 'Good, thanks for asking!',
    m3: 'Glad to hear! What is the project?',
    m4: 'Building an AI bot for psychological support',
    m5: 'That\'s important work 🧠 What makes it different?',
    m6: 'It writes first — doesn\'t wait for the user to start',
    notifySub: 'messaged you · just now',
    reviewsEyebrow: 'Reviews',
    reviewsTitle: 'What users say',
    reviews: [
      { text: 'Didn\'t expect to open up to a bot — but Edya asks exactly the right questions. Been messaging every day for a month.', name: 'Azamat', role: 'student' },
      { text: 'Had a rough week. Edya messaged me before I even thought to open Telegram. Just talked it through and felt better.', name: 'anonymous', role: '' },
      { text: 'I like that it remembers. Told it about a conflict with a friend — two days later it asked how things resolved.', name: 'Varya', role: '' },
      { text: 'Was skeptical about this kind of thing, but it works. Probably because it doesn\'t push advice — just listens and asks.', name: 'Dmitry', role: '' },
      { text: 'Started a conversation at 3am when things were really hard. It responded right away, without judgment. That means a lot.', name: 'anonymous', role: '' },
    ],
    roadEyebrow: 'Roadmap',
    roadTitle: 'Where we\'re headed',
    road: [
      { phase: '✦ Now', title: 'Telegram bot', desc: '382 registered users, 118 active. Proactive reminders, conversation memory, group chats, referral system.', active: true },
      { phase: '→ Next', title: 'Web version', desc: 'Full web interface with conversation history, settings, and NLP-based mood analytics over time.', active: false },
      { phase: '→ Mobile', title: 'Android & iOS', desc: 'Native apps with push notifications, voice messages, and offline mode.', active: false },
      { phase: '→ Integrations', title: 'Psychology services', desc: 'When the bot senses someone needs live support — it proactively suggests a matched therapist right in the chat. Partnership with therapist-finding platforms.', active: false },
    ],
    footer: 'Psychological support that doesn\'t wait for you to ask.',
  };

  return <section className="empathy-ai-page reveal visible">
    <div className="empathy-bg-orb" aria-hidden="true"></div>
    <div className="empathy-hero">
      <div className="empathy-copy">
        <p className="empathy-kicker">{c.eyebrow}</p>
        <h1>{c.title}</h1>
        <p className="empathy-lead">{c.lead}</p>
        <div className="empathy-hero-actions">
          <a className="empathy-btn shimmer" href="https://t.me/kindness365bot" target="_blank" rel="noreferrer">{c.cta}</a>
          <a className="empathy-btn outline" href="https://t.me/nikpeg" target="_blank" rel="noreferrer">{c.ctaContact}</a>
        </div>
      </div>
      <div className="empathy-phone-wrap">
        <div className="empathy-phone-glow" aria-hidden="true"></div>
        <div className="phone-mockup empathy-mockup">
          <div className="phone-speaker"></div>
          <div className="phone-screen empathy-screen">
            <div className="phone-status"><span>9:41</span><span>5G 91%</span></div>
            <div className="empathy-chat-header">
              <img src="/assets/empathy-ai/edya-logo.jpg" alt="Эдя" className="empathy-avatar-img" />
              <div className="empathy-chat-meta"><strong>Эдя</strong><span>{c.notifySub}</span></div>
              <div className="empathy-dot" aria-hidden="true"></div>
            </div>
            <div className="empathy-messages">
              <div className="empathy-msg bot" style={{animationDelay:'.5s'}}>{c.m1}</div>
              <div className="empathy-msg user" style={{animationDelay:'3.5s'}}>{c.m2}</div>
              <div className="empathy-typing-window" style={{'--tw-delay':'4s','--tw-dur':'2.2s'}} aria-hidden="true"><div className="empathy-typing-inner"><span></span><span></span><span></span></div></div>
              <div className="empathy-msg bot" style={{animationDelay:'6.5s'}}>{c.m3}</div>
              <div className="empathy-msg user" style={{animationDelay:'9.5s'}}>{c.m4}</div>
              <div className="empathy-typing-window" style={{'--tw-delay':'10s','--tw-dur':'2.2s'}} aria-hidden="true"><div className="empathy-typing-inner"><span></span><span></span><span></span></div></div>
              <div className="empathy-msg bot" style={{animationDelay:'12.5s'}}>{c.m5}</div>
              <div className="empathy-msg user" style={{animationDelay:'15.5s'}}>{c.m6}</div>
              <div className="empathy-typing" aria-hidden="true"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="empathy-stats-outer">
      <div className="empathy-stats-carousel">
        <button className="empathy-stats-arrow" onClick={() => { setStatsIdx((statsIdx - 1 + 2) % 2); setStatsManual(true); }} aria-label="Previous">&#8249;</button>
        <div className="empathy-stats-row">
          {c.statsPages[statsIdx].map((s, i) => (
            <div key={`${statsIdx}-${i}`} style={{'--ci': i}} className={'empathy-stat' + (s.accent2 ? ' empathy-stat-grant' : '')}>
              <strong>{s.val}</strong><span>{s.label}</span>
            </div>
          ))}
        </div>
        <button className="empathy-stats-arrow" onClick={() => { setStatsIdx((statsIdx + 1) % 2); setStatsManual(true); }} aria-label="Next">&#8250;</button>
      </div>
      <div className="empathy-stats-dots">
        {[0, 1].map(i => <button key={i} className={'empathy-stats-dot' + (i === statsIdx ? ' active' : '')} onClick={() => { setStatsIdx(i); setStatsManual(true); }} aria-label={`Stats ${i + 1}`} />)}
      </div>
    </div>

    <div className="empathy-features">
      <article>
        <span className="empathy-feat-num">01</span>
        <h2>{c.f1t}</h2>
        <p>{c.f1d}</p>
      </article>
      <article>
        <span className="empathy-feat-num">02</span>
        <h2>{c.f2t}</h2>
        <p>{c.f2d}</p>
      </article>
      <article>
        <span className="empathy-feat-num">03</span>
        <h2>{c.f3t}</h2>
        <p>{c.f3d}</p>
      </article>
    </div>

    <div className="empathy-reminders-block">
      <div>
        <h2>{c.rt}</h2>
        <p>{c.rd}</p>
      </div>
      <div className="empathy-pills">
        {c.rems.map((r, i) => <span key={r} style={{'--i': i}}>{r}</span>)}
      </div>
    </div>

    <div className="empathy-roadmap">
      <p className="empathy-kicker">{c.roadEyebrow}</p>
      <h2>{c.roadTitle}</h2>
      <div className="empathy-road-grid">
        {c.road.map((item) => (
          <div key={item.title} className={'empathy-road-card' + (item.active ? ' active' : '')}>
            <span className="road-phase">{item.phase}</span>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="empathy-web-preview">
      <p className="empathy-kicker">{c.webEyebrow}</p>
      <h2>{c.webTitle}</h2>
      <div className="empathy-web-mockup">
        <div className="ewm-chrome">
          <div className="ewm-dots"><span/><span/><span/></div>
          <div className="ewm-url">app.edya.ai · {isRu ? 'Аналитика' : 'Analytics'}</div>
        </div>
        <div className="ewm-body">
          <div className="ewm-sidebar">
            <img src="/assets/empathy-ai/edya-logo.jpg" alt="Эдя" className="ewm-logo" />
            <div className="ewm-sidebar-nav">
              <span className="active">📊</span>
              <span>💬</span>
              <span>⚙️</span>
            </div>
            <div className="ewm-sidebar-user">{c.webUser[0]}</div>
          </div>
          <div className="ewm-content">
            <div className="ewm-content-header">
              <strong>{isRu ? 'Динамика состояния' : 'Wellbeing dynamics'}</strong>
              <span>{c.webPeriod}</span>
            </div>
            <div className="ewm-charts">
              <div className="ewm-chart-block">
                <div className="ewm-chart-meta">
                  <span>{c.webMoodLabel}</span>
                  <div><strong>78 / 100</strong><span className="ewm-delta pos">↑ +28</span></div>
                </div>
                <svg className="ewm-svg" viewBox="0 0 300 72" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="ea-mood-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity="0.32"/>
                      <stop offset="100%" stopColor="#c084fc" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,54 40,51 80,47 120,42 160,35 200,28 240,22 300,16 L300,72 0,72Z" fill="url(#ea-mood-g)"/>
                  <polyline points="0,54 40,51 80,47 120,42 160,35 200,28 240,22 300,16" fill="none" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="ewm-x-axis">{c.webMonths.map(m => <span key={m}>{m}</span>)}</div>
              </div>
              <div className="ewm-chart-block">
                <div className="ewm-chart-meta">
                  <span>{c.webStressLabel}</span>
                  <div><strong>34 / 100</strong><span className="ewm-delta neg">↓ −34</span></div>
                </div>
                <svg className="ewm-svg" viewBox="0 0 300 72" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="ea-stress-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity="0.28"/>
                      <stop offset="100%" stopColor="#f87171" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,18 40,22 80,28 120,35 160,42 200,50 240,56 300,62 L300,72 0,72Z" fill="url(#ea-stress-g)"/>
                  <polyline points="0,18 40,22 80,28 120,35 160,42 200,50 240,56 300,62" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="ewm-x-axis">{c.webMonths.map(m => <span key={m}>{m}</span>)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="empathy-reviews">
      <p className="empathy-kicker">{c.reviewsEyebrow}</p>
      <h2>{c.reviewsTitle}</h2>
      <div className="empathy-review-stage">
        <button className="empathy-review-arrow" onClick={() => { setReviewIdx((reviewIdx - 1 + c.reviews.length) % c.reviews.length); setReviewManual(true); }} aria-label="Previous">&#8249;</button>
        <div className="empathy-review-card" key={reviewIdx}>
          <div className="empathy-review-stars" aria-hidden="true">★★★★★</div>
          <p>«{c.reviews[reviewIdx].text}»</p>
          <div className="empathy-review-author">
            <strong>{c.reviews[reviewIdx].name}</strong>
            {c.reviews[reviewIdx].role && <span>· {c.reviews[reviewIdx].role}</span>}
          </div>
        </div>
        <button className="empathy-review-arrow" onClick={() => { setReviewIdx((reviewIdx + 1) % c.reviews.length); setReviewManual(true); }} aria-label="Next">&#8250;</button>
      </div>
      <div className="empathy-review-dots">
        {c.reviews.map((_, i) => <button key={i} className={'empathy-review-dot' + (i === reviewIdx ? ' active' : '')} onClick={() => { setReviewIdx(i); setReviewManual(true); }} aria-label={`Отзыв ${i + 1}`} />)}
      </div>
    </div>

    <div className="empathy-closing">
      <p>{c.footer}</p>
      <div className="empathy-closing-actions">
        <a className="empathy-btn shimmer" href="https://t.me/kindness365bot" target="_blank" rel="noreferrer">{c.cta}</a>
        <a className="empathy-btn outline" href="https://t.me/nikpeg" target="_blank" rel="noreferrer">{c.ctaContact}</a>
      </div>
    </div>
  </section>;
}

const MKT_TG_TOKEN = '8971665630:AAEXlRfpL_5Ya9yzk5Gbg0hmOMSjJwW6ydA';
const MKT_TG_CHAT  = import.meta.env.VITE_TG_CHAT_ID || '';

function MarketplaceSiteLanding({ t }) {
  const isRu = t.brandName === 'НикПег';
  const [slide, setSlide] = useState(0);
  const [form, setForm] = useState({ name: '', contact: '', shop: '', type: '', niche: '', message: '', consent: false });
  const [status, setStatus] = useState('idle'); // idle | sending | ok | err
  const [calc, setCalc] = useState({ turnover: 800000, commission: 18, extra: 7 });

  const portfolioItems = [
    { src: '/assets/posts/marketplace-portfolio-1.png', alt: 'Tkani Italii — интернет-магазин тканей', url: 'http://tkaniitalii.shveinayafeechka.ru', label: 'Tkani Italii', desc: isRu ? 'Интернет-магазин итальянских тканей' : 'Italian fabric online store' },
  ];

  const c = isRu ? {
    kicker: 'Своя витрина',
    title: 'Продавайте\nбез комиссий',
    lead: 'Соберём независимый канал продаж: каталог, корзина, оплата, аналитика — всё в вашем контуре, а не у маркетплейса.',
    cta: 'Обсудить проект',
    stats: [
      { val: '0%', label: 'комиссии\nс прямых заказов' },
      { val: '15–40%', label: 'теряете сейчас\nна площадках' },
      { val: '30 мин', label: 'бесплатный\nразбор ниши' },
    ],
    servicesKicker: 'Что получите',
    services: [
      { n: '01', title: 'Продающая витрина', text: 'Структура под ваши товары, подборки, карточки, отзывы и сценарии покупки без шаблонной перегруженности.' },
      { n: '02', title: 'Заказы и оплата', text: 'Корзина, заявки, онлайн-оплата, уведомления, интеграции с CRM — заявки не теряются.' },
      { n: '03', title: 'Рост прямых продаж', text: 'Аналитика, SEO-база, посадочные под рекламу, повторные касания и полноценная воронка.' },
    ],
    pkgsKicker: 'Форматы работы',
    pkgsTitle: 'С чего начать',
    pkgs: [
      { title: 'Лендинг', sub: 'Для одного оффера или теста прямого спроса. Для быстрого старта и проверки гипотезы.', timing: 'от 10 рабочих дней', price: '10 000 ₽', items: ['Один продающий сценарий', 'Форма заявки и аналитика', 'Адаптивная верстка'] },
      { title: 'Интернет-магазин', sub: 'Для каталога, повторных покупок и прямой оплаты', timing: 'от 3 недель', price: '30 000 ₽', items: ['Категории и карточки товаров', 'Корзина, заявки или онлайн-оплата', 'SEO-база и аналитика продаж'], featured: true },
      { title: 'Рост', sub: 'Доработка существующего сайта в полноценный канал', timing: 'после аудита', price: '50 000 ₽', items: ['Посадочные под рекламу', 'Интеграции с CRM и рассылками', 'A/B-гипотезы и рост конверсии'] },
    ],
    processKicker: 'Процесс',
    processTitle: 'От разбора до первой заявки',
    steps: [
      { n: '1', title: 'Разбор', text: 'Смотрю нишу, товары, маржу и текущие каналы. Определяем, почему покупатель должен идти напрямую.' },
      { n: '2', title: 'Прототип', text: 'Структура страниц, оффер, блоки доверия, сценарии заявки и карта интеграций.' },
      { n: '3', title: 'Дизайн и сборка', text: 'Адаптивный интерфейс, формы, аналитика, SEO-разметка и нужные сервисы.' },
      { n: '4', title: 'Запуск', text: 'Проверяем заявки, скорость, мобильную версию, передаём доступы и план улучшений.' },
    ],
    portfolioKicker: 'Пример работы',
    portfolioTitle: 'Что уже сделали',
    portfolioVisit: 'Открыть сайт',
    portfolioVisitLabel: 'Открыть сайт',
    calcKicker: 'Быстрый расчёт',
    calcTitle: 'Сколько денег уходит не в развитие, а в комиссии',
    calcLead: 'Введите оборот и ставки площадки. Калькулятор покажет, какой бюджет можно вернуть в собственный канал продаж: сайт, рекламу, контент и повторные покупки.',
    calcTurnover: 'Оборот в месяц, ₽',
    calcCommission: 'Комиссия площадки',
    calcExtra: 'Доп. удержания (логистика, хранение…)',
    calcLossMonth: 'Потери в месяц',
    calcLossYear: 'в год',
    formKicker: 'Заявка',
    formTitle: 'Отправить заявку',
    formLead: 'Напишите нишу, оборот и главную боль на маркетплейсе — предложу первый план запуска.',
    formAnchor: 'Отправить заявку',
    fName: 'Ваше имя', fContact: 'Telegram, WhatsApp или email',
    fNiche: 'Ниша и примерный оборот',
    fNichePlaceholder: 'Например: косметика, 900 000 ₽/мес',
    fShop: 'Ссылка на магазин на маркетплейсе (если есть)',
    fType: 'Что нужно?', fTypeOpts: ['Лендинг — 10 000 ₽', 'Интернет-магазин — 30 000 ₽', 'Улучшение существующего — 50 000 ₽', 'Пока не знаю'],
    fMsg: 'Что сейчас мешает продавать напрямую? (необязательно)',
    fSend: 'Отправить', fSending: 'Отправляю…',
    fOk: 'Заявка принята! Напишем в ближайшее время.',
    fErr: 'Не удалось отправить. Напишите нам напрямую.',
    fConsent: 'Я согласен(а) на обработку персональных данных',
    disclaimer: 'Цены указаны в ознакомительных целях и не являются публичной офертой.',
    contactsKicker: 'Связь',
    contactsTitle: 'Напишите нам',
    contacts: [
      { label: 'Telegram', value: '@nikpeg', url: 'https://t.me/nikpeg' },
      { label: 'WhatsApp', value: '+7 985 696-83-57', url: 'https://wa.me/79856968357' },
      { label: 'ВКонтакте', value: 'vk.com/nikpeg', url: 'https://vk.com/nikpeg' },
      { label: 'Email', value: 'peganov.nik@gmail.com', url: 'mailto:peganov.nik@gmail.com' },
    ],
    teamKicker: 'Команда',
    teamTitle: 'Кто делает',
    team: [
      { name: 'Никита Пеганов', role: 'Разработка и продукт', url: 'https://nikpeg.github.io/docs/CV.pdf', photo: '/assets/posts/team-nikpeg.jpg' },
      { name: 'Шамшев Андрей', role: 'Дизайн и фронтенд', url: 'https://shveinayafeechka.ru/cv/', photo: '/assets/posts/team-shamshev.jpg' },
    ],
    teamCta: 'Резюме',
    footer: 'Маркетплейс остаётся каналом — но перестаёт быть единственной кассой.',
  } : {
    kicker: 'Your Own Storefront',
    title: 'Sell without\ncommissions',
    lead: 'We build an independent sales channel: catalog, cart, payments, analytics — all in your domain, not the platform\'s.',
    cta: 'Discuss the project',
    stats: [
      { val: '0%', label: 'commission on\ndirect orders' },
      { val: '15–40%', label: 'you lose now\nto platforms' },
      { val: '30 min', label: 'free initial\nniche review' },
    ],
    servicesKicker: 'What you get',
    services: [
      { n: '01', title: 'Selling storefront', text: 'Built for your products, collections, cards, reviews, and purchase flows — no template bloat.' },
      { n: '02', title: 'Orders & payments', text: 'Cart, requests, online payment, notifications, CRM integrations — no lead falls through.' },
      { n: '03', title: 'Direct sales growth', text: 'Analytics, SEO basics, ad landing pages, repeat touchpoints, and a full conversion funnel.' },
    ],
    pkgsKicker: 'Formats',
    pkgsTitle: 'Where to start',
    pkgs: [
      { title: 'Landing page', sub: 'For a single offer or testing direct demand. A fast start to validate the idea before investing more.', timing: 'from 10 business days', price: '10 000 ₽', items: ['One selling scenario', 'Request form and analytics', 'Responsive layout'] },
      { title: 'Online store', sub: 'For a catalog, repeat purchases, and direct payment', timing: 'from 3 weeks', price: '30 000 ₽', items: ['Categories and product cards', 'Cart, requests, or online payment', 'SEO basics and sales analytics'], featured: true },
      { title: 'Growth', sub: 'Upgrading an existing site into a full sales channel', timing: 'after audit', price: '50 000 ₽', items: ['Ad landing pages', 'CRM and newsletter integrations', 'A/B tests and conversion lift'] },
    ],
    processKicker: 'Process',
    processTitle: 'From kickoff to first lead',
    steps: [
      { n: '1', title: 'Review', text: 'Examine the niche, products, margins, and current channels. Find why a buyer should come directly to you.' },
      { n: '2', title: 'Prototype', text: 'Page structure, offer, trust blocks, request flows, and integration map.' },
      { n: '3', title: 'Design & build', text: 'Responsive interface, forms, analytics, basic SEO markup, and the right services hooked up.' },
      { n: '4', title: 'Launch', text: 'Check requests, speed, mobile — hand over access and a roadmap of next improvements.' },
    ],
    portfolioKicker: 'Work example',
    portfolioTitle: 'What we\'ve built',
    portfolioVisit: 'Visit site',
    portfolioVisitLabel: 'Visit site',
    calcKicker: 'Quick estimate',
    calcTitle: 'How much goes to commissions right now',
    calcLead: 'Enter your turnover and platform rates. The calculator shows how much you can reclaim for your own sales channel: site, ads, content, and repeat buyers.',
    calcTurnover: 'Monthly turnover, ₽',
    calcCommission: 'Platform commission',
    calcExtra: 'Extra fees (logistics, storage…)',
    calcLossMonth: 'Monthly loss',
    calcLossYear: 'per year',
    formKicker: 'Application',
    formTitle: 'Send a request',
    formLead: 'Share your niche, turnover, and top pain on marketplaces — I\'ll suggest a launch plan.',
    formAnchor: 'Send a request',
    fName: 'Your name', fContact: 'Telegram, WhatsApp or email',
    fNiche: 'Niche and approximate turnover',
    fNichePlaceholder: 'E.g.: beauty products, ₽900 000/mo',
    fShop: 'Marketplace store link (if you have one)',
    fType: 'What do you need?', fTypeOpts: ['Landing page — 10 000 ₽', 'Online store — 30 000 ₽', 'Improve existing site — 50 000 ₽', 'Not sure yet'],
    fMsg: 'What\'s stopping you from selling directly? (optional)',
    fSend: 'Send', fSending: 'Sending…',
    fOk: 'Request received! We\'ll get back to you shortly.',
    fErr: 'Could not send. Please contact us directly.',
    fConsent: 'I agree to the processing of my personal data',
    disclaimer: 'Prices are indicative and do not constitute a public offer.',
    contactsKicker: 'Contact',
    contactsTitle: 'Get in touch',
    contacts: [
      { label: 'Telegram', value: '@nikpeg', url: 'https://t.me/nikpeg' },
      { label: 'WhatsApp', value: '+7 985 696-83-57', url: 'https://wa.me/79856968357' },
      { label: 'VKontakte', value: 'vk.com/nikpeg', url: 'https://vk.com/nikpeg' },
      { label: 'Email', value: 'peganov.nik@gmail.com', url: 'mailto:peganov.nik@gmail.com' },
    ],
    teamKicker: 'Team',
    teamTitle: 'Who builds it',
    team: [
      { name: 'Nikita Peganov', role: 'Development & product', url: 'https://nikpeg.github.io/docs/CV.pdf', photo: '/assets/posts/team-nikpeg.jpg' },
      { name: 'Andrey Shamshev', role: 'Design & frontend', url: 'https://shveinayafeechka.ru/cv/', photo: '/assets/posts/team-shamshev.jpg' },
    ],
    teamCta: 'Resume',
    footer: 'Marketplaces stay a channel. They just stop being the only register.',
  };

  const n = portfolioItems.length;

  return <section className="marketplace-page">
    <div className="marketplace-hero">
      <div className="marketplace-copy">
        <p className="startup-kicker">{c.kicker}</p>
        <h1>{c.title}</h1>
        <p>{c.lead}</p>
        <div className="startup-actions">
          <a className="startup-btn primary" href="https://t.me/nikpeg" target="_blank" rel="noreferrer">{c.cta}</a>
          <button className="startup-btn secondary" type="button" onClick={() => document.getElementById('mkt-form')?.scrollIntoView({ behavior: 'smooth' })}>{c.formAnchor}</button>
        </div>
      </div>
      <div className="marketplace-stats-board">
        {c.stats.map((s) => <div className="marketplace-stat" key={s.val}>
          <strong>{s.val}</strong>
          <span>{s.label}</span>
        </div>)}
      </div>
    </div>

    <div className="marketplace-section">
      <p className="startup-kicker">{c.calcKicker}</p>
      <h2 className="marketplace-section-title">{c.calcTitle}</h2>
      <p className="mkt-calc-lead">{c.calcLead}</p>
      <div className="mkt-calc">
        <div className="mkt-calc-inputs">
          <label className="mkt-field">
            <span>{c.calcTurnover}</span>
            <input type="number" min={0} step={10000} value={calc.turnover}
              onChange={e => setCalc(prev => ({...prev, turnover: Math.max(0, +e.target.value)}))} />
          </label>
          <label className="mkt-field">
            <span>{c.calcCommission} — <strong className="mkt-range-val">{calc.commission}%</strong></span>
            <input type="range" min={0} max={40} step={0.5} value={calc.commission}
              onChange={e => setCalc(prev => ({...prev, commission: +e.target.value}))} className="mkt-range" />
          </label>
          <label className="mkt-field">
            <span>{c.calcExtra} — <strong className="mkt-range-val">{calc.extra}%</strong></span>
            <input type="range" min={0} max={20} step={0.5} value={calc.extra}
              onChange={e => setCalc(prev => ({...prev, extra: +e.target.value}))} className="mkt-range" />
          </label>
        </div>
        <div className="mkt-calc-result">
          <div className="mkt-calc-loss-month">
            <span>{c.calcLossMonth}</span>
            <strong>{Math.round(calc.turnover * (calc.commission + calc.extra) / 100).toLocaleString('ru-RU')} ₽</strong>
          </div>
          <div className="mkt-calc-loss-year">
            {(Math.round(calc.turnover * (calc.commission + calc.extra) / 100) * 12).toLocaleString('ru-RU')} ₽ {c.calcLossYear}
          </div>
        </div>
      </div>
    </div>

    <div className="marketplace-section">
      <p className="startup-kicker">{c.servicesKicker}</p>
      <div className="marketplace-grid">
        {c.services.map((s) => <article className="marketplace-card" key={s.n}>
          <span className="startup-label">{s.n}</span>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </article>)}
      </div>
    </div>

    <div className="marketplace-section">
      <p className="startup-kicker">{c.pkgsKicker}</p>
      <h2 className="marketplace-section-title">{c.pkgsTitle}</h2>
      <div className="marketplace-packages">
        {c.pkgs.map((pkg) => <article className={`marketplace-pkg${pkg.featured ? ' featured' : ''}`} key={pkg.title}>
          <h3>{pkg.title}</h3>
          <p>{pkg.sub}</p>
          <strong>{pkg.timing}</strong>
          <ul>{pkg.items.map((item) => <li key={item}>{item}</li>)}</ul>
          <a className="startup-btn primary marketplace-price-btn" href="https://t.me/nikpeg" target="_blank" rel="noreferrer">{pkg.price}</a>
        </article>)}
      </div>
      <p className="mkt-not-offer">{c.disclaimer}</p>
    </div>

    <div className="marketplace-section">
      <p className="startup-kicker">{c.processKicker}</p>
      <h2 className="marketplace-section-title">{c.processTitle}</h2>
      <ol className="marketplace-process">
        {c.steps.map((s) => <li key={s.n}>
          <span>{s.n}</span>
          <div><h3>{s.title}</h3><p>{s.text}</p></div>
        </li>)}
      </ol>
    </div>

    <div className="marketplace-section">
      <p className="startup-kicker">{c.portfolioKicker}</p>
      <h2 className="marketplace-section-title">{c.portfolioTitle}</h2>
      <div className="marketplace-carousel-wrap">
        <div className="marketplace-carousel">
          <a href={portfolioItems[slide].url} target="_blank" rel="noreferrer" className="marketplace-carousel-link">
            <img src={portfolioItems[slide].src} alt={portfolioItems[slide].alt} />
            <div className="marketplace-carousel-overlay">
              <span>{c.portfolioVisitLabel} ↗</span>
            </div>
          </a>
          {n > 1 && <>
            <button className="mkt-arrow mkt-prev" onClick={(e) => { e.preventDefault(); setSlide(i => (i - 1 + n) % n); }} aria-label="Previous">‹</button>
            <button className="mkt-arrow mkt-next" onClick={(e) => { e.preventDefault(); setSlide(i => (i + 1) % n); }} aria-label="Next">›</button>
          </>}
          {n > 1 && <div className="mkt-dots">{portfolioItems.map((_, i) => <span key={i} className={i === slide ? 'active' : ''} onClick={() => setSlide(i)} />)}</div>}
        </div>
        <div className="marketplace-portfolio-meta">
          <strong>{portfolioItems[slide].label}</strong>
          <span>{portfolioItems[slide].desc}</span>
          <a className="marketplace-portfolio-link" href={portfolioItems[slide].url} target="_blank" rel="noreferrer">{portfolioItems[slide].url.replace(/^https?:\/\//, '')}</a>
        </div>
      </div>
    </div>

    <div className="marketplace-section mkt-two-col">
      <div className="mkt-col">
        <p className="startup-kicker">{c.contactsKicker}</p>
        <h2 className="marketplace-section-title">{c.contactsTitle}</h2>
        <div className="marketplace-contacts mkt-contacts-stack">
          {c.contacts.map((ct) => <a key={ct.label} className="marketplace-contact-card" href={ct.url} target="_blank" rel="noreferrer">
            <span className="mkt-contact-label">{ct.label}</span>
            <strong>{ct.value}</strong>
          </a>)}
        </div>
      </div>
      <div className="mkt-col">
        <p className="startup-kicker">{c.teamKicker}</p>
        <h2 className="marketplace-section-title">{c.teamTitle}</h2>
        <div className="marketplace-team">
          {c.team.map((m) => <article className="marketplace-member" key={m.name}>
            {m.photo && <img src={m.photo} alt={m.name} className="marketplace-member-photo" />}
            <h3>{m.name}</h3>
            <p>{m.role}</p>
            <a href={m.url} target="_blank" rel="noreferrer">{c.teamCta} →</a>
          </article>)}
        </div>
      </div>
    </div>

    <div className="marketplace-section" id="mkt-form">
      <p className="startup-kicker">{c.formKicker}</p>
      <h2 className="marketplace-section-title">{c.formTitle}</h2>
      <p className="mkt-form-lead">{c.formLead}</p>
      <form className="mkt-form" onSubmit={async (e) => {
        e.preventDefault();
        if (!MKT_TG_CHAT) { setStatus('err'); return; }
        setStatus('sending');
        const text = [
          `🏪 <b>Новая заявка — Своя витрина</b>`,
          `👤 Имя: ${form.name}`,
          `📞 Контакт: ${form.contact}`,
          form.niche   ? `🏷 Ниша/оборот: ${form.niche}` : null,
          form.shop   ? `🛒 Магазин: ${form.shop}` : null,
          form.type   ? `📦 Что нужно: ${form.type}` : null,
          form.message ? `💬 ${form.message}` : null,
        ].filter(Boolean).join('\n');
        try {
          const r = await fetch(`https://api.telegram.org/bot${MKT_TG_TOKEN}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: MKT_TG_CHAT, text, parse_mode: 'HTML' }),
          });
          setStatus(r.ok ? 'ok' : 'err');
        } catch { setStatus('err'); }
      }}>
        <div className="mkt-form-row">
          <label className="mkt-field">
            <span>{c.fName} *</span>
            <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          </label>
          <label className="mkt-field">
            <span>{c.fContact} *</span>
            <input required value={form.contact} onChange={e => setForm(f => ({...f, contact: e.target.value}))} />
          </label>
        </div>
        <label className="mkt-field">
          <span>{c.fNiche}</span>
          <input value={form.niche} onChange={e => setForm(f => ({...f, niche: e.target.value}))} placeholder={c.fNichePlaceholder} />
        </label>
        <div className="mkt-form-row">
          <label className="mkt-field">
            <span>{c.fShop}</span>
            <input value={form.shop} onChange={e => setForm(f => ({...f, shop: e.target.value}))} placeholder="https://www.wildberries.ru/seller/..." />
          </label>
          <label className="mkt-field">
            <span>{c.fType}</span>
            <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
              <option value="">—</option>
              {c.fTypeOpts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        </div>
        <label className="mkt-field">
          <span>{c.fMsg}</span>
          <textarea rows={3} value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} />
        </label>
        <label className="mkt-field mkt-consent">
          <input type="checkbox" required checked={form.consent} onChange={e => setForm(f => ({...f, consent: e.target.checked}))} />
          <span>{c.fConsent}</span>
        </label>
        {status === 'ok'  && <p className="mkt-status ok">{c.fOk}</p>}
        {status === 'err' && <p className="mkt-status err">{c.fErr}</p>}
        {status !== 'ok' && <button className="startup-btn primary mkt-submit" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? c.fSending : c.fSend}
        </button>}
      </form>
    </div>

  </section>;
}

function ProjectLanding({ t, data, slug, go }) {
  const project = data.projects.find((item) => item.slug === slug) || data.projects[0];
  if (project.slug === 'startup-fantasy') return <StartupFantasyLanding t={t} />;
  if (project.slug === 'empathy-ai') return <EmpathyAiLanding t={t} />;
  if (project.slug === 'marketplace-site') return <MarketplaceSiteLanding t={t} />;
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
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('lang');
    if (saved) return saved;
    return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
  });
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
    } else if (tab === 'project:empathy-ai') {
      document.title = lang === 'ru' ? 'Эдя — ИИ-психолог' : 'Edya — AI Psychologist';
    } else if (tab === 'project:marketplace-site') {
      document.title = lang === 'ru' ? 'Своя витрина' : 'Your Own Storefront';
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
    {!tab.startsWith('project:') && <Header tab={tab} go={go} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />}
    {tab.startsWith('project:') && <div className="floating-controls"><button className="pill" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}>{lang === 'en' ? 'RU' : 'EN'}</button><button className="pill icon-pill" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☾' : '☀'}</button></div>}
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
    <footer className={`footer${tab.startsWith('project:') ? ' footer--no-border' : ''}`}><button className="ghost footer-brand" onClick={() => go('home')}>{t.footerText}</button><nav className="footer-links" aria-label={t.footerLinksLabel}><a href="https://t.me/nikpeg" target="_blank" rel="noreferrer">Telegram</a><a href="https://www.linkedin.com/in/nikpeg/" target="_blank" rel="noreferrer">LinkedIn</a><a href="https://github.com/NikPeg" target="_blank" rel="noreferrer">GitHub</a></nav></footer>
  </>;
}
