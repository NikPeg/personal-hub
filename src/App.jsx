import { useMemo, useState } from 'react';
import { content } from './content.js';
import { dictionary } from './i18n.js';
import './styles.css';

function Header({ tab, setTab, lang, setLang, theme, setTheme, t }) {
  const nav = [
    ['home', t.navHome], ['feed', t.navFeed], ['channels', t.navChannels], ['ideas', t.navIdeas], ['thoughts', t.navThoughts], ['projects', t.navProjects], ['photos', t.navPhotos]
  ];
  return <header className="site-header">
    <button className="brand ghost" onClick={() => setTab('home')} aria-label="NikPeg home"><span className="brand-mark">N</span><span className="brand-text">NikPeg</span></button>
    <nav className="nav" aria-label="Main navigation">
      {nav.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
    </nav>
    <div className="controls"><button className="pill" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}>{lang === 'en' ? 'RU' : 'EN'}</button><button className="pill icon-pill" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☾' : '☀'}</button></div>
  </header>;
}

function Hero({ t }) {
  return <section className="hero section reveal visible">
    <div className="hero-copy">
      <p className="eyebrow">{t.eyebrow}</p>
      <h1>{t.heroTitle}</h1>
      <p className="lead">{t.heroLead}</p>
      <div className="hero-actions">
        <a className="btn primary" href="https://t.me/nikpeg" target="_blank" rel="noreferrer">Telegram</a>
        <a className="btn secondary" href="https://nikpeg.github.io/docs/CV.pdf" target="_blank" rel="noreferrer">{t.cv}</a>
      </div>
    </div>
    <aside className="hero-card" aria-label="Identity card">
      <div className="portrait-wrap"><img src="/assets/nikpeg-portrait.jpg" alt="Portrait of NikPeg" className="portrait" /></div>
      <div className="status-line"><span>{t.identityLabel}</span><strong>{t.identityValue}</strong></div>
      <div className="metric-grid system-metrics"><div><b>94</b><span>{t.metricRepos}</span></div><div><b>6</b><span>{t.metricChannels}</span></div><div><b>∞</b><span>{t.metricIdeas}</span></div></div>
    </aside>
  </section>;
}

function PageHeading({ eyebrow, title, lead }) {
  return <div className="section-heading page-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{lead && <p className="lead">{lead}</p>}</div>;
}

function Feed({ t, data, embedded = false }) {
  return <section className={`section reveal visible ${embedded ? '' : 'page-hero'}`}>
    <div className="section-heading feed-heading"><p className="eyebrow">{t.feedEyebrow}</p>{!embedded && <><h2>{t.feedTitle}</h2><p className="lead">{t.feedLead}</p></>}</div>
    <div className="post-feed">{data.posts.map(post => <article className="card post-card" key={post.id}><span className="tag">{t[post.status] ?? post.status} · {post.tag}</span><h3>{post.title}</h3><p>{post.text}</p></article>)}</div>
  </section>;
}

function Ideas({ t, data }) {
  const [sort, setSort] = useState('created');
  const sortedIdeas = useMemo(() => [...data.ideas].sort((a, b) => b[sort] - a[sort]), [data.ideas, sort]);
  return <section className="section page-hero reveal visible">
    <PageHeading eyebrow={t.ideasEyebrow} title={t.ideasTitle} lead={t.ideasLead} />
    <div className="toolbar"><span>{t.sortBy}</span><button className={sort === 'created' ? 'active' : ''} onClick={() => setSort('created')}>{t.recent}</button><button className={sort === 'upvotes' ? 'active' : ''} onClick={() => setSort('upvotes')}>{t.upvotes}</button></div>
    <div className="cards three">{sortedIdeas.map(idea => <article className="card project-card" key={idea.id}><span className="tag">{idea.tag}</span><h3>{idea.title}</h3><p>{idea.text}</p></article>)}</div>
  </section>;
}

function Thoughts({ t, data }) {
  return <section className="section page-hero reveal visible">
    <PageHeading eyebrow={t.thoughtsEyebrow} title={t.thoughtsTitle} lead={t.thoughtsLead} />
    <div className="cards three">{data.thoughts.map(thought => <article className="card" key={thought.id}><span className="tag">{t.draft}</span><h3>{thought.title}</h3><p>{thought.text}</p></article>)}</div>
  </section>;
}

function Channels({ t, data }) {
  return <section className="section page-hero reveal visible">
    <PageHeading eyebrow={t.channelsEyebrow} title={t.channelsTitle} lead={t.channelsLead} />
    <div className="cards channel-grid">{data.channels.map(channel => <a className="card channel-card" key={channel.id} href={channel.url} target="_blank" rel="noreferrer"><span className="tag">{channel.type}</span><h3>{channel.title}</h3><p>{channel.description}</p><strong>{t.open}</strong></a>)}</div>
  </section>;
}

function Projects({ t }) {
  return <section className="section page-hero reveal visible" id="projects">
    <PageHeading eyebrow={t.projectsEyebrow} title={t.projectsTitle} lead={t.projectsLead} />
    <div className="cards three"><article className="card project-card"><span className="tag">AI · learning</span><h3>Edu</h3><p>{t.eduText}</p><a>{t.comingSoon}</a></article><article className="card project-card"><span className="tag">writing · feedback</span><h3>Scribo</h3><p>{t.scriboText}</p><a>{t.comingSoon}</a></article><article className="card project-card"><span className="tag">bots · slides</span><h3>Slidebot</h3><p>{t.slidebotText}</p><a>{t.comingSoon}</a></article></div>
  </section>;
}

function Photos({ t }) {
  return <section className="section page-hero reveal visible">
    <PageHeading eyebrow={t.photosEyebrow} title={t.photosTitle} lead={t.photosLead} />
    <div className="glass-panel empty-room"><span>◌</span></div>
  </section>;
}

export default function App() {
  const [tab, setTab] = useState('home');
  const [theme, setThemeState] = useState(localStorage.getItem('theme') || 'dark');
  const [lang, setLangState] = useState(localStorage.getItem('lang') || 'en');
  const t = dictionary[lang];
  const data = content[lang];

  function setTheme(value) { setThemeState(value); localStorage.setItem('theme', value); document.documentElement.dataset.theme = value; }
  function setLang(value) { setLangState(value); localStorage.setItem('lang', value); document.documentElement.lang = value; document.title = value === 'en' ? 'Who is NikPeg?' : 'Кто такой NikPeg?'; }
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = lang;

  return <>
    <div className="aurora" aria-hidden="true"></div><div className="grain" aria-hidden="true"></div>
    <Header tab={tab} setTab={setTab} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />
    <main>
      {tab === 'home' && <><Hero t={t} /><Feed t={t} data={data} embedded /><Projects t={t} /></>}
      {tab === 'feed' && <Feed t={t} data={data} />}
      {tab === 'channels' && <Channels t={t} data={data} />}
      {tab === 'ideas' && <Ideas t={t} data={data} />}
      {tab === 'thoughts' && <Thoughts t={t} data={data} />}
      {tab === 'projects' && <Projects t={t} />}
      {tab === 'photos' && <Photos t={t} />}
    </main>
    <footer className="footer"><span>{t.footerText}</span><a href="https://github.com/NikPeg/personal-hub" target="_blank" rel="noreferrer">GitHub</a></footer>
  </>;
}
