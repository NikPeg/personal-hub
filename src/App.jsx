import { useMemo, useState } from 'react';
import { ideas, posts, thoughts } from './content.js';
import { dictionary } from './i18n.js';
import './styles.css';

const tabs = ['home', 'posts', 'ideas', 'thoughts'];

function Header({ tab, setTab, lang, setLang, theme, setTheme, t }) {
  const nav = [
    ['home', t.navHome], ['posts', t.navPosts], ['ideas', t.navIdeas], ['thoughts', t.navThoughts], ['projects', t.navProjects]
  ];
  return <header className="site-header">
    <button className="brand ghost" onClick={() => setTab('home')} aria-label="NikPeg home"><span className="brand-mark">N</span><span className="brand-text">NikPeg</span></button>
    <nav className="nav" aria-label="Main navigation">
      {nav.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => id === 'projects' ? document.querySelector('#projects')?.scrollIntoView({ behavior: 'smooth' }) : setTab(id)}>{label}</button>)}
    </nav>
    <div className="controls"><button className="pill" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}>{lang === 'en' ? 'RU' : 'EN'}</button><button className="pill icon-pill" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☾' : '☀'}</button></div>
  </header>;
}

function Hero({ t, setTab }) {
  return <section className="hero section reveal visible">
    <div className="hero-copy">
      <p className="eyebrow">{t.eyebrow}</p>
      <h1>{t.heroTitle}</h1>
      <p className="lead">{t.heroLead}</p>
      <div className="hero-actions">
        <a className="btn primary" href="https://t.me/nikpeg" target="_blank" rel="noreferrer">Telegram</a>
        <button className="btn secondary" onClick={() => setTab('posts')}>{t.navPosts}</button>
      </div>
    </div>
    <aside className="hero-card" aria-label="Identity card">
      <div className="portrait-wrap"><img src="/assets/nikpeg-portrait.jpg" alt="Portrait of NikPeg" className="portrait" /></div>
      <div className="status-line"><span>{t.identityLabel}</span><strong>{t.identityValue}</strong></div>
      <div className="metric-grid"><div><b>∞</b><span>{t.metricCuriosity}</span></div><div><b>1</b><span>{t.metricMission}</span></div><div><b>many</b><span>{t.metricProjects}</span></div></div>
    </aside>
  </section>;
}

function Posts({ t, embedded = false }) {
  return <section className={`section reveal visible ${embedded ? '' : 'page-hero'}`}>
    <div className="section-heading"><p className="eyebrow">{t.postsEyebrow}</p><h2>{t.postsTitle}</h2><p className="lead">{t.postsLead}</p></div>
    <div className="post-feed">{posts.map(post => <article className="card post-card" key={post.id}><span className="tag">{t[post.status] ?? post.status} · {post.tag}</span><h3>{post.title}</h3><p>{post.text}</p></article>)}</div>
  </section>;
}

function Ideas({ t }) {
  const [sort, setSort] = useState('score');
  const sortedIdeas = useMemo(() => [...ideas].sort((a, b) => b[sort] - a[sort]), [sort]);
  return <section className="section page-hero reveal visible">
    <div className="section-heading"><p className="eyebrow">{t.ideasEyebrow}</p><h1>{t.ideasTitle}</h1><p className="lead">{t.ideasLead}</p></div>
    <div className="toolbar"><span>Sort by</span><button className={sort === 'score' ? 'active' : ''} onClick={() => setSort('score')}>{t.score}</button><button className={sort === 'upvotes' ? 'active' : ''} onClick={() => setSort('upvotes')}>{t.upvotes}</button></div>
    <div className="cards three">{sortedIdeas.map(idea => <article className="card project-card" key={idea.id}><span className="tag">{idea.tag}</span><h3>{idea.title}</h3><p>{idea.text}</p><div className="idea-meta"><span>{t.score}: <b>{idea.score}</b></span><span>{t.upvotes}: <b>{idea.upvotes}</b></span></div></article>)}</div>
  </section>;
}

function Thoughts({ t }) {
  return <section className="section page-hero reveal visible">
    <div className="section-heading"><p className="eyebrow">{t.thoughtsEyebrow}</p><h1>{t.thoughtsTitle}</h1><p className="lead">{t.thoughtsLead}</p></div>
    <div className="cards three">{thoughts.map(thought => <article className="card" key={thought.id}><span className="tag">{t.draft}</span><h3>{thought.title}</h3><p>{thought.text}</p></article>)}</div>
  </section>;
}

function Projects({ t }) {
  return <section className="section reveal visible" id="projects"><div className="section-heading"><p className="eyebrow">{t.projectsEyebrow}</p><h2>{t.projectsTitle}</h2></div><div className="cards three"><article className="card project-card"><span className="tag">AI · learning</span><h3>Edu</h3><p>{t.eduText}</p><a>{t.comingSoon}</a></article><article className="card project-card"><span className="tag">writing · feedback</span><h3>Scribo</h3><p>{t.scriboText}</p><a>{t.comingSoon}</a></article><article className="card project-card"><span className="tag">bots · slides</span><h3>Slidebot</h3><p>{t.slidebotText}</p><a>{t.comingSoon}</a></article></div></section>;
}

export default function App() {
  const [tab, setTab] = useState('home');
  const [theme, setThemeState] = useState(localStorage.getItem('theme') || 'dark');
  const [lang, setLangState] = useState(localStorage.getItem('lang') || 'en');
  const t = dictionary[lang];

  function setTheme(value) { setThemeState(value); localStorage.setItem('theme', value); document.documentElement.dataset.theme = value; }
  function setLang(value) { setLangState(value); localStorage.setItem('lang', value); document.documentElement.lang = value; document.title = value === 'en' ? 'Who is NikPeg?' : 'Кто такой NikPeg?'; }
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = lang;

  return <>
    <div className="aurora" aria-hidden="true"></div><div className="grain" aria-hidden="true"></div>
    <Header tab={tab} setTab={setTab} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />
    <main>
      {tab === 'home' && <><Hero t={t} setTab={setTab} /><Posts t={t} embedded /><Projects t={t} /><section className="section lab reveal visible"><div className="glass-panel"><p className="eyebrow">Soon</p><h2>{t.photosSoon}</h2></div></section></>}
      {tab === 'posts' && <Posts t={t} />}
      {tab === 'ideas' && <Ideas t={t} />}
      {tab === 'thoughts' && <Thoughts t={t} />}
    </main>
    <footer className="footer"><span>{t.footerText}</span><a href="https://github.com/NikPeg/personal-hub" target="_blank" rel="noreferrer">GitHub</a></footer>
  </>;
}
