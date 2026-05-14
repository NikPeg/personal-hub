const root = document.documentElement;

const dictionary = {
  en: {
    navHome: 'Who', navThoughts: 'Thoughts', navIdeas: 'Ideas', navProjects: 'Projects',
    eyebrow: 'personal page · projects · living notes',
    heroTitle: 'Who is NikPeg?',
    heroLead: 'A curious builder, systems thinker, and practical romantic: trying to do important work beautifully, understand the world, and turn ideas into useful things.',
    identityLabel: 'Identity', identityValue: 'effective gentleman',
    metricCuriosity: 'curiosity', metricMission: 'mission', metricProjects: 'projects',
    aboutEyebrow: 'About', aboutTitle: 'A person assembled from ambition, warmth, experiments, and unfinished tabs.',
    missionTitle: 'Mission', missionText: 'To be an effective gentleman: doing personally important things with quality, dignity, independence, fairness, and love for people.',
    methodTitle: 'Method', methodText: 'Think clearly, build small systems, notice trends, ship prototypes, and keep enough playfulness to stay alive inside the process.',
    projectsEyebrow: 'Projects', projectsTitle: 'Pet projects and experiments will get their own landings here.',
    eduText: 'Education tools, payments, referrals, and useful automation for learning.',
    scriboText: 'A place for product story, feedback loops, and writing systems.',
    slidebotText: 'Presentation automation and bot experiments with practical value.',
    comingSoon: 'Coming soon →',
    moreEyebrow: 'More rooms', moreTitle: 'Thoughts and ideas live next door.',
    moreText: 'This site can grow into a cozy archive: essays, notes, experiments, project pages, and a public map of what NikPeg is becoming.',
    openThoughts: 'Open thoughts', openIdeas: 'Open ideas',
    thoughtsEyebrow: 'Thoughts', thoughtsTitle: 'Notes from a living mind.', thoughtsLead: 'Short observations, essays, principles, and things worth returning to. For now: beautiful placeholders; later: real text.',
    draftTag: 'draft', thoughtOneTitle: 'How to do important work', thoughtOneText: 'A note about quality, dignity, and choosing tasks that actually matter.',
    thoughtTwoTitle: 'Trends are tools', thoughtTwoText: 'Understanding the world is useful only when it changes what you build or how you act.',
    thoughtThreeTitle: 'A gentle personal system', thoughtThreeText: 'The best productivity system should feel like a good room: clear, warm, and hard to avoid.',
    ideasEyebrow: 'Ideas', ideasTitle: 'Seeds for future useful things.', ideasLead: 'A garden of project starts: some practical, some weird, some waiting for the right weekend and enough tea.',
    ideaOneTitle: 'Personal command center', ideaOneText: 'A private system that turns goals, tasks, notes, and dashboards into one calm interface.',
    ideaTwoTitle: 'Better tiny communities', ideaTwoText: 'Tools for small groups where people actually know each other and do things together.',
    ideaThreeTitle: 'Bots that sell gently', ideaThreeText: 'Automation for creators and channels that helps monetize without becoming gross.',
    footerText: 'Personal page prototype for NikPeg.'
  },
  ru: {
    navHome: 'Кто', navThoughts: 'Мысли', navIdeas: 'Идеи', navProjects: 'Проекты',
    eyebrow: 'личная страница · проекты · живые заметки',
    heroTitle: 'Кто такой NikPeg?',
    heroLead: 'Любопытный создатель, системный мыслитель и практичный романтик: старается красиво делать важное, понимать мир и превращать идеи в полезные штуки.',
    identityLabel: 'Идентичность', identityValue: 'эффективный джентльмен',
    metricCuriosity: 'любопытства', metricMission: 'миссия', metricProjects: 'проектов',
    aboutEyebrow: 'О себе', aboutTitle: 'Человек, собранный из амбиций, тепла, экспериментов и незакрытых вкладок.',
    missionTitle: 'Миссия', missionText: 'Быть эффективным джентльменом: качественно делать важные для себя задачи — с достоинством, независимостью, справедливостью и любовью к людям.',
    methodTitle: 'Метод', methodText: 'Ясно думать, строить маленькие системы, замечать тренды, выпускать прототипы и оставлять достаточно игры, чтобы не высохнуть внутри процесса.',
    projectsEyebrow: 'Проекты', projectsTitle: 'Пет‑проекты и эксперименты получат здесь отдельные лендинги.',
    eduText: 'Образовательные инструменты, оплаты, рефералки и полезная автоматизация обучения.',
    scriboText: 'Место для истории продукта, фидбэк‑лупов и письменных систем.',
    slidebotText: 'Автоматизация презентаций и ботовые эксперименты с практической пользой.',
    comingSoon: 'Скоро →',
    moreEyebrow: 'Ещё комнаты', moreTitle: 'Мысли и идеи живут по соседству.',
    moreText: 'Сайт может вырасти в уютный архив: эссе, заметки, эксперименты, страницы проектов и публичную карту того, кем становится NikPeg.',
    openThoughts: 'Открыть мысли', openIdeas: 'Открыть идеи',
    thoughtsEyebrow: 'Мысли', thoughtsTitle: 'Заметки живого ума.', thoughtsLead: 'Короткие наблюдения, эссе, принципы и вещи, к которым стоит возвращаться. Пока — красивые заготовки; позже — настоящий текст.',
    draftTag: 'черновик', thoughtOneTitle: 'Как делать важную работу', thoughtOneText: 'Заметка о качестве, достоинстве и выборе задач, которые правда имеют значение.',
    thoughtTwoTitle: 'Тренды — это инструменты', thoughtTwoText: 'Понимание мира полезно только тогда, когда меняет то, что ты строишь, или то, как действуешь.',
    thoughtThreeTitle: 'Мягкая личная система', thoughtThreeText: 'Лучшая система продуктивности должна ощущаться как хорошая комната: ясно, тепло и сложно игнорировать.',
    ideasEyebrow: 'Идеи', ideasTitle: 'Семена будущих полезных вещей.', ideasLead: 'Сад проектных зародышей: часть практичные, часть странные, часть ждут правильных выходных и достаточного количества чая.',
    ideaOneTitle: 'Личный командный центр', ideaOneText: 'Приватная система, которая собирает цели, задачи, заметки и дашборды в один спокойный интерфейс.',
    ideaTwoTitle: 'Лучшие маленькие комьюнити', ideaTwoText: 'Инструменты для небольших групп, где люди правда знают друг друга и что-то делают вместе.',
    ideaThreeTitle: 'Боты, которые продают мягко', ideaThreeText: 'Автоматизация для авторов и каналов, которая помогает монетизироваться без кринжа.',
    footerText: 'Прототип личной страницы NikPeg.'
  }
};

const savedTheme = localStorage.getItem('theme') || 'dark';
const savedLang = localStorage.getItem('lang') || 'en';
root.dataset.theme = savedTheme;
root.lang = savedLang;

const themeToggle = document.querySelector('#themeToggle');
const langToggle = document.querySelector('#langToggle');

function applyTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem('theme', theme);
  if (themeToggle) themeToggle.textContent = theme === 'dark' ? '☾' : '☀';
}

function applyLang(lang) {
  root.lang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (dictionary[lang][key]) node.textContent = dictionary[lang][key];
  });
  if (langToggle) langToggle.textContent = lang === 'en' ? 'RU' : 'EN';
  const page = location.pathname.split('/').pop();
  if (page === 'thoughts.html') document.title = lang === 'en' ? 'NikPeg — Thoughts' : 'NikPeg — мысли';
  else if (page === 'ideas.html') document.title = lang === 'en' ? 'NikPeg — Ideas' : 'NikPeg — идеи';
  else document.title = lang === 'en' ? 'Who is NikPeg?' : 'Кто такой NikPeg?';
}

applyTheme(savedTheme);
applyLang(savedLang);

themeToggle?.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
langToggle?.addEventListener('click', () => applyLang(root.lang === 'en' ? 'ru' : 'en'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
