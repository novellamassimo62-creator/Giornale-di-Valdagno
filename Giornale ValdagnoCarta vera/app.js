const categories = [
  { name: 'Valdagno', slug: 'valdagno' },
  { name: "Valle dell'Agno", slug: 'valle-dell-agno' },
  { name: 'Provincia', slug: 'provincia' },
  { name: 'Cronaca', slug: 'cronaca' },
  { name: 'Economia', slug: 'economia' },
  { name: 'Politica', slug: 'politica' },
  { name: 'Cultura', slug: 'cultura' },
  { name: 'Sport', slug: 'sport' },
  { name: 'Eventi', slug: 'eventi' },
  { name: 'Italia e Mondo', slug: 'italia-e-mondo' },
  { name: 'Ambiente', slug: 'ambiente' },
  { name: 'Scuola e Giovani', slug: 'scuola-e-giovani' },
  { name: 'Lifestyle', slug: 'lifestyle' },
  { name: 'Più', slug: 'piu' },
];

const news = window.GIORNALE_NEWS;
const categoryNav = document.querySelector('#category-nav');
const menuLinks = document.querySelector('#menu-links');
const menuToggle = document.querySelector('.menu-toggle');
const menuPanel = document.querySelector('#menu-panel');
const pageContent = document.querySelector('#page-content');
const liveStatus = document.querySelector('#live-status');
let collectionItems = [];
let collectionPage = 1;

