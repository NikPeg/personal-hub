import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  if (slug === 'ai-bubble') return 'project:ai-bubble';
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

const MKT_WORKER_URL = import.meta.env.VITE_MKT_WORKER_URL || '';

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
        if (!MKT_WORKER_URL) { setStatus('err'); return; }
        setStatus('sending');
        const text = [
          `🏪 <b>Новая заявка — Своя витрина</b>`,
          `👤 Имя: ${form.name}`,
          `📞 Контакт: ${form.contact}`,
          form.niche   ? `🏷 Ниша/оборот: ${form.niche}` : null,
          form.shop    ? `🛒 Магазин: ${form.shop}` : null,
          form.type    ? `📦 Что нужно: ${form.type}` : null,
          form.message ? `💬 ${form.message}` : null,
        ].filter(Boolean).join('\n');
        try {
          const r = await fetch(MKT_WORKER_URL, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
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

function AiBubbleLanding({ t }) {
  const isRu = t.brandName === 'НикПег';
  const canvasRef = useRef(null);
  const [openSc, setOpenSc] = useState(null);
  const [popup, setPopup] = useState(null);
  const logicRef = useRef(null);
  const evalRef = useRef(null);
  const bullRef = useRef(null);
  const scenRef = useRef(null);
  const metRef = useRef(null);
  const histRef = useRef(null);
  const compRef = useRef(null);
  const cmpRef = useRef(null);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const DownBtn = ({ to }) => (
    <div className="aib-down-wrap">
      <button className="aib-down-btn" onClick={() => scrollTo(to)}>↓</button>
    </div>
  );

  const termDefs = isRu ? {
    sp500:    { name: 'S&P 500', def: 'Индекс акций 500 крупнейших публичных компаний США по рыночной капитализации. Главный барометр американского рынка — когда S&P 500 растёт, американские инвесторы в среднем зарабатывают.' },
    pe:       { name: 'P/E', def: 'Price-to-Earnings — отношение цены акции к годовой прибыли на акцию. P/E 30 означает: рынок платит 30 долларов за каждый доллар прибыли. Чем выше — тем дороже акция относительно реальных заработков. В 2000-м NASDAQ имел P/E ~200×.' },
    fed:      { name: 'ФРС', def: 'Федеральная резервная система — центральный банк США. Управляет ключевой ставкой: низкая ставка делает деньги дешевле и стимулирует рынки. Повышение ставки — «тормоз» для экономики. Аналог Банка России.' },
    nasdaq:   { name: 'NASDAQ', def: 'Американская фондовая биржа, специализирующаяся на технологических компаниях. Apple, Microsoft, NVIDIA, Alphabet, Meta — все торгуются здесь.' },
    capex:    { name: 'Capex / капзатраты', def: 'Capital Expenditures — деньги, которые компании тратят на покупку оборудования, серверов и строительство дата-центров. В отличие от операционных расходов, это долгосрочные инвестиции.' },
    b2b:      { name: 'B2B', def: 'Business-to-Business — продажи между компаниями, не конечным потребителям. В B2B клиент — профессионал, платит за конкретный результат и не поддаётся хайпу. Делает спрос устойчивее, чем в B2C.' },
    aiwashing:{ name: 'AI-washing', def: 'Практика, когда компании добавляют слово «ИИ» к продуктам ради роста биржевой оценки, даже если реального ИИ внутри минимум. Аналог «greenwashing» в ESG-повестке.' },
  } : {
    sp500:    { name: 'S&P 500', def: 'An index of 500 of the largest publicly traded US companies by market cap. The main barometer of the American stock market.' },
    pe:       { name: 'P/E', def: 'Price-to-Earnings ratio — share price divided by annual earnings per share. A P/E of 30 means the market pays $30 for every $1 of profit. Higher = more expensive relative to real earnings. NASDAQ hit ~200× P/E in 2000.' },
    fed:      { name: 'The Fed', def: 'Federal Reserve System — the US central bank. Controls the benchmark interest rate: low rates mean cheap money and rising markets. Rate hikes put the brakes on the economy.' },
    nasdaq:   { name: 'NASDAQ', def: 'US stock exchange specializing in technology companies. Apple, Microsoft, NVIDIA, Alphabet, Meta — all trade here.' },
    capex:    { name: 'Capex', def: 'Capital Expenditures — money companies spend buying equipment, servers, and building data centers. Unlike operating expenses, these are long-term investments.' },
    b2b:      { name: 'B2B', def: 'Business-to-Business — selling to other companies rather than end consumers. B2B buyers are professionals paying for concrete results, not hype. Demand is more resilient than in B2C.' },
    aiwashing:{ name: 'AI-washing', def: 'When companies add "AI" to their products to boost stock valuation, even with minimal real AI inside. The AI equivalent of greenwashing.' },
  };

  const renderChart = (key) => {
    const W = 420, H = 170, PX = 36, PY = 24;
    const cfgs = {
      concentration: {
        title: isRu ? 'Топ-5 компаний: доля индекса S&P 500, %' : 'Top-5 companies: S&P 500 share, %',
        type: 'bar', color: '#fbbf24', unit: '%',
        pts: [{l:'2000',v:16},{l:'2010',v:11},{l:'2015',v:12},{l:'2020',v:23},{l:'2023',v:27},{l:'2025',v:29},{l:'2026',v:30}],
        src: 'S&P Global / Goldman Sachs', url: 'https://www.spglobal.com/spdji/en/indices/equity/sp-500/',
      },
      pe: {
        title: isRu ? 'P/E мультипликатор NASDAQ по годам' : 'NASDAQ P/E ratio by year',
        type: 'line', color: '#818cf8', unit: '×',
        pts: [{l:'1995',v:25},{l:'1998',v:70},{l:'2000',v:200},{l:'2002',v:28},{l:'2010',v:22},{l:'2015',v:28},{l:'2020',v:35},{l:'2022',v:20},{l:'2024',v:32},{l:'2026',v:30}],
        note: isRu ? 'Пик доткомов в 2000-м — ~200×' : 'Dot-com peak in 2000 — ~200×',
        src: 'Multpl.com', url: 'https://www.multpl.com/nasdaq-pe-ratio',
      },
      capex: {
        title: isRu ? 'Капзатраты на ИИ, млрд $' : 'AI capital expenditure, $B',
        type: 'bar', color: '#f87171', unit: 'B', prefix: '$',
        pts: [{l:'2022',v:90},{l:'2023',v:150},{l:'2024',v:280},{l:'2025',v:410},{l:'2026',v:650}],
        note: isRu ? '2025–2026: консенсус-оценки аналитиков' : '2025–2026: consensus analyst estimates',
        src: 'Goldman Sachs AI Capex Report', url: 'https://www.goldmansachs.com/insights/articles/generative-ai-capex-spending-is-expected-to-surge',
      },
      nvidia: {
        title: isRu ? 'Годовая выручка NVIDIA, млрд $' : 'NVIDIA annual revenue, $B',
        type: 'bar', color: '#4ade80', unit: 'B', prefix: '$',
        pts: [{l:'FY20',v:11},{l:'FY21',v:17},{l:'FY22',v:27},{l:'FY23',v:27},{l:'FY24',v:61},{l:'FY25',v:130},{l:'FY26',v:215}],
        src: 'NVIDIA Investor Relations', url: 'https://investor.nvidia.com/financial-info/annual-reports/',
      },
      fed: {
        title: isRu ? 'Ставка ФРС (federal funds rate), %' : 'Federal funds rate, %',
        type: 'line', color: '#fbbf24', unit: '%',
        pts: [{l:'2019',v:2.4},{l:'2020',v:0.1},{l:'2021',v:0.1},{l:'2022',v:4.3},{l:'2023',v:5.3},{l:'2024Q1',v:5.3},{l:'2024Q4',v:4.6},{l:'2025Q2',v:4.3},{l:'2025Q4',v:3.6},{l:'2026',v:3.6}],
        note: isRu ? '3 снижения в 2025-м → заморозка. Апрель 2026: голосование 8–4, риск повышения' : '3 cuts in 2025 → frozen. April 2026: 8–4 vote, hike risk emerging',
        src: 'CME FedWatch / FRED', url: 'https://fred.stlouisfed.org/series/FEDFUNDS',
      },
      ai_share: {
        title: isRu ? 'ИИ-сектор: вклад в рост S&P 500, %' : 'AI sector: contribution to S&P 500 return, %',
        type: 'bar', color: '#60a5fa', unit: '%',
        pts: [{l:'2022',v:12},{l:'2023',v:38},{l:'2024',v:65},{l:'2025',v:80}],
        src: 'Goldman Sachs US Equity Research', url: 'https://www.goldmansachs.com',
      },
    };
    const cfg = cfgs[key];
    if (!cfg) return null;
    const pts = cfg.pts;
    const vals = pts.map(p => p.v);
    const dataMin = cfg.type === 'line' ? Math.min(...vals) * 0.85 : 0;
    const dataMax = Math.max(...vals);
    const toX = (i) => PX + (i / (pts.length - 1)) * (W - PX * 2);
    const toY = (v) => PY + (H - PY * 2) * (1 - (v - dataMin) / ((dataMax - dataMin) || 1));
    const bSlot = (W - PX * 2) / pts.length;
    const bw = Math.max(8, bSlot - 5);
    return <>
      <p className="aib-chart-title">{cfg.title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="aib-chart">
        {[0.25,0.5,0.75,1].map(f => { const y = toY(dataMin + (dataMax - dataMin) * f); return <line key={f} x1={PX} y1={y} x2={W-PX} y2={y} stroke="rgba(200,210,255,.07)" strokeWidth="1" />; })}
        {cfg.type === 'bar' ? pts.map((p, i) => {
          const bx = PX + i * bSlot + (bSlot - bw) / 2;
          const bh = ((p.v - dataMin) / ((dataMax - dataMin) || 1)) * (H - PY * 2);
          const isLast = i === pts.length - 1;
          return <g key={i}>
            <rect x={bx} y={toY(p.v)} width={bw} height={bh} fill={isLast ? cfg.color : cfg.color + '55'} rx="3" />
            <text x={bx + bw/2} y={H-4} textAnchor="middle" fill="rgba(200,210,255,.35)" fontSize="9">{p.l}</text>
            {isLast && <text x={bx + bw/2} y={toY(p.v) - 5} textAnchor="middle" fill={cfg.color} fontSize="11" fontWeight="700">{cfg.prefix||''}{p.v}{cfg.unit}</text>}
          </g>;
        }) : (() => {
          const d = pts.map((p,i) => `${i===0?'M':'L'} ${toX(i).toFixed(1)} ${toY(p.v).toFixed(1)}`).join(' ');
          return <>{
            <path d={d} stroke={cfg.color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          }{pts.map((p,i) => <g key={i}>
            <circle cx={toX(i)} cy={toY(p.v)} r={i===pts.length-1?4:2.5} fill={cfg.color} />
            <text x={toX(i)} y={H-4} textAnchor="middle" fill="rgba(200,210,255,.35)" fontSize="9">{p.l}</text>
            {i===pts.length-1 && <text x={toX(i)-6} y={toY(p.v)-9} textAnchor="end" fill={cfg.color} fontSize="11" fontWeight="700">{p.v}{cfg.unit}</text>}
          </g>)}</>;
        })()}
      </svg>
      {cfg.note && <p className="aib-chart-note">{cfg.note}</p>}
      <a href={cfg.url} target="_blank" rel="noreferrer" className="aib-chart-src">↗ {isRu?'Источник':'Source'}: {cfg.src}</a>
    </>;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, bubbles = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    const mk = () => ({ x: Math.random() * canvas.width, y: canvas.height + 80, r: 22 + Math.random() * 85, vx: (Math.random() - .5) * .7, vy: -(0.18 + Math.random() * .55), h: 180 + Math.random() * 110, o: .18 + Math.random() * .32 });
    const draw = (b) => {
      const g = ctx.createRadialGradient(b.x - b.r * .3, b.y - b.r * .35, b.r * .04, b.x, b.y, b.r);
      g.addColorStop(0, `hsla(${b.h},72%,88%,${b.o * .8})`);
      g.addColorStop(.4, `hsla(${b.h + 45},65%,65%,${b.o * .1})`);
      g.addColorStop(1, `hsla(${b.h + 95},55%,55%,0)`);
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = `hsla(${b.h},65%,80%,${b.o * .28})`; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(b.x - b.r * .3, b.y - b.r * .33, b.r * .15, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${b.o * .55})`; ctx.fill();
    };
    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (Math.random() < .026 && bubbles.length < 20) bubbles.push(mk());
      bubbles = bubbles.filter(b => b.y + b.r > -160);
      bubbles.forEach(b => { b.x += b.vx; b.y += b.vy; b.vx += (Math.random() - .5) * .04; draw(b); });
      raf = requestAnimationFrame(frame);
    };
    resize();
    for (let i = 0; i < 12; i++) { const b = mk(); b.y = Math.random() * canvas.height; bubbles.push(b); }
    const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement);
    frame();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  // Re-run when language switches so the new DOM elements get observed
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('aib-in'); io.unobserve(e.target); } }), { threshold: .1 });
    document.querySelectorAll('.aib-fade').forEach(el => io.observe(el));
    const po = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.style.width = e.target.dataset.w + '%'; po.unobserve(e.target); } }), { threshold: .5 });
    document.querySelectorAll('.aib-fill').forEach(el => po.observe(el));
    return () => { io.disconnect(); po.disconnect(); };
  }, [isRu]);

  useEffect(() => {
    if (popup) { document.body.style.overflow = 'hidden'; }
    return () => { document.body.style.overflow = ''; };
  }, [popup]);

  const c = isRu ? {
    date: '29 июня 2026 · актуально',
    kicker: 'Исследование',
    title: 'Пузырь\nИИ?',
    lead: 'История знает эту картину. Вопрос в том, чем она закончится на этот раз.',
    pLabel: 'Мой предикт',
    pTitle: 'Постепенное сдувание — не взрыв',
    pText: 'Компании прибыльны — это главное отличие от 2000-го. За высокими оценками стоят реальные деньги. Но $650 млрд капзатрат без гарантии окупаемости создаёт давление, которое рынку придётся переварить.',
    scrollHint: 'Разобрать аргументы',
    scKicker: 'Какой исход возможен',
    scTitle: 'Три сценария',
    scenarios: [
      { id: 'crash', badge: 'Менее вероятен', title: 'Резкий взрыв', desc: 'Паника, обвал рынка на 70–80%, волна банкротств — как в 2000-м.', likelihood: 'Маловероятно', level: 1,
        pro: ['5 компаний = 30% S&P 500 — аномальная концентрация, как в 1999-м', '$650 млрд капзатрат без гарантии окупаемости', 'AI-washing: компании клеят ярлык «ИИ» ради оценки', 'ФРС заморозила ставку — 47% шанс повышения к 2027-му'],
        con: ['Лидеры прибыльны — в 2000-м рухнули стартапы без выручки', 'P/E ~30 vs 200 в пик доткомов', 'B2B-спрос: платят за результат, не за хайп'] },
      { id: 'deflate', badge: 'Мой предикт', feat: true, title: 'Постепенное сдувание', desc: 'Коррекция есть. Слабые выбывают. Сильные адаптируются — без системного краха.', likelihood: 'Наиболее вероятно', level: 3,
        pro: ['NVIDIA $215 млрд выручки — за ценой стоит реальный бизнес', 'P/E ~30 vs 200 в доткомах — дорого, но не безумие', 'B2B-модель: платят за конкретный результат', 'Слабые игроки уже выбывают без системного шока'],
        con: ['Если выручка не догонит капзатраты — замедление неизбежно', 'ФРС не смягчается — попутного ветра дешёвых денег нет'] },
      { id: 'grow', badge: 'Возможен', title: 'Пузыря нет', desc: 'Рост обоснован технологией и реальным спросом, коррекции минимальны.', likelihood: 'Возможно', level: 2,
        pro: ['14% рост мощностей ЦОД в год — реальный задокументированный спрос', 'NVIDIA $4.3 трлн подкреплена $215 млрд выручки', 'ИИ реально повышает производительность уже сейчас'],
        con: ['Капзатраты уже опережают монетизацию', 'ФРС не снижает ставку — стоимость капитала высокая'] },
    ],
    proLbl: 'За', conLbl: 'Против', weakLbl: 'Слабые места', showArgs: 'Аргументы', hideArgs: 'Скрыть',
    logicKicker: 'Критерии обвала',
    logicTitle: 'Три условия для резкого обвала',
    logicSub: 'Чтобы пузырь лопнул быстро — как в 2000-м — нужно совпадение трёх факторов. В 2026-м они не все на месте.',
    logicConds: [
      { num: '01', title: 'Цены оторваны от прибыли', desc: 'Акции стоят в разы больше, чем оправдывает реальная выручка компаний.', s2000: 'P/E NASDAQ ~200×', s2026: 'P/E ~30× — высоко, не безумие', ok2026: 'warn' },
      { num: '02', title: 'Лидеры живут в долг', desc: 'Компании-лидеры берут деньги в долг под рост — и не зарабатывают сами.', s2000: 'Большинство без прибыли', s2026: 'NVIDIA, Google, Microsoft — прибыльны', ok2026: 'no' },
      { num: '03', title: 'Деньги резко дорожают', desc: 'Центробанк повышает ставку — и поток дешёвых денег, надувавших пузырь, внезапно иссякает.', s2000: 'ФРС резко повышала ставку', s2026: '3 паузы подряд. Голосование 8–4 (впервые с 1992-го). Часть ФРС — за повышение', ok2026: 'warn' },
    ],
    logicConclusion: 'В 2000-м совпали все три — и рынок упал за недели. В 2026-м второй фактор отсутствует. Это не значит, что пузыря нет. Это значит, что взрыв менее вероятен, чем долгое остывание.',
    lbl2000: '2000', lbl2026: '2026', lblMet: 'Да', lblWarn: 'Частично', lblNo: 'Нет',
    evalKicker: 'Аргументы за переоценку',
    evalTitle: 'А пузырь-то есть?',
    evalSub: 'Три условия резкого обвала — не все сошлись. Но признаки перегрева видны. Вот что показывает, что рынок переоценен.',
    evalFeat: {
      tag: 'Ключевой кейс',
      title: 'OpenAI: $13 млрд выручки, $21 млрд убытков',
      body: 'Самая известная ИИ-компания мира с оценкой $300+ млрд тратит $1.60 на каждый заработанный доллар. В 2025-м операционный убыток — $20.9 млрд при выручке $13.1 млрд. В I квартале 2026-го операционная маржа — минус 122%. Прибыль по собственным прогнозам — не раньше 2029–2030 года.',
      quote: '«Ни один стартап в истории не работал с убытками такого масштаба» — Deutsche Bank',
      src: 'Fortune / Financial Times, июнь 2026',
      url: 'https://fortune.com/2026/06/16/openai-financials-leaked-losses-revenue-profit/',
    },
    evalArgs: [
      { icon: '📡', title: 'Capex опережает монетизацию', body: '$650 млрд инфраструктуры строится под спрос, который ещё не пришёл. Компании возводят дата-центры под будущий ИИ — как в 2000-м прокладывали оптику под будущий интернет-трафик. В 2000-м оптика оказалась дешевле ожидаемого: компании разорились, кабели легли тёмными.', src: 'Bloomberg Intelligence, 2026', url: 'https://www.bloomberg.com/news/articles/2026-01-27/big-tech-ai-spending-plans-unnerve-some-investors' },
      { icon: '📊', title: 'P/E выше исторической нормы на 40–50%', body: '~30× сейчас против исторической нормы NASDAQ в 20–22×. Не безумие доткомов, но и не нейтральная оценка. Любое замедление роста — и рынок вынужден переоценить акции вниз.', src: 'Macrotrends / Yardeni Research', url: 'https://www.macrotrends.net/stocks/charts/QQQ/invesco-qqq-trust/pe-ratio' },
      { icon: '🏷', title: 'AI-washing в промышленных масштабах', body: 'Сотни компаний получают оценочную премию за слово «ИИ» в пресс-релизе. Индексы «AI корзин» Goldman Sachs включают компании, у которых ИИ — маркетинговый слой поверх обычного ПО.', src: 'Goldman Sachs: «Gen AI: Too Much Spend, Too Little Benefit?», 2024', url: 'https://www.goldmansachs.com/insights/articles/gen-ai-too-much-spend-too-little-benefit.html' },
      { icon: '🏛', title: 'ФРС на паузе — и не факт, что смягчится', body: 'Три заседания подряд без изменения ставки. В апреле 2026-го голосование прошло 8–4 — впервые с 1992 года четверо членов проголосовали против большинства. Часть аналитиков сдвинула прогноз снижения ставки на 2027-й, риск повышения оценивается в 47%. Дорогие деньги — меньше топлива для дорогих оценок.', src: 'CME FedWatch / FRED', url: 'https://fred.stlouisfed.org/series/FEDFUNDS' },
      { icon: '💳', title: 'Capex всё больше держится на долге', body: 'Ещё в 2025-м Amazon, Microsoft, Alphabet и Meta закрывали capex операционным денежным потоком. В 2026-м это уже не так: по оценке Bank of America, крупнейшие игроки тратят на capex около 90% операционного денежного потока против 65% годом ранее, а заимствования, по прогнозу Morgan Stanley, превысят $400 млрд — вдвое больше, чем в 2025-м. Amazon прямо предупредила инвесторов о возможном привлечении долга и капитала. Чем больше бум держится на кредитном плече, а не на свободном кэше, тем он более уязвим к перепадам ставки и настроений на рынке.', src: 'Epoch AI: Hyperscaler Capex vs. Cash Flow', url: 'https://epoch.ai/data-insights/hyperscaler-capex-vs-cash-flow' },
    ],
    evalNote: 'Это не означает, что пузырь лопнет завтра. Но это означает: пространство для разочарования есть — и оно большое.',
    evalBullKicker: 'Контраргументы',
    evalBullTitle: 'Почему пузыря может и не быть',
    evalBullSub: 'Пессимистичный сценарий не единственный. Вот аргументы в пользу того, что нынешние оценки оправданы.',
    evalBullFeat: {
      tag: 'Контркейс',
      title: 'OpenAI: убытки огромные, рост — тоже',
      body: 'Да, OpenAI тратит $1.60 на каждый заработанный доллар. Но выручка выросла с $700 млн (2022) до $2.7 млрд (2023) до $13.1 млрд (2025) — почти 20× за три года. 300 млн еженедельных пользователей ChatGPT. Убытки — это инвестиции в масштаб, а не признак неработающей модели.',
      src: 'Fortune / Financial Times, июнь 2026',
      url: 'https://fortune.com/2026/06/16/openai-financials-leaked-losses-revenue-profit/',
    },
    evalBullArgs: [
      { icon: '📈', title: 'Производительность растёт', body: 'McKinsey и Goldman Sachs фиксируют 25–35% рост производительности у разработчиков, использующих ИИ. Если ИИ действительно повышает ВВП на 7% (прогноз Goldman), нынешние оценки выглядят консервативно.', src: 'McKinsey: Unleashing Developer Productivity with Generative AI', url: 'https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/unleashing-developer-productivity-with-generative-ai' },
      { icon: '🏦', title: 'Не все стартапы — OpenAI', body: 'Anthropic, Mistral и прочие — меньше. Большинство выручки ИИ-сектора генерируют прибыльные компании: Google, Microsoft, NVIDIA. Убытки OpenAI — исключение, а не норма.', src: 'CNBC: Google, Microsoft and Amazon cloud earnings, 2026', url: 'https://www.cnbc.com/2026/04/30/google-microsoft-and-amazon-all-report-cloud-beats-in-earnings.html' },
    ],
    metKicker: 'Данные',
    metTitle: 'Цифры, на которых строится анализ',
    metHint: 'Нажмите на любую карточку — увидите график с источником данных',
    metrics: [
      { label: 'Концентрация S&P 500', val: '30%', ctx: 'у 5 компаний — максимум за 50 лет', col: 'amber' },
      { label: 'P/E NASDAQ сейчас', val: '~30×', ctx: 'в пик доткомов было 200×. Дорого, не безумие', col: '' },
      { label: 'Capex на ИИ в 2026', val: '$650B', ctx: '+60% к 2025-му. Amazon, Google, Meta, Microsoft', col: 'red' },
      { label: 'Выручка NVIDIA', val: '$215B', ctx: 'Реальные продажи за реальные чипы', col: 'green' },
      { label: 'Ставка ФРС — риск повышения', val: '47%', ctx: '3 заседания подряд без изменений (3.5–3.75%). Апрель 2026: голосование 8–4 — впервые с 1992 года четверо членов против. Часть аналитиков сдвинула прогноз снижения на 2027-й', col: 'amber' },
      { label: 'ИИ → рост S&P 500', val: '80%', ctx: 'Доля сектора в общем росте рынка США, 2025', col: 'blue' },
    ],
    histKicker: 'Исторический контекст',
    histTitle: 'Сравнение с другими пузырями',
    histSub: 'Как ИИ-бум соотносится с прошлыми случаями перегрева рынка?',
    realTech: 'Реальная технология',
    simLabel: 'Похожесть на ситуацию с ИИ',
    hist: [
      { name: 'Тюльпаномания', year: '1637', peak: '×100', crash: '−99%', tech: false, sim: 10, lesson: 'Первый задокументированный пузырь. Чисто спекулятивный — никакой технологии за тюльпанами не стояло.' },
      { name: 'Железные дороги', year: '1840-е', peak: '×5', crash: '−60%', tech: true, sim: 80, lesson: 'Самая близкая аналогия: реальная технология + перестроили всю инфраструктуру под будущий спрос, потом оверкапасити. Технология выжила и изменила мир.' },
      { name: 'Доткомы', year: '1995–2000', peak: '×20', crash: '−78%', tech: true, sim: 65, lesson: 'Интернет оказался реальным. Большинство компаний — нет. Выжившие (Amazon, Google) стали крупнейшими в мире.' },
      { name: 'Криптовалюта', year: '2017–2018', peak: '×20', crash: '−84%', tech: false, sim: 30, lesson: 'Blockchain реален. Большинство монет — нет. Хайп без фундамента, обвал за год, без системных последствий.' },
    ],
    compKicker: 'Сравнение компаний эпохи',
    compTitle: 'NVIDIA vs Cisco',
    compSub: 'Cisco была хребтом интернет-инфраструктуры в 2000-м. NVIDIA — хребет ИИ-инфраструктуры сейчас. Что их разделяет — и что объединяет?',
    compRows: [
      { p: 'Роль', n: 'Чипы для ИИ-вычислений', cs: 'Маршрутизаторы для интернета' },
      { p: 'Капитализация на пике', n: '$3.3 трлн', cs: '$555 млрд (≈$960 млрд сегодня)' },
      { p: 'P/E на пике', n: '~40×', cs: '~200×', highlight: 'diff' },
      { p: 'Выручка', n: '$215 млрд', cs: '$18.9 млрд' },
      { p: 'Рост выручки (г/г)', n: '+114%', cs: '+55%' },
      { p: 'Прибыльность', n: 'Да, маржа ~55%', cs: 'Да, прибыльна' },
      { p: 'Падение от пика', n: '?', cs: '−86% за 2 года', highlight: 'warn' },
      { p: 'Восстановление', n: '?', cs: 'Не восстановилась до 2000-го уровня', highlight: 'warn' },
    ],
    compNote: 'Обе компании — «продавцы лопат» в золотую лихорадку своей эпохи. Только Cisco продавала надежду на будущие доходы, а NVIDIA продаёт то, за что уже платят живыми деньгами. P/E NVIDIA в 5× ниже пикового Cisco — но Cisco тоже была прибыльной и рухнула на 86%. Риск не в мошенничестве: он в том, что спрос на чипы может замедлиться так же, как замедлился спрос на маршрутизаторы.',
    riskKicker: 'Вывод',
    riskTitle: 'Риск не исчез — он сместился',
    riskText: 'С «внезапного перекрытия денег» на «разочарование: вложения не окупаются». Второй процесс — долгий. Слабые игроки тихо выбывают, сильные адаптируются. Именно это и называется сдуванием, а не взрывом.',
    cmpKicker: 'Детальный разбор',
    cmpTitle: 'Доткомы vs ИИ',
    cmpHeaders: ['Параметр', 'Доткомы 1999–2000', 'ИИ 2026', ''],
    cmpRows: [
      { p: 'Кто ведёт рынок', d: 'Убыточные стартапы', a: 'Прибыльные гиганты', same: false },
      { p: 'P/E рынка', d: '~200×', a: '~30×', same: false },
      { p: 'Бизнес-модель', d: 'B2C: трафик без монетизации', a: 'B2B: платят за результат', same: false },
      { p: 'Концентрация', d: 'Горстка компаний = весь рост', a: '5 компаний = 30% S&P 500', same: true },
      { p: 'Инфраструктура', d: 'Оптика без спроса', a: '$650 млрд на чипы и ЦОД', same: true },
      { p: 'Ставка ЦБ', d: 'Повышение → шок', a: 'Заморозка → неопределённость', same: true },
      { p: 'Ярлык эпохи', d: 'Добавляли «.com»', a: 'Добавляют «AI» / «.ai»', same: true },
    ],
    sameLbl: 'Сходство', diffLbl: 'Различие',
    disclaimer: 'Анализ основан на открытых источниках по состоянию на 29 июня 2026 года. Не является инвестиционной рекомендацией.',
  } : {
    date: 'June 29, 2026 · current',
    kicker: 'Research',
    title: 'AI\nBubble?',
    lead: 'History knows this picture. The question is how it ends this time.',
    pLabel: 'My prediction',
    pTitle: 'Gradual deflation — not a crash',
    pText: 'Companies are profitable — that\'s the key difference from 2000. Real money backs the prices. But $650B in capex without guaranteed returns creates pressure the market will have to work through.',
    scrollHint: 'Explore the arguments',
    scKicker: 'Possible outcomes',
    scTitle: 'Three scenarios',
    scenarios: [
      { id: 'crash', badge: 'Less likely', title: 'Sharp crash', desc: 'Panic, market drops 70–80%, wave of bankruptcies — like 2000.', likelihood: 'Unlikely', level: 1,
        pro: ['5 companies = 30% of S&P 500 — abnormal concentration, like 1999', '$650B capex with no guaranteed returns', 'AI-washing: companies slap "AI" on everything for investor valuation', 'Fed froze rate cuts — 47% chance of a hike by 2027'],
        con: ['Leaders are profitable — 2000 crashed because startups had no revenue', 'P/E ~30 vs 200 at dot-com peak', 'B2B demand: companies pay for real results'] },
      { id: 'deflate', badge: 'My prediction', feat: true, title: 'Gradual deflation', desc: 'Correction happens. Weak players exit. Strong ones adapt — without a systemic crash.', likelihood: 'Most likely', level: 3,
        pro: ['NVIDIA $215B revenue — real business behind the price', 'P/E ~30 vs 200 at dot-com peak — expensive, not insane', 'B2B model: pay for concrete results', 'Weak players already exiting without systemic shock'],
        con: ['If revenue doesn\'t catch up with capex — slowdown is inevitable', 'Fed isn\'t easing — no tailwind from cheap money'] },
      { id: 'grow', badge: 'Possible', title: 'No bubble', desc: 'Growth is justified by technology and real demand. Corrections minimal.', likelihood: 'Possible', level: 2,
        pro: ['14% YoY data center capacity growth — documented real demand', 'NVIDIA $4.3T cap backed by $215B revenue', 'AI is actually raising productivity right now'],
        con: ['Capex already outpacing monetization', 'Fed not cutting — cost of capital remains high'] },
    ],
    proLbl: 'For', conLbl: 'Against', weakLbl: 'Weak points', showArgs: 'Arguments', hideArgs: 'Hide',
    logicKicker: 'Crash criteria',
    logicTitle: 'Three conditions for a sharp crash',
    logicSub: 'For a bubble to burst fast — like 2000 — three factors must align. In 2026, they\'re not all present.',
    logicConds: [
      { num: '01', title: 'Prices detached from earnings', desc: 'Stocks trade at multiples far beyond what real revenue justifies.', s2000: 'NASDAQ P/E ~200×', s2026: 'P/E ~30× — expensive, not insane', ok2026: 'warn' },
      { num: '02', title: 'Leaders run on borrowed money', desc: 'Market-leading companies rely on debt and don\'t generate profits themselves.', s2000: 'Most were unprofitable', s2026: 'NVIDIA, Google, Microsoft — highly profitable', ok2026: 'no' },
      { num: '03', title: 'Money suddenly gets expensive', desc: 'The central bank hikes rates — and the cheap-money flow inflating the bubble abruptly dries up.', s2000: 'Fed aggressively hiked rates', s2026: '3 holds in a row. 8–4 vote (first since 1992). Some officials pushing to hike', ok2026: 'warn' },
    ],
    logicConclusion: 'In 2000, all three aligned — and the market fell in weeks. In 2026, condition #2 is absent. That doesn\'t mean there\'s no bubble. It means an explosion is less likely than a slow cool-down.',
    lbl2000: '2000', lbl2026: '2026', lblMet: 'Yes', lblWarn: 'Partial', lblNo: 'No',
    evalKicker: 'Arguments for overvaluation',
    evalTitle: 'Is there even a bubble?',
    evalSub: 'Not all three crash conditions have converged. But signs of overheating are visible. Here\'s the case that markets are overvalued.',
    evalFeat: {
      tag: 'Key case study',
      title: 'OpenAI: $13B revenue, $21B losses',
      body: 'The world\'s most recognized AI company — valued at $300B+ — spends $1.60 for every $1 it earns. In 2025: operating loss $20.9B on $13.1B revenue. Q1 2026: operating margin of −122%. Profitable only by 2029–2030 by its own projections.',
      quote: '"No startup in history has operated with losses on anything approaching this scale" — Deutsche Bank',
      src: 'Fortune / Financial Times, June 2026',
      url: 'https://fortune.com/2026/06/16/openai-financials-leaked-losses-revenue-profit/',
    },
    evalArgs: [
      { icon: '📡', title: 'Capex outpaces monetization', body: '$650B of infrastructure is being built for demand that hasn\'t arrived yet. Companies are erecting data centers for future AI — just as 2000s firms laid fiber for future internet traffic. The fiber turned out cheaper than expected: the companies went bankrupt, the cables went dark.', src: 'Bloomberg Intelligence, 2026', url: 'https://www.bloomberg.com/news/articles/2026-01-27/big-tech-ai-spending-plans-unnerve-some-investors' },
      { icon: '📊', title: 'P/E 40–50% above historical norm', body: '~30× now vs. a NASDAQ historical average of 20–22×. Not dot-com madness, but not neutral either. Any growth slowdown forces the market to re-price equities downward.', src: 'Macrotrends / Yardeni Research', url: 'https://www.macrotrends.net/stocks/charts/QQQ/invesco-qqq-trust/pe-ratio' },
      { icon: '🏷', title: 'AI-washing at industrial scale', body: 'Hundreds of companies collect a valuation premium for the word "AI" in a press release. Goldman Sachs "AI basket" indices include firms where AI is a marketing layer on top of ordinary software.', src: 'Goldman Sachs: "Gen AI: Too Much Spend, Too Little Benefit?", 2024', url: 'https://www.goldmansachs.com/insights/articles/gen-ai-too-much-spend-too-little-benefit.html' },
      { icon: '🏛', title: 'The Fed is paused — and may not ease', body: 'Three consecutive meetings with no rate change. In April 2026 the vote split 8–4 — the first time since 1992 that four members dissented. Some analysts have pushed rate-cut expectations to 2027; hike risk is estimated at 47%. Expensive money means less fuel for expensive valuations.', src: 'CME FedWatch / FRED', url: 'https://fred.stlouisfed.org/series/FEDFUNDS' },
      { icon: '💳', title: 'Capex is leaning more on debt', body: 'As recently as 2025, Amazon, Microsoft, Alphabet and Meta covered capex out of operating cash flow. That\'s no longer true in 2026: Bank of America estimates the biggest players are now spending about 90% of operating cash flow on capex, up from 65% a year earlier, and Morgan Stanley projects hyperscaler borrowing will top $400B — more than double 2025\'s $165B. Amazon has explicitly flagged to investors that it may raise debt and equity. The more the boom runs on leverage instead of free cash, the more exposed it is to swings in rates and sentiment.', src: 'Epoch AI: Hyperscaler Capex vs. Cash Flow', url: 'https://epoch.ai/data-insights/hyperscaler-capex-vs-cash-flow' },
    ],
    evalNote: 'This doesn\'t mean the bubble bursts tomorrow. It means the room for disappointment is large.',
    evalBullKicker: 'Counter-arguments',
    evalBullTitle: 'Why there may be no bubble',
    evalBullSub: 'The pessimistic scenario isn\'t the only one. Here\'s the case that current valuations are justified.',
    evalBullFeat: {
      tag: 'Counter-case',
      title: 'OpenAI: massive losses, massive growth too',
      body: 'Yes, OpenAI spends $1.60 for every dollar earned. But revenue grew from $700M (2022) to $2.7B (2023) to $13.1B (2025) — nearly 20× in three years. 300M weekly ChatGPT users. The losses are investment in scale, not proof that the model doesn\'t work.',
      src: 'Fortune / Financial Times, June 2026',
      url: 'https://fortune.com/2026/06/16/openai-financials-leaked-losses-revenue-profit/',
    },
    evalBullArgs: [
      { icon: '📈', title: 'Productivity gains are measurable', body: 'McKinsey and Goldman Sachs document 25–35% productivity gains among developers using AI. If AI genuinely raises GDP by 7% (Goldman\'s forecast), today\'s valuations look conservative.', src: 'McKinsey: Unleashing Developer Productivity with Generative AI', url: 'https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/unleashing-developer-productivity-with-generative-ai' },
      { icon: '🏦', title: 'Not every AI company is OpenAI', body: 'Most AI-sector revenue comes from profitable companies: Google, Microsoft, NVIDIA. OpenAI\'s losses are the exception, not the norm.', src: 'CNBC: Google, Microsoft and Amazon cloud earnings, 2026', url: 'https://www.cnbc.com/2026/04/30/google-microsoft-and-amazon-all-report-cloud-beats-in-earnings.html' },
    ],
    metKicker: 'Data',
    metTitle: 'Numbers behind the analysis',
    metHint: 'Click any card to see the chart and data source',
    metrics: [
      { label: 'S&P 500 concentration', val: '30%', ctx: 'held by 5 companies — highest in 50 years', col: 'amber' },
      { label: 'NASDAQ P/E now', val: '~30×', ctx: 'was 200× at dot-com peak. Expensive, not crazy', col: '' },
      { label: 'AI capex in 2026', val: '$650B', ctx: '+60% vs 2025. Amazon, Google, Meta, Microsoft', col: 'red' },
      { label: 'NVIDIA revenue', val: '$215B', ctx: 'Real sales for real chips', col: 'green' },
      { label: 'Fed rate — hike risk', val: '47%', ctx: '3 consecutive holds (3.5–3.75%). April 2026: 8–4 vote — first time since 1992 four members voted against. Some banks pushed cut forecasts to 2027', col: 'amber' },
      { label: 'AI share of S&P growth', val: '80%', ctx: 'Sector share of total US market gains, 2025', col: 'blue' },
    ],
    histKicker: 'Historical context',
    histTitle: 'Comparison with other bubbles',
    histSub: 'How does the AI boom compare to past market overheats?',
    realTech: 'Real technology',
    simLabel: 'Similarity to AI situation',
    hist: [
      { name: 'Tulip mania', year: '1637', peak: '×100', crash: '−99%', tech: false, sim: 10, lesson: 'First documented bubble. Pure speculation — no technology behind the tulips.' },
      { name: 'Railway boom', year: '1840s', peak: '×5', crash: '−60%', tech: true, sim: 80, lesson: 'Closest analogy: real technology + massive infrastructure overbuilding for future demand, then overcapacity. The technology survived and changed the world.' },
      { name: 'Dot-com', year: '1995–2000', peak: '×20', crash: '−78%', tech: true, sim: 65, lesson: 'The internet was real. Most companies were not. Survivors (Amazon, Google) became the largest in the world.' },
      { name: 'Crypto', year: '2017–2018', peak: '×20', crash: '−84%', tech: false, sim: 30, lesson: 'Blockchain is real. Most coins were not. Hype without fundamentals, crash in one year, no systemic consequences.' },
    ],
    compKicker: 'Company of the era',
    compTitle: 'NVIDIA vs Cisco',
    compSub: 'Cisco was the backbone of internet infrastructure in 2000. NVIDIA is the backbone of AI infrastructure now. What separates them — and what connects them?',
    compRows: [
      { p: 'Role', n: 'AI compute chips', cs: 'Internet routing hardware' },
      { p: 'Peak market cap', n: '$3.3T', cs: '$555B (≈$960B today)' },
      { p: 'P/E at peak', n: '~40×', cs: '~200×', highlight: 'diff' },
      { p: 'Revenue', n: '$215B', cs: '$18.9B' },
      { p: 'Revenue growth (YoY)', n: '+114%', cs: '+55%' },
      { p: 'Profitability', n: 'Yes, ~55% margin', cs: 'Yes, profitable' },
      { p: 'Post-peak drop', n: '?', cs: '−86% in 2 years', highlight: 'warn' },
      { p: 'Recovery', n: '?', cs: 'Never recovered to 2000 levels', highlight: 'warn' },
    ],
    compNote: 'Both were "shovel sellers" in their era\'s gold rush. Cisco sold hope for future earnings; NVIDIA sells what people are already paying for today. NVIDIA\'s P/E is 5× lower than Cisco\'s at peak — but Cisco was profitable too, and crashed 86%. The risk isn\'t fraud: it\'s that chip demand could slow the same way router demand did after 2000.',
    riskKicker: 'Conclusion',
    riskTitle: 'The risk hasn\'t gone — it shifted',
    riskText: 'From "sudden money cutoff" to "disappointment that investments don\'t pay off." The second is a slow process. Weak players quietly exit; strong ones adapt. That\'s what deflation looks like — not an explosion.',
    cmpKicker: 'Deep dive',
    cmpTitle: 'Dot-com vs AI',
    cmpHeaders: ['Parameter', 'Dot-com 1999–2000', 'AI 2026', ''],
    cmpRows: [
      { p: 'Who leads the market', d: 'Unprofitable startups', a: 'Profitable giants', same: false },
      { p: 'Market P/E', d: '~200×', a: '~30×', same: false },
      { p: 'Business model', d: 'B2C: traffic with no monetization', a: 'B2B: paying for results', same: false },
      { p: 'Concentration', d: 'A handful of companies = all growth', a: '5 companies = 30% S&P 500', same: true },
      { p: 'Infrastructure', d: 'Fiber optic with no demand', a: '$650B on chips and data centers', same: true },
      { p: 'Central bank rate', d: 'Hikes → shock', a: 'Pause → uncertainty', same: true },
      { p: 'Era label', d: 'Adding ".com"', a: 'Adding "AI" / ".ai"', same: true },
    ],
    sameLbl: 'Similar', diffLbl: 'Different',
    disclaimer: 'Analysis based on public data as of June 29, 2026. Not investment advice.',
  };

  const colMap = { amber: '#fbbf24', red: '#f87171', green: '#4ade80', blue: '#60a5fa', '': 'inherit' };
  const metKeys = ['concentration', 'pe', 'capex', 'nvidia', 'fed', 'ai_share'];
  const metTerms = ['sp500', 'pe', 'capex', null, 'fed', 'sp500'];
  c.metrics = c.metrics.map((m, i) => ({ ...m, statKey: metKeys[i], termKey: metTerms[i] }));
  const statTermMap = Object.fromEntries(metKeys.map((k, i) => [k, metTerms[i]]));

  return <section className="aib-page">
    <div className="aib-hero">
      <canvas ref={canvasRef} className="aib-canvas" />
      <div className="aib-hero-inner">
        <span className="aib-date-badge">{c.date}</span>
        <h1 className="aib-title">{c.title}</h1>
        <p className="aib-lead">{c.lead}</p>
        <div className="aib-predict">
          <p className="aib-predict-lbl">⬤ {c.pLabel}</p>
          <p className="aib-predict-title">{c.pTitle}</p>
          <p className="aib-predict-text">{c.pText}</p>
        </div>
      </div>
      <button className="aib-scroll-hint" onClick={() => scrollTo(logicRef)}>
        <span>{c.scrollHint}</span><span>↓</span>
      </button>
    </div>

    <div className="aib-section" ref={logicRef}>
      <p className="aib-kicker aib-fade">{c.logicKicker}</p>
      <h2 className="aib-sec-title aib-fade">{c.logicTitle}</h2>
      <p className="aib-sec-sub aib-fade">{c.logicSub}</p>
      <div className="aib-logic">
        {c.logicConds.map(cd => <div key={cd.num} className="aib-logic-card aib-fade">
          <div className="aib-logic-num">{cd.num}</div>
          <h3 className="aib-logic-title">{cd.title}</h3>
          <p className="aib-logic-desc">{cd.desc}</p>
          <div className="aib-logic-status">
            <div className="aib-logic-col aib-logic-met">
              <span className="aib-logic-year">{c.lbl2000}</span>
              <span className="aib-logic-badge aib-lbadge-yes">✓ {c.lblMet}</span>
              <span className="aib-logic-val">{cd.s2000}</span>
            </div>
            <div className={`aib-logic-col aib-logic-${cd.ok2026}`}>
              <span className="aib-logic-year">{c.lbl2026}</span>
              <span className={`aib-logic-badge aib-lbadge-${cd.ok2026}`}>{cd.ok2026 === 'no' ? `✗ ${c.lblNo}` : `⚠ ${c.lblWarn}`}</span>
              <span className="aib-logic-val">{cd.s2026}</span>
            </div>
          </div>
        </div>)}
      </div>
      <div className="aib-logic-conclusion aib-fade"><p>{c.logicConclusion}</p></div>
      <DownBtn to={evalRef} />
    </div>

    <div className="aib-section aib-section-sep" ref={evalRef}>
      <p className="aib-kicker aib-fade">{c.evalKicker}</p>
      <h2 className="aib-sec-title aib-fade">{c.evalTitle}</h2>
      <p className="aib-eval-sub aib-fade">{c.evalSub}</p>
      <div className="aib-eval-feat aib-fade">
        <span className="aib-eval-tag">{c.evalFeat.tag}</span>
        <h3 className="aib-eval-feat-title">{c.evalFeat.title}</h3>
        <p className="aib-eval-feat-body">{c.evalFeat.body}</p>
        <blockquote className="aib-eval-quote">{c.evalFeat.quote}</blockquote>
        <a className="aib-eval-src" href={c.evalFeat.url} target="_blank" rel="noreferrer">{c.evalFeat.src} ↗</a>
      </div>
      <div className="aib-eval-args">
        {c.evalArgs.map((a, i) => (
          <div key={i} className="aib-eval-arg aib-fade">
            <span className="aib-eval-arg-icon">{a.icon}</span>
            <div>
              <p className="aib-eval-arg-title">{a.title}</p>
              <p className="aib-eval-arg-body">{a.body}</p>
              {a.src && <a className="aib-eval-arg-src" href={a.url} target="_blank" rel="noreferrer">{a.src} ↗</a>}
            </div>
          </div>
        ))}
      </div>
      <p className="aib-eval-note aib-fade">{c.evalNote}</p>
      <DownBtn to={bullRef} />
    </div>

    <div className="aib-section aib-section-sep" ref={bullRef}>
      <div className="aib-eval-bull aib-fade">
        <p className="aib-eval-bull-kicker">{c.evalBullKicker}</p>
        <h3 className="aib-eval-bull-title">{c.evalBullTitle}</h3>
        <p className="aib-eval-bull-sub">{c.evalBullSub}</p>
        <div className="aib-eval-bull-feat">
          <span className="aib-eval-bull-tag">{c.evalBullFeat.tag}</span>
          <h4 className="aib-eval-bull-feat-title">{c.evalBullFeat.title}</h4>
          <p className="aib-eval-bull-feat-body">{c.evalBullFeat.body}</p>
          <a className="aib-eval-src" href={c.evalBullFeat.url} target="_blank" rel="noreferrer">{c.evalBullFeat.src} ↗</a>
        </div>
        <div className="aib-eval-args aib-eval-bull-args">
          {c.evalBullArgs.map((a, i) => (
            <div key={i} className="aib-eval-arg aib-eval-bull-arg">
              <span className="aib-eval-arg-icon">{a.icon}</span>
              <div>
                <p className="aib-eval-arg-title">{a.title}</p>
                <p className="aib-eval-arg-body">{a.body}</p>
                {a.src && <a className="aib-eval-arg-src" href={a.url} target="_blank" rel="noreferrer">{a.src} ↗</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <DownBtn to={scenRef} />
    </div>

    <div className="aib-section aib-section-sep" ref={scenRef}>
      <p className="aib-kicker aib-fade">{c.scKicker}</p>
      <h2 className="aib-sec-title aib-fade">{c.scTitle}</h2>
      <div className="aib-scenarios">
        {c.scenarios.map(sc => <div key={sc.id} className={`aib-sc${sc.feat ? ' aib-sc-feat' : ''} aib-fade`}>
          <span className={`aib-badge aib-badge-${sc.id}`}>{sc.badge}</span>
          <div className="aib-prob-row">
            <span>{isRu ? 'Вероятность' : 'Likelihood'}</span>
            <strong className={`aib-pval-${sc.id}`}>{sc.likelihood}</strong>
          </div>
          <div className="aib-level-row">
            {[1, 2, 3].map(n => <span key={n} className={`aib-level-dot${n <= sc.level ? ` on-${sc.id}` : ''}`} />)}
          </div>
          <h3 className="aib-sc-name">{sc.title}</h3>
          <p className="aib-sc-desc">{sc.desc}</p>
          <button className="aib-toggle" onClick={() => setOpenSc(openSc === sc.id ? null : sc.id)}>
            {openSc === sc.id ? c.hideArgs : c.showArgs} <span>{openSc === sc.id ? '↑' : '↓'}</span>
          </button>
          {openSc === sc.id && <div className="aib-args">
            <p className="aib-args-lbl">{c.proLbl}</p>
            {sc.pro.map((a, i) => <div key={i} className="aib-arg"><span>+</span><span>{a}</span></div>)}
            <p className="aib-args-lbl">{sc.id === 'deflate' ? c.weakLbl : c.conLbl}</p>
            {sc.con.map((a, i) => <div key={i} className="aib-arg aib-arg-con"><span>−</span><span>{a}</span></div>)}
          </div>}
        </div>)}
      </div>
      <DownBtn to={metRef} />
    </div>

    <div className="aib-section aib-section-sep" ref={metRef}>
      <p className="aib-kicker aib-fade">{c.metKicker}</p>
      <h2 className="aib-sec-title aib-fade">{c.metTitle}</h2>
      <p className="aib-met-hint aib-fade">{c.metHint}</p>
      <div className="aib-metrics">
        {c.metrics.map(m => <div key={m.label} className="aib-met aib-fade" onClick={() => setPopup({type:'stat',key:m.statKey})}>
          <p className={`aib-met-lbl${m.termKey ? ' aib-term' : ''}`}>
            {m.label}{m.termKey && <span className="aib-term-q">?</span>}
          </p>
          <p className="aib-met-val" style={{color: colMap[m.col]}}>{m.val}<span className="aib-stat-arrow">↗</span></p>
          <p className="aib-met-ctx">{m.ctx}</p>
        </div>)}
      </div>
      <DownBtn to={histRef} />
    </div>

    <div className="aib-section aib-section-sep" ref={histRef}>
      <p className="aib-kicker aib-fade">{c.histKicker}</p>
      <h2 className="aib-sec-title aib-fade">{c.histTitle}</h2>
      <p className="aib-sec-sub aib-fade">{c.histSub}</p>
      <div className="aib-hist">
        {c.hist.map(h => <div key={h.name} className="aib-hist-card aib-fade">
          <div className="aib-hist-head">
            <div><p className="aib-hist-name">{h.name}</p><p className="aib-hist-year">{h.year}</p></div>
            <span className={`aib-tech-badge ${h.tech ? 'yes' : 'no'}`}>{c.realTech}: {h.tech ? '✓' : '✗'}</span>
          </div>
          <div className="aib-hist-stats">
            <div><span>{isRu ? 'Пик' : 'Peak'}</span><strong>{h.peak}</strong></div>
            <div><span>{isRu ? 'Падение' : 'Crash'}</span><strong className="aib-crash-val">{h.crash}</strong></div>
          </div>
          <p className="aib-hist-lesson">{h.lesson}</p>
          <div className="aib-sim-head"><span>{c.simLabel}</span><span className="aib-sim-pct">{h.sim}%</span></div>
          <div className="aib-track"><div className="aib-fill aib-fill-deflate" data-w={h.sim} style={{width: 0}} /></div>
        </div>)}
      </div>
      <DownBtn to={cmpRef} />
    </div>

    <div className="aib-section aib-section-sep" ref={cmpRef}>
      <p className="aib-kicker aib-fade">{c.cmpKicker}</p>
      <h2 className="aib-sec-title aib-fade">{c.cmpTitle}</h2>
      <div className="aib-fade" style={{overflowX:'auto'}}>
        <table className="aib-table">
          <thead><tr>{c.cmpHeaders.map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{[...c.cmpRows].sort((a, b) => a.same - b.same).map(r => <tr key={r.p}>
            <td className="aib-td-param">{r.p}</td>
            <td className="aib-td-val">{r.d}</td>
            <td className="aib-td-val">{r.a}</td>
            <td><span className={r.same ? 'aib-same' : 'aib-diff'}>{r.same ? `▲ ${c.sameLbl}` : `▼ ${c.diffLbl}`}</span></td>
          </tr>)}</tbody>
        </table>
      </div>
      <DownBtn to={compRef} />
    </div>

    <div className="aib-section aib-section-sep" ref={compRef}>
      <p className="aib-kicker aib-fade">{c.compKicker}</p>
      <h2 className="aib-sec-title aib-fade">{c.compTitle}</h2>
      <p className="aib-sec-sub aib-fade">{c.compSub}</p>
      <div className="aib-comp aib-fade">
        <div className="aib-comp-head">
          <div className="aib-comp-col-head aib-comp-nvd">NVIDIA <span>2026</span></div>
          <div className="aib-comp-col-mid" />
          <div className="aib-comp-col-head aib-comp-csc">Cisco <span>2000</span></div>
        </div>
        {c.compRows.map(r => <div key={r.p} className={`aib-comp-row${r.highlight ? ` aib-comp-hl-${r.highlight}` : ''}`}>
          <div className="aib-comp-val aib-comp-left">{r.n}</div>
          <div className="aib-comp-param">{r.p}</div>
          <div className="aib-comp-val aib-comp-right">{r.cs}</div>
        </div>)}
        <p className="aib-comp-note">{c.compNote}</p>
      </div>
    </div>

    <div className="aib-section aib-section-sep">
      <div className="aib-risk aib-fade">
        <p className="aib-risk-kicker">{c.riskKicker}</p>
        <h2 className="aib-risk-title">{c.riskTitle}</h2>
        <p className="aib-risk-text">{c.riskText}</p>
      </div>
    </div>

    <div className="aib-footer"><p>{c.disclaimer}</p></div>

    {popup && createPortal(
      <div className="aib-overlay" onClick={() => setPopup(null)}>
        <div className="aib-modal" onClick={e => e.stopPropagation()}>
          <button className="aib-modal-close" onClick={() => setPopup(null)}>×</button>
          {popup.type === 'stat' && <>
            {termDefs[statTermMap[popup.key]] && <div className="aib-modal-term">
              <p className="aib-modal-term-name">{termDefs[statTermMap[popup.key]].name}</p>
              <p className="aib-modal-term-def">{termDefs[statTermMap[popup.key]].def}</p>
            </div>}
            {renderChart(popup.key)}
          </>}
        </div>
      </div>,
      document.body
    )}
  </section>;
}

function ProjectLanding({ t, data, slug, go }) {
  const project = data.projects.find((item) => item.slug === slug) || data.projects[0];
  if (project.slug === 'startup-fantasy') return <StartupFantasyLanding t={t} />;
  if (project.slug === 'empathy-ai') return <EmpathyAiLanding t={t} />;
  if (project.slug === 'marketplace-site') return <MarketplaceSiteLanding t={t} />;
  if (project.slug === 'ai-bubble') return <AiBubbleLanding t={t} />;
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
    } else if (tab === 'project:ai-bubble') {
      document.title = lang === 'ru' ? 'Пузырь ИИ 2026' : 'AI Bubble 2026';
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
