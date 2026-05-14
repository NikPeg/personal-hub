import { useEffect, useMemo, useRef, useState } from 'react';
import { content } from './content.js';
import { dictionary } from './i18n.js';
import { loadThoughts } from './thoughtFiles.js';
import './styles.css';

const pathToTab = (pathname) => {
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '');
  if (!slug || slug === 'index.html') return 'home';
  if (['feed', 'channels', 'ideas', 'thoughts', 'projects', 'photos'].includes(slug)) return slug;
  if (['edu', 'scribo', 'slidebot'].includes(slug)) return `project:${slug}`;
  return 'home';
};

function Header({ tab, go, lang, setLang, theme, setTheme, t }) {
  const nav = [
    ['home', t.navHome], ['feed', t.navFeed], ['channels', t.navChannels], ['ideas', t.navIdeas], ['thoughts', t.navThoughts], ['projects', t.navProjects], ['photos', t.navPhotos]
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
  return <section className="hero section reveal visible">
    <div className="hero-copy">
      <p className="eyebrow">{t.eyebrow}</p>
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
  </section>;
}

function PageHeading({ eyebrow, title, lead }) {
  return <div className="section-heading page-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{lead && <p className="lead">{lead}</p>}</div>;
}

function ImageCarousel({ images = [], title }) {
  const [index, setIndex] = useState(0);
  if (!images.length) return null;
  const image = images[index];
  return <div className="carousel">
    <img src={image.src} alt={image.alt || title} />
    {images.length > 1 && <div className="carousel-controls"><button onClick={() => setIndex((index - 1 + images.length) % images.length)}>←</button><span>{index + 1}/{images.length}</span><button onClick={() => setIndex((index + 1) % images.length)}>→</button></div>}
  </div>;
}

function OpenCard({ item, children, onOpen, className = 'card' }) {
  return <button className={`${className} open-card`} onClick={() => onOpen(item)}>{children}</button>;
}

function DetailModal({ item, onClose, t }) {
  const [copied, setCopied] = useState(false);
  if (!item) return null;
  const copyText = [item.title, item.date, item.fullText || item.text || item.description].filter(Boolean).join('\n\n');
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
    <article className="modal-card" role="dialog" aria-modal="true" aria-label={item.title} onClick={(event) => event.stopPropagation()}>
      <div className="modal-tools"><button className="copy-button" onClick={copyToClipboard} aria-label={t.copy}>{copied ? '✓' : '⧉'}</button><button className="modal-close" onClick={onClose} aria-label={t.close}>×</button></div>
      <div className="modal-meta"><span className="tag">{item.tag || item.type || t.note}</span>{item.date && <time>{item.date}</time>}</div>
      <h2>{item.title}</h2>
      <ImageCarousel images={item.images} title={item.title} />
      <p>{item.fullText || item.text || item.description}</p>
    </article>
  </div>;
}



function Feed({ t, data, embedded = false, onOpen }) {
  return <section className={`section reveal visible ${embedded ? '' : 'page-hero'}`}>
    <div className="section-heading feed-heading"><p className="eyebrow">{t.feedEyebrow}</p>{!embedded && <><h2>{t.feedTitle}</h2><p className="lead">{t.feedLead}</p></>}</div>
    <div className="post-feed">{data.posts.map(post => <OpenCard className="card post-card" item={post} key={post.id} onOpen={onOpen}><span className="tag">{t[post.status] ?? post.status} · {post.tag}</span><h3>{post.title}</h3><p>{post.text}</p>{post.images?.length > 0 && <span className="media-count">{post.images.length} {t.images}</span>}</OpenCard>)}</div>
  </section>;
}

function Ideas({ t, data, onOpen }) {
  const [sort, setSort] = useState('created');
  const sortedIdeas = useMemo(() => [...data.ideas].sort((a, b) => b[sort] - a[sort]), [data.ideas, sort]);
  return <section className="section page-hero reveal visible">
    <PageHeading eyebrow={t.ideasEyebrow} title={t.ideasTitle} lead={t.ideasLead} />
    <div className="toolbar"><span>{t.sortBy}</span><button className={sort === 'created' ? 'active' : ''} onClick={() => setSort('created')}>{t.recent}</button><button className={sort === 'upvotes' ? 'active' : ''} onClick={() => setSort('upvotes')}>{t.upvotes}</button></div>
    <div className="cards three">{sortedIdeas.map(idea => <OpenCard className="card project-card" item={idea} key={idea.id} onOpen={onOpen}><span className="tag">{idea.tag}</span><h3>{idea.title}</h3><p>{idea.text}</p></OpenCard>)}</div>
  </section>;
}

function Thoughts({ t, lang, onOpen }) {
  const pageSize = 35;
  const [tag, setTag] = useState('all');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setTag('all');
    setVisibleCount(pageSize);
    loadThoughts(lang).then((items) => { if (active) { setThoughts(items); setLoading(false); } }).catch(() => { if (active) { setThoughts([]); setLoading(false); } });
    return () => { active = false; };
  }, [lang]);
  const tags = useMemo(() => Array.from(new Set(thoughts.flatMap((thought) => thought.tags || []))).sort(), [thoughts]);
  const filteredThoughts = tag === 'all' ? thoughts : thoughts.filter((thought) => thought.tags?.includes(tag));
  const visibleThoughts = filteredThoughts.slice(0, visibleCount);
  useEffect(() => {
    if (loading || visibleCount >= filteredThoughts.length) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisibleCount((count) => Math.min(count + pageSize, filteredThoughts.length));
    }, { rootMargin: '320px 0px' });
    const node = sentinelRef.current;
    if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [loading, visibleCount, filteredThoughts.length]);
  return <section className="section page-hero reveal visible">
    <PageHeading eyebrow={t.thoughtsEyebrow} title={t.thoughtsTitle} lead={t.thoughtsLead} />
    {loading ? <div className="glass-panel loading-panel">{t.loading}</div> : <>
      <div className="toolbar tag-toolbar"><span>{t.filterByTag}</span><button className={tag === 'all' ? 'active' : ''} onClick={() => { setTag('all'); setVisibleCount(pageSize); }}>{t.allTags}</button>{tags.map((item) => <button key={item} className={tag === item ? 'active' : ''} onClick={() => { setTag(item); setVisibleCount(pageSize); }}>{item}</button>)}</div>
      <div className="thought-list">{visibleThoughts.map(thought => <OpenCard className="card thought-row" item={thought} key={thought.id} onOpen={onOpen}><div className="thought-row-top"><span className="tag">{thought.tags?.join(' · ') || t.draft}</span>{thought.date && <time className="thought-date">{thought.date}</time>}</div><h3>{thought.title}</h3><p>{thought.text}</p></OpenCard>)}</div>
      <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />
    </>}
  </section>;
}