const monthOptions = [
  ['2026-01', 'Gennaio 2026'], ['2026-02', 'Febbraio 2026'],
  ['2026-03', 'Marzo 2026'], ['2026-04', 'Aprile 2026'],
  ['2026-05', 'Maggio 2026'], ['2026-06', 'Giugno 2026'],
  ['2026-07', 'Luglio 2026'], ['2026-08', 'Agosto 2026'],
  ['2026-09', 'Settembre 2026'], ['2026-10', 'Ottobre 2026'],
  ['2026-11', 'Novembre 2026'],
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function categoryHref(slug) {
  return slug ? `#/${slug}` : '#/';
}

function categoryName(slug) {
  return categories.find((item) => item.slug === slug)?.name ?? 'Valdagno';
}

function imageMarkup(item, className = '') {
  const image = item.image;
  const fallback = '<span class="image-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="3.5" y="5.5" width="25" height="21" rx="1"/><circle cx="11" cy="12" r="2.5"/><path d="m5 23 7-7 5 5 4-4 6 6"/></svg></span><span class="image-note">Immagine non disponibile</span>';
  if (!image) return `<span class="${className} image-frame image-frame--empty" aria-hidden="true">${fallback}</span>`;
  return `<span class="${className} image-frame">
    <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async">
    <span class="image-fallback" aria-hidden="true">${fallback}</span>
    <span class="image-credit">${escapeHtml(image.kind)}: ${escapeHtml(image.credit)}</span>
  </span>`;
}

function createCategoryLink(category, className = '') {
  const link = document.createElement('a');
  link.className = className;
  link.href = categoryHref(category.slug);
  link.textContent = category.name;
  link.dataset.category = category.slug;
  return link;
}

for (const category of categories) {
  categoryNav.append(createCategoryLink(category, 'category-link'));
  menuLinks.append(createCategoryLink(category));
}

function newestFirst(items) {
  return [...items].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

function cardMarkup(item, extraClass = '') {
  return `<article class="news-card ${extraClass}">
    <a class="news-card__image" href="#/articolo/${encodeURIComponent(item.slug)}" aria-label="Apri: ${escapeHtml(item.title)}">
      ${imageMarkup(item)}
    </a>
    <div class="news-card__body">
      <a class="news-card__category" href="${categoryHref(item.category)}">${escapeHtml(categoryName(item.category))}</a>
      <h3><a href="#/articolo/${encodeURIComponent(item.slug)}">${escapeHtml(item.title)}</a></h3>
      <p class="news-card__date">Fatti: ${escapeHtml(item.eventDate)} · Fonte: ${escapeHtml(item.sourceDate)}</p>
      <p class="news-card__summary">${escapeHtml(item.summary)}</p>
      <a class="read-link" href="#/articolo/${encodeURIComponent(item.slug)}">Leggi la scheda <span aria-hidden="true">→</span></a>
    </div>
  </article>`;
}

function sectionMarkup(title, slug, items, href = categoryHref(slug)) {
  if (!items.length) return '';
  return `<section class="news-section">
    <div class="news-section__heading"><h2>${escapeHtml(title)}</h2><a href="${href}">Vedi tutte <span aria-hidden="true">→</span></a></div>
    <div class="news-card-grid">${items.map((item) => cardMarkup(item)).join('')}</div>
  </section>`;
}

function filtersMarkup() {
  return `<div class="archive-filters">
    <label>Categoria
      <select id="category-filter">
        <option value="">Tutte le categorie</option>
        ${categories.map((category) => `<option value="${escapeHtml(category.slug)}">${escapeHtml(category.name)}</option>`).join('')}
      </select>
    </label>
    <label>Periodo
      <select id="month-filter">
        <option value="">Tutto il 2026</option>
        ${monthOptions.map(([value, name]) => `<option value="${value}">${name}</option>`).join('')}
      </select>
    </label>
  </div>
  <div class="news-card-grid archive-results" id="archive-results"></div>
  <p class="archive-empty" id="archive-empty" hidden>Nessuna notizia corrisponde ai filtri selezionati.</p>
  <button class="load-more" id="load-more" type="button">Mostra altre notizie</button>`;
}

function renderArchiveResults() {
  const categoryFilter = document.querySelector('#category-filter')?.value ?? '';
  const monthFilter = document.querySelector('#month-filter')?.value ?? '';
  const results = document.querySelector('#archive-results');
  const empty = document.querySelector('#archive-empty');
  const more = document.querySelector('#load-more');
  if (!results || !empty || !more) return;

  const filtered = collectionItems.filter((item) => {
    const categoryMatches = !categoryFilter || item.category === categoryFilter;
    const monthMatches = !monthFilter || item.dateKey.startsWith(monthFilter);
    return categoryMatches && monthMatches;
  });
  const visible = filtered.slice(0, collectionPage * 8);
  results.innerHTML = visible.map((item) => cardMarkup(item)).join('');
  empty.hidden = filtered.length > 0;
  more.hidden = visible.length >= filtered.length;
}

function renderCollection(title, items, headingCategory = '') {
  collectionItems = newestFirst(items);
  collectionPage = 1;
  pageContent.innerHTML = `${breadcrumbsMarkup(title)}
    <header class="collection-heading">
      <p class="section-label">${escapeHtml(headingCategory || title)}</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="collection-count">${collectionItems.length} ${collectionItems.length === 1 ? 'notizia' : 'notizie'} nell’archivio 2026</p>
    </header>
    <div class="archive-heading"><h2>Archivio notizie</h2>${filtersMarkup()}</div>`;
  renderArchiveResults();
}

function breadcrumbsMarkup(current) {
  return `<nav class="breadcrumbs" aria-label="Percorso di navigazione">
    <a href="#/">Home</a><span aria-hidden="true">/</span><span>${escapeHtml(current)}</span>
  </nav>`;
}

function renderHome() {
  const sorted = newestFirst(news);
  const lead = sorted[0];
  const secondary = sorted.slice(1, 5);
  const featured = `<section class="home-lead">
    <p class="section-label">In evidenza · ${escapeHtml(categoryName(lead.category))}</p>
    <h1><a href="#/articolo/${encodeURIComponent(lead.slug)}">${escapeHtml(lead.title)}</a></h1>
    <p class="home-lead__summary">${escapeHtml(lead.summary)}</p>
    <p class="news-card__date">Fatti: ${escapeHtml(lead.eventDate)} · Fonte: ${escapeHtml(lead.sourceDate)}</p>
    <div class="home-lead__image">${imageMarkup(lead, 'home-lead-image')}</div>
    <a class="read-link" href="#/articolo/${encodeURIComponent(lead.slug)}">Leggi la scheda <span aria-hidden="true">→</span></a>
  </section>
  <section class="home-secondary" aria-label="Altre notizie recenti">
    ${secondary.map((item) => cardMarkup(item, 'news-card--compact')).join('')}
  </section>`;

  const sections = [
    ['Valdagno e Valle dell’Agno', ['valdagno', 'valle-dell-agno']],
    ['Cronaca', ['cronaca']],
    ['Economia', ['economia']],
    ['Sport', ['sport']],
    ['Cultura', ['cultura']],
    ['Italia e Mondo', ['italia-e-mondo']],
    ['Ambiente', ['ambiente']],
    ['Scuola e Giovani', ['scuola-e-giovani']],
  ].map(([title, slugs]) => {
    const items = sorted.filter((item) => slugs.includes(item.category)).slice(0, 3);
    const slug = slugs[0];
    const href = slugs.length > 1 ? '#/territorio' : categoryHref(slug);
    return items.length ? sectionMarkup(title, slug, items, href) : '';
  }).join('');

  collectionItems = sorted;
  collectionPage = 1;
  pageContent.innerHTML = `${breadcrumbsMarkup('Valdagno')}
    <div class="home-top">${featured}</div>
    <section class="news-section latest-section">
      <div class="news-section__heading"><h2>Ultime notizie</h2><a href="#/archivio">Archivio completo <span aria-hidden="true">→</span></a></div>
      ${filtersMarkup()}
    </section>
    ${sections}`;
  renderArchiveResults();
}

function renderArticle(item) {
  const related = newestFirst(news.filter((entry) => entry.id !== item.id && entry.category === item.category)).slice(0, 3);
  const localDate = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date('2026-11-03T12:00:00'));

  pageContent.innerHTML = `${breadcrumbsMarkup(categoryName(item.category))}
    <article class="article-detail">
      <p class="section-label">${escapeHtml(categoryName(item.category))}</p>
      <h1>${escapeHtml(item.title)}</h1>
      <p class="article-deck">${escapeHtml(item.summary)}</p>
      <div class="article-byline"><span>Redazione Carta Vera</span><span>Pubblicato su Carta Vera: ${localDate}</span></div>
      <dl class="article-dates">
        <div><dt>Data dei fatti</dt><dd>${escapeHtml(item.eventDate)}</dd></div>
        <div><dt>Pubblicato dalla fonte</dt><dd>${escapeHtml(item.sourceDate)}</dd></div>
        <div><dt>Luogo</dt><dd>${escapeHtml(item.location)}</dd></div>
      </dl>
      <div class="story-tools" aria-label="Strumenti articolo">
        <button class="tool-button" id="share-button" type="button" aria-label="Condividi articolo">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.6 6.6-4.2m-6.6 7 6.6 4.1"/></svg><span>Condividi</span>
        </button>
        <button class="tool-button" id="save-button" type="button" aria-label="Salva articolo" aria-pressed="false">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4z"/></svg><span id="save-label">Salva</span>
        </button>
        <button class="tool-button" type="button" data-dialog="commenti-dialog" aria-label="Apri i commenti">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-7.5A7.5 7.5 0 0 1 10.5 6H12a8 8 0 0 1 8 5.5Z"/><path d="M8 11h8m-8 4h5"/></svg><span>Commenta</span>
        </button>
      </div>
      <div class="article-image-placeholder">${imageMarkup(item, 'article-image')}</div>
      <div class="article-body">
        ${item.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
        <p class="source-note">Testo rielaborato dalla Redazione Carta Vera a partire dalle fonti citate; non riproduce integralmente l’articolo originale.</p>
        <section class="article-sources"><h2>Fonti originali</h2><ul>${item.sources.map((source) => `<li>${sourceLinksFor(source)}</li>`).join('')}</ul></section>
      </div>
    </article>
    ${related.length ? `<section class="news-section related-section"><div class="news-section__heading"><h2>Articoli correlati</h2></div><div class="news-card-grid">${related.map((entry) => cardMarkup(entry)).join('')}</div></section>` : ''}`;

  const saveButton = pageContent.querySelector('#save-button');
  const saved = getSavedArticles().includes(item.id);
  saveButton.setAttribute('aria-pressed', String(saved));
  pageContent.querySelector('#save-label').textContent = saved ? 'Salvato' : 'Salva';
}

document.addEventListener('error', (event) => {
  if (!(event.target instanceof HTMLImageElement)) return;
  const frame = event.target.closest('.image-frame');
  if (frame) frame.classList.add('image-frame--failed');
}, true);

function sourceLinksFor(source) {
  return `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)} <span aria-hidden="true">↗</span></a>`;
}

function getSavedArticles() {
  try {
    const saved = JSON.parse(localStorage.getItem('giornale-valdagno-saved') ?? '[]');
    if (!Array.isArray(saved) || !saved.every((id) => typeof id === 'string')) {
      liveStatus.textContent = 'I dati degli articoli salvati non sono validi.';
      return [];
    }
    return saved;
  } catch (error) {
    liveStatus.textContent = 'Impossibile leggere gli articoli salvati dal browser.';
    return [];
  }
}

function saveArticle(itemId) {
  try {
    const saved = getSavedArticles();
    const isSaved = saved.includes(itemId);
    const next = isSaved ? saved.filter((id) => id !== itemId) : [...saved, itemId];
    localStorage.setItem('giornale-valdagno-saved', JSON.stringify(next));
    return !isSaved;
  } catch (error) {
    liveStatus.textContent = 'Impossibile salvare la notizia in questo browser.';
    return null;
  }
}

function renderPopular() {
  const popularList = document.querySelector('#popular-list');
  const items = newestFirst(news).slice(0, 5);
  document.querySelector('.sidebar-heading h2').textContent = 'Notizie in evidenza';
  popularList.innerHTML = items.map((item, index) => `<li class="popular-item">
    <span class="popular-number">${index + 1}</span>
    <a class="popular-image" href="#/articolo/${encodeURIComponent(item.slug)}" aria-label="Apri: ${escapeHtml(item.title)}">${imageMarkup(item, 'popular-frame')}</a>
    <a class="popular-title-link" href="#/articolo/${encodeURIComponent(item.slug)}">${escapeHtml(item.title)}</a>
  </li>`).join('');
}

function renderRoute() {
  const route = window.location.hash.replace(/^#\/?/, '');
  const [path = '', queryString = ''] = route.split('?');
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'articolo') {
    const item = news.find((entry) => entry.slug === segments[1]);
    if (item) {
      document.title = `${item.title} — Giornale Valdagno`;
      renderArticle(item);
    } else {
      renderCollection('Notizia non trovata', []);
      document.title = 'Notizia non trovata — Giornale Valdagno';
    }
  } else if (segments[0] === 'archivio') {
    renderCollection('Archivio 2026', news);
    document.title = 'Archivio 2026 — Giornale Valdagno';
  } else if (segments[0] === 'territorio') {
    const items = news.filter((item) => ['valdagno', 'valle-dell-agno'].includes(item.category));
    renderCollection('Valdagno e Valle dell’Agno', items, 'Valdagno e Valle dell’Agno');
    document.title = 'Valdagno e Valle dell’Agno — Giornale Valdagno';
  } else if (segments[0] === 'cerca') {
    const query = new URLSearchParams(queryString).get('q')?.trim() ?? '';
    const normalized = query.toLocaleLowerCase('it');
    const matches = newestFirst(news).filter((item) => [
      item.title, item.category, categoryName(item.category), item.summary,
      item.eventDate, item.sourceDate, item.location, ...(item.keywords ?? [])
    ].join(' ').toLocaleLowerCase('it').includes(normalized));
    renderCollection(query ? `Risultati per “${query}”` : 'Cerca notizie', matches);
    document.title = 'Ricerca — Giornale Valdagno';
  } else if (segments.length === 0) {
    renderHome();
    document.title = 'Giornale Valdagno — Carta Vera';
  } else {
    const category = categories.find((item) => item.slug === segments[0]);
    if (category) {
      const items = news.filter((item) => item.category === category.slug);
      renderCollection(category.name, items, category.name);
      document.title = `${category.name} — Giornale Valdagno`;
    } else {
      renderHome();
      document.title = 'Giornale Valdagno — Carta Vera';
    }
  }

  const activeCategory = segments.length === 1 && categories.some((item) => item.slug === segments[0])
    ? segments[0]
    : '';
  for (const link of categoryNav.querySelectorAll('a')) {
    if (link.dataset.category === activeCategory) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  menuPanel.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

window.addEventListener('hashchange', renderRoute);
renderRoute();
renderPopular();

menuToggle.addEventListener('click', () => {
  const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isExpanded));
  menuPanel.hidden = isExpanded;
});

document.addEventListener('click', (event) => {
  if (!menuPanel.hidden && !menuPanel.contains(event.target) && !menuToggle.contains(event.target)) {
    menuPanel.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
  }
});

document.querySelector('.search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const query = document.querySelector('#site-search').value.trim();
  if (!query) {
    liveStatus.textContent = 'Inserisci una parola da cercare.';
    return;
  }
  window.location.hash = `/cerca?q=${encodeURIComponent(query)}`;
});

