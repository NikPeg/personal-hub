const root = document.documentElement;

const dictionary = {
  en: {
    navProjects: 'Projects', navChannels: 'Channels', navLab: 'Lab',
    eyebrow: 'Personal operating room · cozy lab · idea garden',
    heroTitle: 'A warm little hub for projects, thoughts, and useful experiments.',
    heroLead: 'NikPeg’s place on the internet: smart enough for work, soft enough for life, and ready to grow into pet-project landings.',
    seeProjects: 'See projects', findMe: 'Find me',
    statusLabel: 'Status', statusValue: 'prototype alive',
    metricThemes: 'themes', metricLangs: 'languages', metricIdeas: 'ideas',
    channelsEyebrow: 'Channels', channelsTitle: 'The fastest ways to reach NikPeg.',
    telegramText: 'Short updates, quick messages, occasional sparks.',
    vkText: 'Social profile and public traces of projects.',
    projectsEyebrow: 'Pet projects', projectsTitle: 'Landing pages can live here under one visual system.',
    eduText: 'A future landing for education tooling, payments, referrals, and experiments.',
    scriboText: 'A compact space for product story, feedback collection, and launch notes.',
    slidebotText: 'A landing for presentation automation and useful bot experiments.',
    comingSoon: 'Coming soon →',
    labEyebrow: 'Life dashboard', labTitle: 'A place for goals, resources, notes, and personal systems.',
    labText: 'Next iterations can connect the existing life dashboard, add project pages, and turn this into a personal command center.',
    footerText: 'Built as a first cozy-smart prototype.'
  },
  ru: {
    navProjects: 'Проекты', navChannels: 'Каналы', navLab: 'Лаборатория',
    eyebrow: 'Личная операционная · уютная лаборатория · сад идей',
    heroTitle: 'Тёплый хаб для проектов, мыслей и полезных экспериментов.',
    heroLead: 'Место NikPeg в интернете: достаточно умное для работы, достаточно мягкое для жизни и готовое вырасти в лендинги пет‑проектов.',
    seeProjects: 'Смотреть проекты', findMe: 'Найти меня',
    statusLabel: 'Статус', statusValue: 'прототип жив',
    metricThemes: 'темы', metricLangs: 'языка', metricIdeas: 'идей',
    channelsEyebrow: 'Каналы', channelsTitle: 'Самые быстрые способы найти NikPeg.',
    telegramText: 'Короткие апдейты, быстрые сообщения, иногда искры.',
    vkText: 'Социальный профиль и публичные следы проектов.',
    projectsEyebrow: 'Пет‑проекты', projectsTitle: 'Лендинги могут жить здесь в единой визуальной системе.',
    eduText: 'Будущий лендинг для образовательных инструментов, оплат, рефералок и экспериментов.',
    scriboText: 'Компактное место для истории продукта, сбора фидбэка и заметок о запуске.',
    slidebotText: 'Лендинг для автоматизации презентаций и полезных ботовых экспериментов.',
    comingSoon: 'Скоро →',
    labEyebrow: 'Жизненный дашборд', labTitle: 'Место для целей, ресурсов, заметок и личных систем.',
    labText: 'В следующих итерациях можно подключить существующий life dashboard, добавить страницы проектов и превратить сайт в личный командный центр.',
    footerText: 'Собрано как первый уютно‑умный прототип.'
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
  themeToggle.textContent = theme === 'dark' ? '☾' : '☀';
}

function applyLang(lang) {
  root.lang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (dictionary[lang][key]) node.textContent = dictionary[lang][key];
  });
  langToggle.textContent = lang === 'en' ? 'RU' : 'EN';
  document.title = lang === 'en' ? 'NikPeg — Personal Hub' : 'NikPeg — личный хаб';
}

applyTheme(savedTheme);
applyLang(savedLang);

themeToggle.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
langToggle.addEventListener('click', () => applyLang(root.lang === 'en' ? 'ru' : 'en'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