function Channels({ t, data }) {
  return <section className="section page-hero reveal visible">
    <PageHeading eyebrow={t.channelsEyebrow} title={t.channelsTitle} lead={t.channelsLead} />
    <div className="cards channel-grid">{data.channels.map(channel => <a className="card channel-card" key={channel.id} href={channel.url} target="_blank" rel="noreferrer"><span className="tag">{channel.type}</span><h3>{channel.title}</h3><p>{channel.description}</p><strong>{t.open}</strong></a>)}</div>
  </section>;
}

function Projects({ t, data, go }) {
  return <section className="section page-hero reveal visible" id="projects">
    <PageHeading eyebrow={t.projectsEyebrow} title={t.projectsTitle} lead={t.projectsLead} />
    <div className="cards three">{data.projects.map(project => <button className="card project-card open-card" key={project.id} onClick={() => go(`project:${project.slug}`)}><span className="tag">{project.tag}</span><h3>{project.title}</h3><p>{project.text}</p><strong>{t.openLanding}</strong></button>)}</div>
  </section>;
}

function ProjectLanding({ t, data, slug, go }) {
  const project = data.projects.find((item) => item.slug === slug) || data.projects[0];
  return <section className="section page-hero reveal visible landing-page">
    <p className="eyebrow">{project.tag}</p>
    <h2>{project.title}</h2>
    <p className="lead">{project.landingLead}</p>
    <div className="glass-panel landing-panel"><p>{project.landingText}</p><div className="hero-actions"><button className="btn primary" onClick={() => go('projects')}>{t.backToProjects}</button><a className="btn secondary" href="https://t.me/nikpeg" target="_blank" rel="noreferrer">Telegram</a></div></div>
  </section>;
}

function Photos({ t }) {
  return <section className="section page-hero reveal visible">
    <PageHeading eyebrow={t.photosEyebrow} title={t.photosTitle} lead={t.photosLead} />
    <div className="glass-panel empty-room"><span>◌</span></div>
  </section>;
}

export default function App() {
  const [tab, setTab] = useState(() => pathToTab(window.location.pathname));
  const [selected, setSelected] = useState(null);
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') === 'light' ? 'light' : 'dark');
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') === 'ru' ? 'ru' : 'en');
  const t = dictionary[lang] || dictionary.en;
  const data = content[lang] || content.en;

  function go(nextTab) {
    setTab(nextTab);
    setSelected(null);
    const path = nextTab.startsWith('project:') ? `/${nextTab.split(':')[1]}` : nextTab === 'home' ? '/' : `/${nextTab}`;
    window.history.pushState({}, '', path);
  }
  function setTheme(value) { setThemeState(value); localStorage.setItem('theme', value); document.documentElement.dataset.theme = value; }
  function setLang(value) { setLangState(value); localStorage.setItem('lang', value); document.documentElement.lang = value; document.title = value === 'en' ? 'Who is NikPeg?' : 'Кто такой НикПег?'; }
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = lang;

  return <>
    <div className="aurora" aria-hidden="true"></div><div className="grain" aria-hidden="true"></div>
    <Header tab={tab} go={go} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />
    <main>
      {tab === 'home' && <><Hero t={t} lang={lang} /><Feed t={t} data={data} embedded onOpen={setSelected} /></>}
      {tab === 'feed' && <Feed t={t} data={data} onOpen={setSelected} />}
      {tab === 'channels' && <Channels t={t} data={data} />}
      {tab === 'ideas' && <Ideas t={t} data={data} onOpen={setSelected} />}
      {tab === 'thoughts' && <Thoughts t={t} lang={lang} onOpen={setSelected} />}
      {tab === 'projects' && <Projects t={t} data={data} go={go} />}
      {tab === 'photos' && <Photos t={t} />}
      {tab.startsWith('project:') && <ProjectLanding t={t} data={data} slug={tab.split(':')[1]} go={go} />}
    </main>
    <DetailModal item={selected} onClose={() => setSelected(null)} t={t} />
    <footer className="footer"><span>{t.footerText}</span><a href="https://github.com/NikPeg/personal-hub" target="_blank" rel="noreferrer">GitHub</a></footer>
  </>;
}