pageContent.addEventListener('change', (event) => {
  if (event.target.matches('#category-filter, #month-filter')) {
    collectionPage = 1;
    renderArchiveResults();
  }
});

pageContent.addEventListener('click', (event) => {
  if (event.target.closest('#load-more')) {
    collectionPage += 1;
    renderArchiveResults();
  }
  const saveButton = event.target.closest('#save-button');
  if (saveButton) {
    const item = news.find((entry) => window.location.hash.endsWith(encodeURIComponent(entry.slug)));
    if (!item) return;
    const saved = saveArticle(item.id);
    if (saved === null) return;
    saveButton.setAttribute('aria-pressed', String(saved));
    pageContent.querySelector('#save-label').textContent = saved ? 'Salvato' : 'Salva';
    liveStatus.textContent = saved ? 'Articolo salvato.' : 'Articolo rimosso dai salvati.';
  }
  if (event.target.closest('#share-button')) shareCurrentPage();
});

async function shareCurrentPage() {
  const shareData = { title: document.title, url: window.location.href };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
      liveStatus.textContent = 'Link copiato.';
    } else {
      liveStatus.textContent = 'La condivisione non è disponibile in questo browser.';
    }
  } catch (error) {
    if (error.name !== 'AbortError') liveStatus.textContent = 'Impossibile condividere il link.';
  }
}

for (const button of document.querySelectorAll('[data-dialog]')) {
  button.addEventListener('click', () => document.getElementById(button.dataset.dialog).showModal());
}

for (const closeButton of document.querySelectorAll('.dialog-close')) {
  closeButton.addEventListener('click', () => closeButton.closest('dialog').close());
}

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}
