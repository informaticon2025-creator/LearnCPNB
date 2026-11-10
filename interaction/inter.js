let data = [];
let radioData = [];
let phoneticAlphabet = [];

function getPinnedItems() {
  return JSON.parse(localStorage.getItem('pinnedItems') || '[]');
}

function savePinnedItems(items) {
  localStorage.setItem('pinnedItems', JSON.stringify(items));
}

const archivedPromosStorageKey = 'learncpnb-archived-promos';

function getArchivedPromos() {
  const saved = localStorage.getItem(archivedPromosStorageKey);
  if (!saved) return [];

  const promos = JSON.parse(saved);
  if (
    !Array.isArray(promos) ||
    promos.some(promo =>
      !promo ||
      !Number.isSafeInteger(promo.id) ||
      promo.id < 1 ||
      promo.id > 999 ||
      typeof promo.title !== 'string' ||
      typeof promo.description !== 'string' ||
      typeof promo.archivedAt !== 'string'
    )
  ) {
    throw new Error('El registro de promociones archivadas no es válido.');
  }
  return promos;
}

function saveArchivedPromos(promos) {
  localStorage.setItem(archivedPromosStorageKey, JSON.stringify(promos));
}

function togglePin(item) {
  let pinned = getPinnedItems();
  const index = pinned.findIndex(p => p.id === item.id);
  if (index >= 0) {
    pinned.splice(index, 1);
  } else {
    pinned.push(item);
  }
  savePinnedItems(pinned);
}

function createPinButton(item, title) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn-pin';
  button.setAttribute('aria-label', `Fijar ${title}`);
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.classList.add('icon', 'pin-icon');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z');
  icon.appendChild(path);

  const update = () => {
    const pinned = getPinnedItems().some(saved => saved.id === item.id);
    button.classList.toggle('pinned', pinned);
    button.setAttribute('aria-pressed', String(pinned));
    button.setAttribute('aria-label', `${pinned ? 'Desfijar' : 'Fijar'} ${title}`);
  };

  button.appendChild(icon);
  button.addEventListener('click', () => {
    togglePin(item);
    update();
  });
  update();
  return button;
}

function wrapCanvasText(context, text, maxWidth) {
  const lines = [];
  text.split('\n').forEach(paragraph => {
    let line = '';
    paragraph.split(/\s+/).forEach(word => {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    lines.push(line);
  });
  return lines;
}

function createArticleImage(title, text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo preparar la imagen para compartir.');

  const width = 1080;
  const padding = 72;
  const contentWidth = width - padding * 2;
  const titleFont = '700 42px Arial, Helvetica, sans-serif';
  const textFont = '30px Arial, Helvetica, sans-serif';
  const titleLineHeight = 56;
  const textLineHeight = 44;
  const titleGap = 30;

  context.font = titleFont;
  const titleLines = wrapCanvasText(context, title, contentWidth);
  context.font = textFont;
  const textLines = wrapCanvasText(context, text, contentWidth);
  const height = padding * 2
    + titleLines.length * titleLineHeight
    + titleGap
    + textLines.length * textLineHeight;

  canvas.width = width;
  canvas.height = height;
  const imageContext = canvas.getContext('2d');
  if (!imageContext) throw new Error('No se pudo preparar la imagen para compartir.');
  imageContext.fillStyle = '#f1f5fb';
  imageContext.fillRect(0, 0, width, height);
  imageContext.fillStyle = '#ffffff';
  imageContext.strokeStyle = '#dce5f0';
  imageContext.lineWidth = 2;
  imageContext.fillRect(24, 24, width - 48, height - 48);
  imageContext.strokeRect(24, 24, width - 48, height - 48);

  let y = padding;
  imageContext.font = titleFont;
  imageContext.fillStyle = '#123b70';
  titleLines.forEach(line => {
    imageContext.fillText(line, padding, y);
    y += titleLineHeight;
  });

  y += titleGap;
  imageContext.font = textFont;
  imageContext.fillStyle = '#1c2a3d';
  textLines.forEach(line => {
    imageContext.fillText(line, padding, y);
    y += textLineHeight;
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('No se pudo generar la imagen.'));
    }, 'image/png');
  });
}

function createShareImageButton(title, text) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn-share-image';
  button.setAttribute('aria-label', `Compartir imagen de ${title}`);
  button.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.7 10.6 6.6-4.2m-6.6 7 6.6 4.2"></path></svg>';
  button.addEventListener('click', async () => {
    button.disabled = true;
    const status = button.closest('dialog').querySelector('.share-image-status');
    status.textContent = 'Preparando imagen...';

    try {
      const blob = await createArticleImage(title, text);
      const file = new File([blob], 'learncpnb-contenido.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file] });
        status.textContent = 'Imagen compartida.';
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'learncpnb-contenido.png';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        status.textContent = 'Imagen descargada para compartir.';
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        status.textContent = '';
      } else {
        console.error(error);
        status.textContent = 'No se pudo generar o compartir la imagen.';
      }
    } finally {
      button.disabled = false;
    }
  });
  return button;
}

let currentFilter = null;
let showingAlphabet = false;
let currentPage = 'home';
let newsItems = [];
let promoItems = [];
let lawItems = [];
let functionResources = [];
const keyPracticeLaunch = document.getElementById('keyPracticeLaunch');
const normalizeText = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function showView(view) {
  const activePage = view === 'keys' || view === 'search' ? currentPage : view;
  document.getElementById('homeView').hidden = view !== 'home';
  document.getElementById('lawsView').hidden = view !== 'laws';
  document.getElementById('functionView').hidden = view !== 'function';
  document.getElementById('resultsPanel').hidden = view !== 'keys' && view !== 'search';

  document.querySelectorAll('.bottom-nav-button').forEach(button => {
    if (button.dataset.page === activePage) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}

function openMainView(view) {
  currentPage = view;
  currentFilter = null;
  showingAlphabet = false;
  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';
  updateSearchPlaceholder();
  document.getElementById('cardsContainer').hidden = false;
  document.getElementById('phoneticTable').hidden = true;
  showView(view);
  renderCards([]);
}

document.querySelectorAll('.bottom-nav-button').forEach(button => {
  button.addEventListener('click', () => {
    openMainView(button.dataset.page);
    if (button.dataset.page === 'function') loadFunctionResources();
  });
});

const appMain = document.querySelector('.app-main');
const mainPages = ['home', 'laws', 'function'];
let swipeStart = null;

appMain.addEventListener('touchstart', event => {
  if (
    !window.matchMedia('(max-width: 768px)').matches ||
    event.touches.length !== 1 ||
    event.target.closest('a, button, input, textarea, select, [role="link"], [role="button"], [contenteditable="true"]')
  ) {
    swipeStart = null;
    return;
  }

  const touch = event.touches[0];
  swipeStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

appMain.addEventListener('touchend', event => {
  if (!swipeStart || event.changedTouches.length !== 1) return;

  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - swipeStart.x;
  const deltaY = touch.clientY - swipeStart.y;
  swipeStart = null;

  if (Math.abs(deltaX) < 60 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) return;

  const currentIndex = mainPages.indexOf(currentPage);
  const nextIndex = currentIndex + (deltaX > 0 ? 1 : -1);
  if (nextIndex < 0 || nextIndex >= mainPages.length) return;

  const nextPage = mainPages[nextIndex];
  openMainView(nextPage);
  if (nextPage === 'function') loadFunctionResources();
}, { passive: true });

function updateSearchPlaceholder() {
  const input = document.getElementById('searchInput');
  const placeholders = {
    home: ['Evento', 'Buscar noticias'],
    laws: ['Articulo', 'Buscar artículos de leyes'],
    function: ['Lean', 'Buscar temas de función policial']
  };
  const [placeholder, label] = placeholders[currentPage];
  input.placeholder = placeholder;
  input.setAttribute('aria-label', label);
}

function fetchJson(path) {
  return fetch(path).then(response => {
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${path} (${response.status}).`);
    }
    return response.json();
  });
}

function safeHttpUrl(value, baseUrl) {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value, baseUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function parsePublicationDate(value) {
  if (typeof value !== 'string') return null;
  const dayFirst = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dayFirst && !iso) return null;

  const year = Number(dayFirst ? dayFirst[3] : iso[1]);
  const month = Number(dayFirst ? dayFirst[2] : iso[2]);
  const day = Number(dayFirst ? dayFirst[1] : iso[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.getTime();
}

function renderNews(news) {
  const container = document.getElementById('newsContainer');
  const status = document.getElementById('newsStatus');
  container.replaceChildren();

  const publishedNews = news
    .filter(item => item.titulo.trim() || item.descripcion.trim())
    .sort((first, second) =>
      (parsePublicationDate(second.fecha) ?? 0) - (parsePublicationDate(first.fecha) ?? 0) ||
      second.id - first.id
    );

  publishedNews.forEach(item => {
    const card = document.createElement('article');
    card.className = 'news-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.setAttribute('aria-label', `Leer noticia: ${item.titulo}`);
    const newsUrl = `page/news.html?id=${encodeURIComponent(item.id)}`;
    const openNews = () => window.location.assign(newsUrl);
    card.addEventListener('click', event => {
      if (event.target.closest('a')) return;
      openNews();
    });
    card.addEventListener('keydown', event => {
      if (event.target !== card || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      openNews();
    });

    const imageUrl = item.img ? safeHttpUrl(item.img, document.baseURI) : null;
    if (item.img && !imageUrl) {
      throw new Error(`La imagen de la noticia ${item.id} tiene una URL inválida.`);
    }
    if (imageUrl) {
      const image = window.createNewsImageElement(imageUrl, item.titulo, 'news-image');
      image.loading = 'lazy';
      card.appendChild(image);
    }

    const videoUrl = item.iframe ? safeHttpUrl(item.iframe, document.baseURI) : null;
    if (item.iframe && !videoUrl) {
      throw new Error(`El video de la noticia ${item.id} tiene una URL inválida.`);
    }
    if (videoUrl) {
      card.appendChild(window.createNewsIframeElement(videoUrl, item.titulo));
    }

    const content = document.createElement('div');
    content.className = 'news-content';
    const date = document.createElement('time');
    date.className = 'news-date';
    date.textContent = item.fecha;
    const title = document.createElement('h2');
    title.textContent = item.titulo;
    const description = document.createElement('p');
    description.textContent = item.descripcion;
    const readMore = document.createElement('span');
    readMore.className = 'news-read-more';
    readMore.textContent = 'Leer noticia completa';
    content.append(date, title, description, readMore);

    if (item.link) {
      const linkUrl = safeHttpUrl(item.link, document.baseURI);
      if (!linkUrl) {
        throw new Error(`El enlace de la noticia ${item.id} tiene una URL inválida.`);
      }
      const link = document.createElement('a');
      link.className = 'news-link';
      link.href = linkUrl;
      link.textContent = 'Ir a Fuente';
      if (new URL(linkUrl).origin !== window.location.origin) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      content.appendChild(link);
    }

    card.appendChild(content);
    container.appendChild(card);
  });

  status.textContent = container.childElementCount
    ? ''
    : 'Aún no hay noticias disponibles.';
}

function renderPromoCatalog(promotions) {
  const container = document.getElementById('promoCatalog');
  const status = document.getElementById('promoCatalogStatus');
  container.replaceChildren();

  const savedCompletedPromos = localStorage.getItem('learncpnb-completed-promos');
  const completedPromoIds = savedCompletedPromos ? JSON.parse(savedCompletedPromos) : [];
  if (
    !Array.isArray(completedPromoIds) ||
    completedPromoIds.some(id => !Number.isSafeInteger(id) || id < 1 || id > 999)
  ) {
    throw new Error('El registro de actividades completadas no es válido.');
  }
  const archivedPromoIds = getArchivedPromos().map(promo => promo.id);
  const publishedPromotions = promotions.filter(item =>
    item.titulo.trim() && item.descripcion.trim()
  );
  const promotionsById = new Map(publishedPromotions.map(item => [item.promoId, item]));
  const orderedPromotions = [];
  const orderedPromoIds = new Set();
  let nextPromoId = publishedPromotions.length
    ? Math.min(...publishedPromotions.map(item => item.promoId))
    : null;

  while (nextPromoId !== null && !orderedPromoIds.has(nextPromoId)) {
    const promo = promotionsById.get(nextPromoId);
    if (!promo) break;
    orderedPromotions.push(promo);
    orderedPromoIds.add(nextPromoId);
    nextPromoId = promo.siguiente === undefined ? nextPromoId + 1 : promo.siguiente;
  }
  publishedPromotions
    .filter(item => !orderedPromoIds.has(item.promoId))
    .sort((first, second) => first.promoId - second.promoId)
    .forEach(item => orderedPromotions.push(item));

  orderedPromotions.forEach(item => {
    const promoId = item.promoId;
    if (archivedPromoIds.includes(promoId)) return;

    const destinationUrl = safeHttpUrl(item.enlace.trim() || 'page/promo.html', document.baseURI);
    if (!destinationUrl) {
      throw new Error(`La promoción ${promoId} tiene una URL inválida.`);
    }
    const destination = new URL(destinationUrl);
    const isPromoActivity =
      destination.origin === window.location.origin &&
      destination.pathname === new URL('page/promo.html', document.baseURI).pathname;
    if (isPromoActivity) destination.searchParams.set('id', String(promoId));

    const isCompleted = isPromoActivity && completedPromoIds.includes(promoId);
    const card = document.createElement('article');
    card.className = `promo-catalog-card${isCompleted ? ' promo-catalog-card--completed' : ''}`;
    const action = document.createElement(isCompleted ? 'button' : 'a');
    action.className = 'promo-catalog-button';
    if (isCompleted) {
      action.type = 'button';
      action.disabled = true;
    } else {
      action.href = destination.href;
      if (destination.origin !== window.location.origin) {
        action.target = '_blank';
        action.rel = 'noopener noreferrer';
      }
    }

    const title = document.createElement('strong');
    title.textContent = item.titulo;
    const description = document.createElement('span');
    description.textContent = item.descripcion;
    const label = document.createElement('span');
    label.className = 'promo-catalog-action';
    label.textContent = isCompleted ? 'Actividad completada' : item.textoBoton;
    action.append(title, description, label);
    card.appendChild(action);

    if (isCompleted && isPromoActivity) {
      const archiveButton = document.createElement('button');
      archiveButton.className = 'promo-catalog-archive';
      archiveButton.type = 'button';
      archiveButton.textContent = 'Archivar';
      archiveButton.setAttribute('aria-label', `Archivar actividad: ${item.titulo}`);
      archiveButton.addEventListener('click', () => {
        try {
          const currentArchivedPromos = getArchivedPromos();
          if (!currentArchivedPromos.some(promo => promo.id === promoId)) {
            currentArchivedPromos.push({
              id: promoId,
              title: item.titulo,
              description: item.descripcion,
              fecha: item.fecha || '',
              archivedAt: new Date().toISOString()
            });
            saveArchivedPromos(currentArchivedPromos);
          }
          renderPromoCatalog(promotions);
        } catch (error) {
          console.error('No se pudo archivar la actividad.', error);
          status.textContent = 'No se pudo archivar la actividad. Inténtalo de nuevo.';
        }
      });
      card.appendChild(archiveButton);
    }

    container.appendChild(card);
  });

  const keyPracticeCard = document.createElement('article');
  keyPracticeCard.className = 'promo-catalog-card promo-catalog-card--keys';
  const keyPracticeLink = document.createElement('a');
  keyPracticeLink.className = 'promo-catalog-button';
  keyPracticeLink.href = 'page/promo.html?practice=keys';
  const keyPracticeTitle = document.createElement('strong');
  keyPracticeTitle.textContent = 'Práctica de claves policiales';
  const keyPracticeDescription = document.createElement('span');
  keyPracticeDescription.textContent = 'Pon a prueba tu memoria con preguntas aleatorias sobre claves, códigos y significados.';
  const keyPracticeAction = document.createElement('span');
  keyPracticeAction.className = 'promo-catalog-action';
  keyPracticeAction.textContent = 'Practicar';
  keyPracticeLink.append(keyPracticeTitle, keyPracticeDescription, keyPracticeAction);
  keyPracticeCard.appendChild(keyPracticeLink);
  const practicePosition = Math.floor(Math.random() * (container.childElementCount + 1));
  container.insertBefore(keyPracticeCard, container.children[practicePosition] || null);

  status.textContent = container.childElementCount
    ? ''
    : 'Aún no hay prácticas disponibles.';
}

async function fetchNumberedJson(folder, prefix, validate) {
  const entries = [];

  for (let number = 1; number <= 999; number += 1) {
    const filename = `${prefix}_${String(number).padStart(2, '0')}.json`;
    const response = await fetch(`${folder}/${filename}`);
    if (response.status === 404) break;
    if (response.status === 503) {
      throw new Error('El contenido requiere conexión a internet y no está disponible sin conexión.');
    }
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${folder}/${filename} (${response.status}).`);
    }

    const body = await response.text();
    if (
      response.headers.get('content-type')?.includes('text/html') ||
      /^\s*(?:<!doctype\s+html|<html[\s>])/i.test(body)
    ) {
      break;
    }

    let entry;
    try {
      entry = JSON.parse(body);
    } catch (error) {
      throw new Error(`El archivo ${folder}/${filename} no contiene JSON válido.`, { cause: error });
    }
    validate(entry, number);
    entries.push(entry);

    if (number === 999) {
      throw new Error(`Se alcanzó el límite de 999 archivos en ${folder}.`);
    }
  }

  return entries;
}

function validateNews(item, number) {
  if (
    !item ||
    Array.isArray(item) ||
    ['titulo', 'fecha', 'descripcion'].some(key => typeof item[key] !== 'string') ||
    (item.img !== undefined && typeof item.img !== 'string') ||
    (item.iframe !== undefined && typeof item.iframe !== 'string') ||
    (!item.img?.trim() && !item.iframe?.trim()) ||
    parsePublicationDate(item.fecha) === null ||
    (item.link !== undefined && typeof item.link !== 'string') ||
    (item.contenido !== undefined && typeof item.contenido !== 'string')
  ) {
    throw new Error(`La noticia ${number} debe incluir titulo, fecha válida (DD/MM/AAAA o AAAA-MM-DD), descripcion y una URL en img (imagen) o iframe (video); link es opcional.`);
  }
}

function validatePromotion(item, number) {
  if (
    !item ||
    Array.isArray(item) ||
    ['titulo', 'descripcion', 'enlace', 'textoBoton'].some(key => typeof item[key] !== 'string') ||
    (item.fecha !== undefined && (typeof item.fecha !== 'string' || parsePublicationDate(item.fecha) === null)) ||
    (item.siguiente !== undefined &&
      item.siguiente !== null &&
      (!Number.isSafeInteger(item.siguiente) || item.siguiente < 1 || item.siguiente > 999))
  ) {
    throw new Error(`La promoción ${number} debe incluir titulo, descripcion, enlace y textoBoton como texto; fecha es opcional y debe ser válida (DD/MM/AAAA o AAAA-MM-DD).`);
  }
}

async function loadNews() {
  const status = document.getElementById('newsStatus');
  const promoStatus = document.getElementById('promoCatalogStatus');
  try {
    const [entries, promotions] = await Promise.all([
      fetchNumberedJson('file/news', 'new', validateNews),
      fetchNumberedJson('file/news', 'promo', validatePromotion)
    ]);
    newsItems = entries
      .map((item, index) => ({ ...item, id: index + 1 }))
      .reverse();
    promoItems = promotions.map((item, index) => ({ ...item, promoId: index + 1 }));
    renderNews(newsItems);
    renderPromoCatalog(promoItems);
    refreshCurrentSearch();
  } catch (error) {
    console.error(error);
    status.textContent = error.message || 'No se pudieron cargar las noticias.';
    promoStatus.textContent = error.message || 'No se pudieron cargar las promociones.';
  }
}

function validateLaw(law, number) {
  if (
    !law ||
    Array.isArray(law) ||
    ['titulo', 'subtitulo', 'descripcion'].some(key => typeof law[key] !== 'string' || !law[key].trim()) ||
    !Array.isArray(law.articulos) ||
    law.articulos.some(article =>
      !article ||
      ['number', 'title', 'text'].some(key => typeof article[key] !== 'string')
    )
  ) {
    throw new Error(`La ley ${number} debe incluir titulo, subtitulo, descripcion y articulos en el mismo JSON.`);
  }
  return law;
}

function formatArticleTitle(number, title) {
  return title ? `Artículo ${number}: ${title}` : `Artículo ${number}`;
}

function renderLaws(laws) {
  const container = document.getElementById('lawsList');
  const status = document.getElementById('lawsStatus');
  container.replaceChildren();

  if (!laws.length) {
    status.textContent = 'Aún no hay leyes registradas.';
    return;
  }

  laws.forEach(law => {
    const button = document.createElement('button');
    button.className = 'law-card';
    button.type = 'button';

    const title = document.createElement('span');
    title.className = 'law-card-title';
    title.textContent = law.titulo;
    const subtitle = document.createElement('span');
    subtitle.className = 'law-card-subtitle';
    subtitle.textContent = law.subtitulo;
    const description = document.createElement('span');
    description.className = 'law-card-description';
    description.textContent = law.descripcion;

    button.append(title, subtitle, description);
    button.addEventListener('click', () => openLaw(law));
    container.appendChild(button);
  });

  status.textContent = '';
}

async function loadLaws() {
  const status = document.getElementById('lawsStatus');
  try {
    lawItems = await fetchNumberedJson('file/gacetas', 'ley', validateLaw);
    renderLaws(lawItems);
    refreshCurrentSearch();
  } catch (error) {
    console.error(error);
    status.textContent = error.message || 'No se pudieron cargar las leyes.';
  }
}

async function loadFunctionResources() {
  const container = document.getElementById('functionCategories');
  const status = document.getElementById('functionStatus');

  try {
    const resources = await fetchNumberedJson('file/funcion', 'fuc', validateFunctionResource);
    functionResources = resources;
    renderFunctionResources(resources);
    refreshCurrentSearch();
  } catch (error) {
    console.error(error);
    container.replaceChildren();
    status.textContent = `No se pudo cargar el material: ${error.message}`;
  }
}

function validateFunctionResource(resource, number) {
  if (!resource || Array.isArray(resource) || typeof resource !== 'object') {
    throw new Error(`fuc_${String(number).padStart(2, '0')}.json debe contener un objeto JSON.`);
  }
  if (typeof resource.titulo !== 'string' || !resource.titulo.trim()) {
    throw new Error(`fuc_${String(number).padStart(2, '0')}.json debe incluir titulo.`);
  }
  if (
    typeof resource.num !== 'string' ||
    !resource.num.trim() ||
    !['claves', 'documento', 'actas', 'procedimiento', 'updf', 'updfm'].includes(resource.tipo) ||
    !Array.isArray(resource.categoria) ||
    resource.categoria.some(category =>
      !category ||
      typeof category.nombre !== 'string' ||
      !Array.isArray(category.subcategorias) ||
      category.subcategorias.some(subcategory =>
        !subcategory ||
        typeof subcategory.nombre !== 'string' ||
        !Array.isArray(subcategory.articulos) ||
        subcategory.articulos.some(article =>
          !article ||
          typeof article.numART !== 'string' ||
          typeof article.tituloART !== 'string' ||
          typeof article.parrafoART !== 'string' ||
          (article.imgART !== undefined && typeof article.imgART !== 'string')
          
        )
      )
    )
  ) {
    throw new Error(`${resource.titulo} debe incluir tipo, num y categoria con subcategorias y articulos.`);
  }
}

function renderFunctionResources(resources) {
  const container = document.getElementById('functionCategories');
  const status = document.getElementById('functionStatus');
  container.replaceChildren();

  resources.forEach((resource, index) => {
    if (resource.tipo === 'claves') {
      data = resource.categoria.flatMap(category =>
        category.subcategorias.flatMap(subcategory =>
          subcategory.articulos.map(article => ({
            group: subcategory.nombre,
            num: article.numART,
            title: article.tituloART,
            text: article.parrafoART,
            cat: category.nombre
          }))
        )
      );
      radioData = Array.isArray(resource.clavesRadio)
        ? resource.clavesRadio.map(item => ({ ...item, cat: 'RADIO', group: 'Claves radio' }))
        : [];
      phoneticAlphabet = Array.isArray(resource.alfabetoFonetico) ? resource.alfabetoFonetico : phoneticAlphabet;

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'function-category function-keys-toggle';
      toggle.dataset.functionKeysToggle = '';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', `function-key-options-${index}`);
      const toggleTitle = document.createElement('span');
      toggleTitle.className = 'function-category-title';
      toggleTitle.textContent = 'Claves';
      const toggleDescription = document.createElement('span');
      toggleDescription.className = 'function-category-description';
      toggleDescription.textContent = 'Practica y verifica las claves radiofónicas.';
      toggle.append(toggleTitle, toggleDescription);

      const minutaLink = document.createElement('a');
      minutaLink.className = 'function-category function-minuta-link';
      minutaLink.href = 'page/minuta.html';
      const minutaTitle = document.createElement('span');
      minutaTitle.className = 'function-category-title';
      minutaTitle.textContent = 'Minutas SMS';
      const minutaDescription = document.createElement('span');
      minutaDescription.className = 'function-category-description';
      minutaDescription.textContent = 'Crea y guíate con minutas de mensajería para reportes por comunicación de red.';
      minutaLink.append(minutaTitle, minutaDescription);

      const actions = document.createElement('div');
      resource.categoria.forEach(category => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'function-action-card';
        button.dataset.filter = category.nombre;
        button.textContent = category.nombre;
        actions.appendChild(button);
      });

      if (radioData.length) {
        const radioButton = document.createElement('button');
        radioButton.type = 'button';
        radioButton.className = 'function-action-card';
        radioButton.dataset.filter = 'RADIO';
        radioButton.textContent = 'Claves radio';
        actions.appendChild(radioButton);
      }

      if (phoneticAlphabet.length) {
        const alphabetButton = document.createElement('button');
        alphabetButton.type = 'button';
        alphabetButton.className = 'function-action-card';
        alphabetButton.dataset.action = 'alphabet';
        alphabetButton.textContent = 'Alfabeto fonético';
        actions.appendChild(alphabetButton);
      }

      actions.className = 'function-key-actions';
      actions.id = `function-key-options-${index}`;
      actions.hidden = true;
      container.append(toggle, actions, minutaLink);
      return;
    }

    const section = document.createElement('section');
    section.className = 'function-category';
    section.setAttribute('role', 'button');
    section.tabIndex = 0;
    const heading = document.createElement('h3');
    heading.id = `function-category-heading-${index}`;
    heading.textContent = resource.tipo === 'actas'
      ? 'Redacción de actas policiales'
      : resource.tipo === 'documento'
        ? 'Herramientas de un Policía'
        : resource.titulo;
    section.setAttribute('aria-labelledby', heading.id);
    const openResource = () => openFunctionResource(resource);

    section.addEventListener('click', openResource);
    section.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openResource();
      }
    });

    section.appendChild(heading);
    if (resource.descripcion) {
      const description = document.createElement('p');
      description.className = 'function-category-description';
      description.textContent = resource.descripcion;
      section.appendChild(description);
    }
    container.appendChild(section);
  });

  status.textContent = resources.length ? '' : 'En estos momento no hay conexion con el servicio porfavor intente mas tarde.';
}

const functionDialog = document.getElementById('functionDialog');
const functionDocumentContent = document.getElementById('functionDocumentContent');
const functionDocumentSearch = document.getElementById('functionDocumentSearch');
const functionDocumentStatus = document.getElementById('functionDocumentStatus');

function filterFunctionDocument() {
  const query = normalizeText(functionDocumentSearch.value.trim());
  const sections = Array.from(functionDocumentContent.querySelectorAll('.law-article'));
  let visibleSections = 0;

  sections.forEach(section => {
    const matches = normalizeText(section.textContent).includes(query);
    section.hidden = !matches;
    if (matches) visibleSections += 1;
  });

  functionDocumentContent.querySelectorAll('.function-document-group').forEach(group => {
    group.hidden = !group.querySelector('.law-article:not([hidden])');
  });

  functionDocumentStatus.textContent = visibleSections
    ? `${visibleSections} sección${visibleSections === 1 ? '' : 'es'}`
    : 'No se encontraron coincidencias.';
}

function getDocumentSections(data) {
  const sections = Array.isArray(data.sections) ? data.sections : data.secciones;
  if (Array.isArray(sections)) {
    return sections.map((section, index) => {
      if (!section || typeof section !== 'object') {
        throw new Error(`La sección ${index + 1} del documento tiene un formato inválido.`);
      }
      const title = section.titulo || section.title || `Sección ${index + 1}`;
      const text = section.contenido || section.descripcion || section.text || '';
      return { title, text, table: section.tabla, image: section.imagen };
    });
  }

  const articles = Array.isArray(data.articles) ? data.articles : data.articulos;
  if (Array.isArray(articles)) {
    return articles.map((article, index) => {
      if (!article || typeof article !== 'object') {
        throw new Error(`El artículo ${index + 1} del documento tiene un formato inválido.`);
      }
      return {
        title: formatArticleTitle(
          article.number || article.numero || index + 1,
          article.title || article.titulo || ''
        ),
        text: article.text || article.texto || article.contenido || ''
      };
    });
  }

  if (Array.isArray(data.categoria)) {
    return data.categoria.flatMap(category =>
      category.subcategorias.flatMap(subcategory =>
        subcategory.articulos.map(article => ({
          title: `${article.numART}: ${article.tituloART}`,
          text: article.parrafoART,
          imageUrl: article.imgART || '',
          groupTitle: category.nombre,
          subsectionTitle: subcategory.nombre
        }))
      )
    );
  }

  if (typeof data.contenido === 'string' || typeof data.descripcion === 'string' || typeof data.text === 'string') {
    return [{
      title: data.subtitulo || data.subtitle || '',
      text: data.contenido || data.descripcion || data.text || ''
    }];
  }

  throw new Error('El documento debe incluir sections/secciones, articles/articulos o contenido.');
}

async function openFunctionResource(resource, initialSectionIndex = 0) {
  document.getElementById('functionDialogTitle').textContent = resource.titulo;
  document.getElementById('functionDialogSubtitle').textContent = resource.subtitulo || '';
  document.getElementById('functionDialogDescription').textContent = resource.descripcion || '';
  functionDocumentContent.replaceChildren();
  functionDocumentSearch.value = '';
  functionDocumentSearch.disabled = true;
  functionDocumentStatus.textContent = 'Cargando documento...';
  functionDialog.scrollTop = 0;
  functionDialog.showModal();

  try {
    const data = resource;
    const sections = getDocumentSections(data);
    const groups = new Map();
    sections.forEach((section, index) => {
      if (typeof section.title !== 'string' || typeof section.text !== 'string') {
        throw new Error(`Hay secciones con campos inválidos en ${resource.archivo}.`);
      }
      let articleContainer = functionDocumentContent;
      if (section.groupTitle) {
        const groupKey = `${section.groupTitle}\u0000${section.subsectionTitle || ''}`;
        if (!groups.has(groupKey)) {
          const group = document.createElement('section');
          group.className = 'function-document-group';
          const groupHeading = document.createElement('h3');
          groupHeading.className = 'function-document-group-title';
          groupHeading.textContent = section.groupTitle;
          group.appendChild(groupHeading);
          if (section.subsectionTitle) {
            const subsectionHeading = document.createElement('h4');
            subsectionHeading.className = 'function-document-subsection-title';
            subsectionHeading.textContent = section.subsectionTitle;
            group.appendChild(subsectionHeading);
          }
          functionDocumentContent.appendChild(group);
          groups.set(groupKey, group);
        }
        articleContainer = groups.get(groupKey);
      }

      const article = document.createElement('article');
      article.className = 'law-article';
      article.dataset.sectionIndex = String(index);
      const sectionTitle = section.title || `Sección ${index + 1}`;
      const header = document.createElement('div');
      header.className = 'law-article-header';
      if (section.title) {
        const heading = document.createElement('h3');
        heading.textContent = sectionTitle;
        header.appendChild(heading);
      }
      const pinItem = {
        id: `function-${normalizeText(resource.titulo)}-${index}`,
        type: 'FUNCIÓN',
        title: `${resource.titulo}: ${sectionTitle}`,
        text: section.text
      };
      const actions = document.createElement('div');
      actions.className = 'law-article-actions';
      actions.append(
        createPinButton(pinItem, sectionTitle),
        createShareImageButton(sectionTitle, section.text)
      );
      header.appendChild(actions);
      article.appendChild(header);
      const text = document.createElement('p');
      text.textContent = section.text;
      article.appendChild(text);

      if (section.imageUrl) {
        const imageUrl = safeHttpUrl(section.imageUrl, document.baseURI);
        if (!imageUrl) {
          throw new Error(`La imagen de ${sectionTitle} tiene una URL inválida.`);
        }
        const image = document.createElement('img');
        image.className = 'function-document-image';
        image.src = imageUrl;
        image.alt = sectionTitle;
        image.loading = 'lazy';
        article.appendChild(image);
      }

      if (section.table !== undefined) {
        const { encabezados, filas } = section.table;
        if (
          !Array.isArray(encabezados) ||
          !encabezados.length ||
          !encabezados.every(value => typeof value === 'string') ||
          !Array.isArray(filas) ||
          !filas.every(row =>
            Array.isArray(row) &&
            row.length === encabezados.length &&
            row.every(value => typeof value === 'string')
          )
        ) {
          throw new Error(`La tabla de ${sectionTitle} tiene un formato inválido.`);
        }

        const table = document.createElement('table');
        table.className = 'specifications-table';
        const head = document.createElement('thead');
        const headerRow = document.createElement('tr');
        encabezados.forEach(label => {
          const cell = document.createElement('th');
          cell.scope = 'col';
          cell.textContent = label;
          headerRow.appendChild(cell);
        });
        head.appendChild(headerRow);
        const body = document.createElement('tbody');
        filas.forEach(row => {
          const tableRow = document.createElement('tr');
          row.forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            tableRow.appendChild(cell);
          });
          body.appendChild(tableRow);
        });
        table.append(head, body);
        article.appendChild(table);
      }

      if (section.image !== undefined) {
        const { src, alt, marcadores } = section.image;
        const imageUrl = safeHttpUrl(src, document.baseURI);
        if (
          !imageUrl ||
          typeof alt !== 'string' ||
          !Array.isArray(marcadores) ||
          !marcadores.length ||
          !marcadores.every(marker =>
            marker &&
            typeof marker.nombre === 'string' &&
            typeof marker.descripcion === 'string' &&
            Number.isFinite(marker.x) &&
            Number.isFinite(marker.y) &&
            marker.x >= 0 &&
            marker.x <= 100 &&
            marker.y >= 0 &&
            marker.y <= 100
          )
        ) {
          throw new Error(`El mapa de ${sectionTitle} tiene un formato inválido.`);
        }

        const figure = document.createElement('figure');
        figure.className = 'parts-map';
        const visual = document.createElement('div');
        visual.className = 'parts-map-visual';
        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = alt;
        image.loading = 'lazy';
        const description = document.createElement('p');
        description.className = 'parts-map-description';
        description.setAttribute('role', 'status');
        description.setAttribute('aria-live', 'polite');
        description.textContent = 'Selecciona un marcador para consultar una zona externa.';
        image.addEventListener('error', () => {
          description.textContent = 'No se pudo cargar la imagen ilustrativa.';
        });
        const key = document.createElement('ol');
        key.className = 'parts-map-key';
        const markerButtons = [];
        const popover = document.createElement('aside');
        popover.className = 'parts-map-popover';
        popover.hidden = true;
        popover.setAttribute('role', 'dialog');
        const popoverHeading = document.createElement('h4');
        const popoverText = document.createElement('p');
        const closePopover = document.createElement('button');
        closePopover.type = 'button';
        closePopover.className = 'parts-map-popover-close';
        closePopover.textContent = 'Cerrar';
        closePopover.addEventListener('click', () => {
          popover.hidden = true;
          markerButtons.forEach(({ mapButton, keyButton }) => {
            mapButton.setAttribute('aria-expanded', 'false');
            keyButton.setAttribute('aria-expanded', 'false');
          });
        });
        popover.append(popoverHeading, popoverText, closePopover);
        visual.appendChild(popover);

        const selectMarker = (marker, selectedButton) => {
          description.textContent = 'Marcador seleccionado: consulta la descripción en la ventana junto al punto.';
          popoverHeading.textContent = marker.nombre;
          popoverText.textContent = marker.descripcion;
          popover.style.left = `${marker.x <= 55 ? Math.min(marker.x + 3, 60) : Math.max(marker.x - 3, 40)}%`;
          popover.style.top = `${Math.max(28, Math.min(marker.y, 72))}%`;
          popover.classList.toggle('parts-map-popover-left', marker.x > 55);
          popover.hidden = false;
          markerButtons.forEach(({ mapButton, keyButton }) => {
            const selected = mapButton === selectedButton || keyButton === selectedButton;
            mapButton.setAttribute('aria-pressed', String(selected));
            keyButton.setAttribute('aria-pressed', String(selected));
            mapButton.setAttribute('aria-expanded', String(selected));
            keyButton.setAttribute('aria-expanded', String(selected));
          });
        };

        marcadores.forEach((marker, markerIndex) => {
          const markerButton = document.createElement('button');
          markerButton.type = 'button';
          markerButton.className = 'parts-map-marker';
          markerButton.style.left = `${marker.x}%`;
          markerButton.style.top = `${marker.y}%`;
          markerButton.textContent = String(markerIndex + 1);
          markerButton.setAttribute('aria-label', marker.nombre);
          markerButton.setAttribute('aria-pressed', 'false');
          markerButton.setAttribute('aria-expanded', 'false');
          markerButton.setAttribute('aria-controls', `parts-map-popover-${index}`);

          const listItem = document.createElement('li');
          const keyButton = document.createElement('button');
          keyButton.type = 'button';
          keyButton.textContent = marker.nombre;
          keyButton.setAttribute('aria-pressed', 'false');
          keyButton.setAttribute('aria-expanded', 'false');
          keyButton.setAttribute('aria-controls', `parts-map-popover-${index}`);
          markerButtons.push({ mapButton: markerButton, keyButton });
          markerButton.addEventListener('click', () => selectMarker(marker, markerButton));
          keyButton.addEventListener('click', () => selectMarker(marker, keyButton));
          listItem.appendChild(keyButton);
          visual.appendChild(markerButton);
          key.appendChild(listItem);
        });

        popover.id = `parts-map-popover-${index}`;
        visual.prepend(image);
        const caption = document.createElement('figcaption');
        caption.textContent = 'Marcadores orientativos de zonas externas; no es un despiece ni una guía de desmontaje.';
        figure.append(visual, description, key, caption);
        article.appendChild(figure);
      }

      articleContainer.appendChild(article);
    });
    if (initialSectionIndex > 0) {
      const targetSection = functionDocumentContent.querySelector(
        `[data-section-index="${initialSectionIndex}"]`
      );
      targetSection?.scrollIntoView({ block: 'start' });
    }
    functionDocumentSearch.disabled = false;
    filterFunctionDocument();
    if (!sections.length) {
      functionDocumentStatus.textContent = 'Este archivo todavía no tiene secciones cargadas.';
    }
  } catch (error) {
    console.error(error);
    functionDocumentSearch.disabled = true;
    functionDocumentStatus.textContent = 'No se pudo cargar este documento. Revisa que el archivo JSON exista y tenga el formato esperado.';
  }
}

functionDocumentSearch.addEventListener('input', filterFunctionDocument);
document.getElementById('functionDialogClose').addEventListener('click', () => functionDialog.close());

const lawDialog = document.getElementById('lawDialog');
const lawArticles = document.getElementById('lawArticles');
const lawArticleSearch = document.getElementById('lawArticleSearch');
const lawArticleStatus = document.getElementById('lawArticleStatus');
let currentLawArticles = [];
let currentLawTitle = '';

function renderLawArticles() {
  const query = normalizeText(lawArticleSearch.value.trim());
  const filtered = currentLawArticles.filter(article =>
    normalizeText(`${article.number} ${article.title} ${article.text}`).includes(query)
  );
  lawArticles.replaceChildren();

  filtered.forEach(article => {
    const item = document.createElement('article');
    item.className = 'law-article';
    const header = document.createElement('div');
    header.className = 'law-article-header';
    const title = document.createElement('h3');
    const articleTitle = formatArticleTitle(article.number, article.title);
    title.textContent = articleTitle;
    header.appendChild(title);
    const pinButton = createPinButton({
      id: `law-${normalizeText(currentLawTitle)}-${article.number}`,
      type: 'LEY',
      title: `${currentLawTitle}: ${articleTitle}`,
      text: article.text
    }, articleTitle);
    const actions = document.createElement('div');
    actions.className = 'law-article-actions';
    actions.append(pinButton, createShareImageButton(articleTitle, article.text));
    header.appendChild(actions);
    const text = document.createElement('p');
    text.textContent = article.text;
    item.append(header, text);
    lawArticles.appendChild(item);
  });

  lawArticleStatus.textContent = filtered.length
    ? `${filtered.length} artículo${filtered.length === 1 ? '' : 's'}`
    : 'No se encontraron artículos.';
}

async function openLaw(law, initialArticle = '') {
  currentLawTitle = law.titulo;
  document.getElementById('lawDialogTitle').textContent = law.titulo;
  document.getElementById('lawDialogSubtitle').textContent = law.subtitulo;
  document.getElementById('lawDialogDescription').textContent = law.descripcion;
  lawArticleSearch.value = initialArticle;
  lawArticleSearch.disabled = true;
  lawArticleStatus.textContent = 'Cargando artículos...';
  lawArticles.replaceChildren();
  lawDialog.showModal();

  try {
    currentLawArticles = law.articulos;
    lawArticleSearch.disabled = false;
    renderLawArticles();
  } catch (error) {
    console.error(error);
    currentLawArticles = [];
    lawArticleStatus.textContent = 'No se pudieron mostrar los artículos. Verifica el formato del archivo de la ley.';
  }
}

lawArticleSearch.addEventListener('input', renderLawArticles);
document.getElementById('lawDialogClose').addEventListener('click', () => lawDialog.close());

function updateKeyPractice(items) {
  const query = document.getElementById('searchInput').value.trim();
  keyPracticeLaunch.hidden = !(currentPage === 'function' &&
    currentFilter &&
    currentFilter !== 'RADIO' &&
    !showingAlphabet &&
    !query &&
    items.length > 0);
}

keyPracticeLaunch.addEventListener('click', () => {
  openPromoCatalog();
});

function renderCards(items) {
  const container = document.getElementById('cardsContainer');
  const noResults = document.getElementById('noResults');
  const resultsPanel = document.getElementById('resultsPanel');
  updateKeyPractice(items);
  container.innerHTML = '';
  resultsPanel.hidden = items.length === 0 &&
    !document.getElementById('searchInput').value.trim() &&
    !currentFilter &&
    !showingAlphabet;

  if (items.length === 0) {
    noResults.style.display = resultsPanel.hidden ? 'none' : 'block';
    return;
  }

  resultsPanel.hidden = false;
  noResults.style.display = 'none';

  const pinnedItems = getPinnedItems();

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';

    const itemId = `key-${item.cat}-${item.num}-${normalizeText(item.title)}`;
    const isPinned = pinnedItems.some(p => p.id === itemId);

    card.innerHTML = `
      <div class="item-num">${item.num}</div>
      <div class="item-info">
        <div class="item-category">${item.cat} • ${item.group}</div>
        <div class="item-title">${item.title}</div>
      </div>
      <button type="button" class="btn-pin ${isPinned ? 'pinned' : ''}" style="margin-left: auto;" aria-label="${isPinned ? 'Desfijar' : 'Fijar'} ${item.title}" aria-pressed="${isPinned}">
        <svg class="icon pin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z"></path>
        </svg>
      </button>
    `;

    const pinBtn = card.querySelector('.btn-pin');
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pinObj = {
        id: itemId,
        type: 'CLAVE',
        title: `${item.cat} (${item.num}): ${item.title}`,
        text: `Categoría: ${item.cat} | Grupo: ${item.group}`
      };
      togglePin(pinObj);
      const currentlyPinned = getPinnedItems().some(p => p.id === itemId);
      pinBtn.classList.toggle('pinned', currentlyPinned);
      pinBtn.setAttribute('aria-label', `${currentlyPinned ? 'Desfijar' : 'Fijar'} ${item.title}`);
      pinBtn.setAttribute('aria-pressed', String(currentlyPinned));
    });

    container.appendChild(card);
  });
}

function renderSearchResults(heading, results) {
  const container = document.getElementById('cardsContainer');
  const noResults = document.getElementById('noResults');
  const resultsPanel = document.getElementById('resultsPanel');
  const phoneticTable = document.getElementById('phoneticTable');
  keyPracticeLaunch.hidden = true;
  container.replaceChildren();
  container.hidden = false;
  phoneticTable.hidden = true;
  resultsPanel.hidden = false;
  document.getElementById('resultsHeading').textContent = heading;
  noResults.textContent = 'No se encontraron coincidencias en esta sección.';
  noResults.style.display = results.length ? 'none' : 'block';

  results.forEach(result => {
    const card = document.createElement('article');
    card.className = 'search-result-card';
    if (result.label) {
      const label = document.createElement('span');
      label.className = 'item-category';
      label.textContent = result.label;
      card.appendChild(label);
    }

    if (result.pinItem) {
      card.appendChild(createPinButton(result.pinItem, result.pinTitle));
    }

    const title = document.createElement('h3');
    title.textContent = result.title;
    const text = document.createElement('p');
    text.textContent = result.text;
    card.append(title, text);

    if (result.action) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'search-result-action';
      button.textContent = result.action.label;
      button.addEventListener('click', result.action.onClick);
      card.appendChild(button);
    }

    if (result.link) {
      const linkUrl = safeHttpUrl(result.link, document.baseURI);
      if (linkUrl) {
        const link = document.createElement('a');
        link.className = 'news-link';
        link.href = linkUrl;
        link.textContent = 'Leer noticia';
        if (new URL(linkUrl).origin !== window.location.origin) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        card.appendChild(link);
      }
    }

    container.appendChild(card);
  });
}

function getSearchTerms(query) {
  return normalizeText(query)
    .split(/\s+/)
    .filter(term => term && !['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'en', 'por', 'para', 'art', 'articulo', 'articulos', 'ley'].includes(term));
}

function searchNews(query) {
  const terms = getSearchTerms(query);
  const results = newsItems
    .filter(item => terms.every(term =>
      normalizeText(`${item.titulo} ${item.fecha} ${item.descripcion} ${item.contenido || ''}`).includes(term)
    ))
    .map(item => ({
      label: `Noticia • ${item.fecha}`,
      title: item.titulo,
      text: item.descripcion,
      link: `page/news.html?id=${encodeURIComponent(item.id)}`
    }));
  renderSearchResults('Resultados de noticias', results);
}

function articleNumberFromQuery(query) {
  return normalizeText(query).match(/\b(?:art(?:iculo)?\.?\s*)?(\d+[a-z]?)\b/i)?.[1] || null;
}

function lawMatchesHint(law, terms) {
  const lawText = normalizeText(`${law.titulo} ${law.subtitulo} ${law.descripcion}`);
  return terms.every(term => {
    if (term === 'transito' || term === 'transporte') {
      return lawText.includes('transito') || lawText.includes('transporte') || lawText.includes('vial');
    }
    if (term === 'intt') {
      return lawText.includes('intt') || lawText.includes('transporte terrestre');
    }
    return lawText.includes(term);
  });
}

function searchLaws(query) {
  const number = articleNumberFromQuery(query);
  const hintTerms = getSearchTerms(query).filter(term => !/^\d+[a-z]?$/.test(term));
  const lawsWithHint = hintTerms.length
    ? lawItems.filter(law => lawMatchesHint(law, hintTerms))
    : lawItems;
  const selectedLaws = lawsWithHint.length || !number ? lawsWithHint : lawItems;
  const terms = getSearchTerms(query);
  const results = [];

  selectedLaws.forEach(law => {
    law.articulos.forEach(article => {
      const exactNumber = number && normalizeText(article.number) === number;
      const textMatches = terms.every(term =>
        normalizeText(`${article.number} ${article.title} ${article.text} ${law.titulo}`).includes(term)
      );
      if ((number && exactNumber) || (!number && textMatches)) {
        results.push({
          label: law.titulo,
          title: formatArticleTitle(article.number, article.title),
          text: article.text,
          pinItem: {
            id: `law-${normalizeText(law.titulo)}-${article.number}`,
            type: 'LEY',
            title: `${law.titulo}: ${formatArticleTitle(article.number, article.title)}`,
            text: article.text
          },
          pinTitle: formatArticleTitle(article.number, article.title),
          action: {
            label: 'Abrir artículo',
            onClick: () => openLaw(law, article.number)
          }
        });
      }
    });
  });

  renderSearchResults(`Resultados de leyes para “${query}”`, results);
}

function searchTermMatchesText(text, term) {
  const words = normalizeText(text).split(/\s+/);
  return words.some(word =>
    word === term ||
    (term.length >= 4 && word.startsWith(term))
  );
}

function searchFunction(query) {
  const terms = getSearchTerms(query);
  const matchingKeys = [...data, ...radioData].filter(item => {
    const matchesCategory = !currentFilter || item.cat === currentFilter;
    return matchesCategory && terms.every(term =>
      normalizeText(`${item.cat} ${item.group} ${item.num} ${item.title}`).includes(term)
    );
  });

  if (matchingKeys.length) {
    document.getElementById('resultsHeading').textContent = 'Resultados de función policial';
    showView('keys');
    document.getElementById('cardsContainer').hidden = false;
    document.getElementById('phoneticTable').hidden = true;
    renderCards(matchingKeys);
    if (!matchingKeys.length) {
      document.getElementById('noResults').textContent = 'No se encontraron claves en esta categoría.';
      document.getElementById('noResults').style.display = 'block';
    }
    return;
  }

  const results = [];
  functionResources.forEach(resource => {
    if (resource.tipo === 'claves') return;

    const sections = Array.isArray(resource.categoria)
      ? getDocumentSections(resource).map(section => ({ titulo: section.title, contenido: section.text }))
      : resource.secciones || [];
    const resourceTitle = `${resource.titulo} ${resource.subtitulo || ''}`;
    const resourceMatches = terms.every(term => searchTermMatchesText(resourceTitle, term));
    if (resourceMatches) {
      const firstSection = sections[0];
      results.push({
        label: resource.tipo,
        title: resource.titulo,
        text: resource.subtitulo || resource.descripcion || '',
        pinItem: firstSection ? {
          id: `function-${normalizeText(resource.titulo)}-0`,
          type: 'FUNCIÓN',
          title: `${resource.titulo}: ${firstSection.titulo || 'Sección 1'}`,
          text: firstSection.contenido || ''
        } : undefined,
        pinTitle: firstSection?.titulo || resource.titulo,
        action: {
          label: 'Abrir material',
          onClick: () => openFunctionResource(resource)
        }
      });
      return;
    }

    const matchingSections = sections.filter(section => {
      const sectionText = `${section.titulo || ''} ${section.contenido || ''}`;
      return terms.every(term =>
        searchTermMatchesText(resourceTitle, term) || searchTermMatchesText(sectionText, term)
      );
    });

    matchingSections.forEach(section => {
      const sectionIndex = sections.indexOf(section);
      const sectionTitle = section.titulo || `Sección ${sectionIndex + 1}`;
      results.push({
        label: resource.titulo,
        title: section.titulo || resource.titulo,
        text: section.contenido || '',
        pinItem: {
          id: `function-${normalizeText(resource.titulo)}-${sectionIndex}`,
          type: 'FUNCIÓN',
          title: `${resource.titulo}: ${sectionTitle}`,
          text: section.contenido || ''
        },
        pinTitle: sectionTitle,
        action: {
          label: 'Abrir material',
          onClick: () => openFunctionResource(resource, sectionIndex)
        }
      });
    });

  });

  renderSearchResults(`Resultados de función policial para “${query}”`, results);
}

function handleGlobalSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) {
    if (showingAlphabet) {
      showView('keys');
      renderAlphabet();
    } else if (currentFilter) {
      showView('keys');
      filterData();
    } else {
      showView(currentPage);
      renderCards([]);
    }
    return;
  }

  if (currentPage === 'function' && showingAlphabet) {
    showView('keys');
    renderAlphabet(normalizeText(query));
    return;
  }

  showView('search');
  if (currentPage === 'home') {
    searchNews(query);
  } else if (currentPage === 'laws') {
    searchLaws(query);
  } else {
    searchFunction(query);
  }
}

function refreshCurrentSearch() {
  if (document.getElementById('searchInput').value.trim()) {
    handleGlobalSearch();
  }
}

function filterData() {
  const query = normalizeText(document.getElementById('searchInput').value.trim());

  if (showingAlphabet) {
    renderAlphabet(query);
    return;
  }

  if (!query && !currentFilter) {
    renderCards([]);
    return;
  }

  const searchableData = currentFilter === 'RADIO'
    ? radioData
    : currentFilter
      ? data
      : [...data, ...radioData];
  const filtered = searchableData.filter(item => {
    const matchesCat = (!currentFilter || item.cat === currentFilter);
    const matchesQuery = normalizeText(item.title).includes(query) ||
                         normalizeText(item.num).includes(query) ||
                         normalizeText(item.group).includes(query) ||
                         normalizeText(`${item.cat} ${item.num}`).includes(query) ||
                         normalizeText(`${item.title} ${item.num}`).includes(query);

    return matchesCat && matchesQuery;
  });

  document.getElementById('resultsHeading').textContent = currentFilter
    ? `Resultados: ${currentFilter === 'RADIO' ? 'Claves radio' : currentFilter}`
    : 'Resultados de búsqueda';
  renderCards(filtered);
}

function setFilter(cat) {
  currentPage = 'function';
  currentFilter = cat;
  showingAlphabet = false;
  updateSearchPlaceholder();
  showView('keys');
  document.getElementById('searchInput').value = '';
  document.getElementById('cardsContainer').hidden = false;
  document.getElementById('phoneticTable').hidden = true;
  document.getElementById('sectionMenu').classList.remove('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', 'false');
  filterData();
}

function renderAlphabet(query = '') {
  const tableBody = document.getElementById('phoneticTableBody');
  const table = document.getElementById('phoneticTable');
  const cards = document.getElementById('cardsContainer');
  const noResults = document.getElementById('noResults');
  const resultsPanel = document.getElementById('resultsPanel');
  keyPracticeLaunch.hidden = true;
  const filteredAlphabet = phoneticAlphabet.filter(([letter, code]) =>
    normalizeText(`${letter} ${code}`).includes(query)
  );

  document.getElementById('resultsHeading').textContent = 'Alfabeto fonético';
  cards.hidden = true;
  table.hidden = false;
  resultsPanel.hidden = false;
  tableBody.innerHTML = '';

  filteredAlphabet.forEach(([letter, code]) => {
    const row = document.createElement('tr');
    const letterCell = document.createElement('td');
    const codeCell = document.createElement('td');
    letterCell.textContent = letter;
    codeCell.textContent = code;
    row.append(letterCell, codeCell);
    tableBody.appendChild(row);
  });

  noResults.style.display = filteredAlphabet.length ? 'none' : 'block';
}

function showAlphabet() {
  currentPage = 'function';
  currentFilter = null;
  showingAlphabet = true;
  updateSearchPlaceholder();
  showView('keys');
  document.getElementById('searchInput').value = '';
  document.getElementById('sectionMenu').classList.remove('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', 'false');
  renderAlphabet();
}

document.getElementById('functionView').addEventListener('click', event => {
  const toggle = event.target.closest('[data-function-keys-toggle]');
  if (toggle) {
    const options = document.getElementById(toggle.getAttribute('aria-controls'));
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isExpanded));
    options.hidden = isExpanded;
    return;
  }

  const button = event.target.closest('[data-filter], [data-action="alphabet"]');
  if (!button) return;

  if (button.dataset.filter) {
    setFilter(button.dataset.filter);
  } else {
    showAlphabet();
  }
});

const promoCatalogOpen = document.getElementById('promoCatalogOpen');
const promoCatalogBack = document.getElementById('promoCatalogBack');
const promoCatalogView = document.getElementById('promoCatalogView');
const functionMaterialSection = document.getElementById('functionMaterialSection');

function openPromoCatalog() {
  currentPage = 'function';
  currentFilter = null;
  showingAlphabet = false;
  document.getElementById('searchInput').value = '';
  updateSearchPlaceholder();
  showView('function');
  document.getElementById('sectionMenu').classList.remove('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', 'false');
  keyPracticeLaunch.hidden = true;
  promoCatalogView.hidden = false;
  functionMaterialSection.hidden = true;
  promoCatalogOpen.hidden = true;
  promoCatalogOpen.setAttribute('aria-expanded', 'true');
  document.getElementById('promoCatalogHeading').focus();
}

promoCatalogOpen.addEventListener('click', openPromoCatalog);

promoCatalogBack.addEventListener('click', () => {
  promoCatalogView.hidden = true;
  functionMaterialSection.hidden = false;
  promoCatalogOpen.hidden = false;
  promoCatalogOpen.setAttribute('aria-expanded', 'false');
  promoCatalogOpen.focus();
});

if (new URLSearchParams(window.location.search).get('promos') === '1') {
  openPromoCatalog();
}

document.getElementById('menuToggle').addEventListener('click', () => {
  const menu = document.getElementById('sectionMenu');
  const isOpen = menu.classList.toggle('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', String(isOpen));
});

async function loadGuides() {
  const guideLinks = document.getElementById('guideLinks');
  if (!guideLinks) return;

  guideLinks.replaceChildren();
  let guideCount = 0;

  for (let index = 1; ; index += 1) {
    const filename = `file/guias/guia_${String(index).padStart(2, '0')}.json`;
    let response;
    try {
      response = await fetch(filename, { cache: 'no-cache' });
    } catch (error) {
      console.error(`No se pudo cargar ${filename}.`, error);
      guideLinks.textContent = 'No se pudieron cargar las guías.';
      return;
    }

    if (response.status === 404) break;
    if (!response.ok) {
      console.error(`No se pudo cargar ${filename}: HTTP ${response.status}.`);
      guideLinks.textContent = 'No se pudieron cargar las guías.';
      return;
    }

    let guide;
    try {
      guide = await response.json();
    } catch (error) {
      console.error(`${filename} no contiene JSON válido.`, error);
      guideLinks.textContent = `Revisa el archivo ${filename}.`;
      return;
    }

    if (
      !guide ||
      typeof guide !== 'object' ||
      Array.isArray(guide) ||
      typeof guide.titulo !== 'string' ||
      typeof guide.enlace !== 'string' ||
      (!guide.titulo.trim() && !guide.enlace.trim())
    ) {
      continue;
    }

    if (!guide.titulo.trim() || !guide.enlace.trim()) {
      console.error(`${filename} debe incluir "titulo" y "enlace".`);
      guideLinks.textContent = `Completa "titulo" y "enlace" en ${filename}.`;
      return;
    }

    let url;
    try {
      url = new URL(guide.enlace, document.baseURI);
    } catch (error) {
      console.error(`${filename} contiene un enlace inválido.`, error);
      guideLinks.textContent = `Revisa el enlace en ${filename}.`;
      return;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      console.error(`${filename} debe usar un enlace HTTP o HTTPS.`);
      guideLinks.textContent = `Revisa el enlace en ${filename}.`;
      return;
    }

    const link = document.createElement('a');
    link.className = 'menu-support-link';
    link.href = url.href;
    link.textContent = guide.titulo.trim();
    guideLinks.appendChild(link);
    guideCount += 1;
  }

  if (guideCount === 0) {
    guideLinks.textContent = 'Aún no hay guías disponibles.';
  }
}

const welcomeDialog = document.getElementById('welcomeDialog');
const welcomeClose = document.getElementById('welcomeClose');
let welcomeTimeout;

const appDesktopViewport = window.matchMedia('(min-width: 768px)');
const nonCopyableContent = '.app-main, #lawArticles, #functionDocumentContent';

document.addEventListener('copy', event => {
  if (event.target instanceof Element && event.target.closest(nonCopyableContent)) {
    event.preventDefault();
  }
});

document.addEventListener('contextmenu', event => {
  if (event.target instanceof Element && event.target.closest(nonCopyableContent)) {
    event.preventDefault();
  }
});

document.addEventListener('dragstart', event => {
  if (event.target instanceof HTMLImageElement && event.target.closest(nonCopyableContent)) {
    event.preventDefault();
  }
});

function showWelcomeDialog() {
  if (!welcomeDialog || !welcomeClose || appDesktopViewport.matches || localStorage.getItem('learncpnbWelcomeSeen')) {
    return;
  }

  localStorage.setItem('learncpnbWelcomeSeen', 'true');
  welcomeDialog.showModal();
  welcomeTimeout = window.setTimeout(() => {
    if (welcomeDialog.open) welcomeDialog.close();
  }, 15000);

  welcomeClose.addEventListener('click', () => welcomeDialog.close());
  welcomeDialog.addEventListener('close', () => window.clearTimeout(welcomeTimeout), { once: true });
}

document.addEventListener('click', event => {
  const menu = document.getElementById('sectionMenu');
  const menuToggle = document.getElementById('menuToggle');
  if (
    menu.classList.contains('open') &&
    !menu.contains(event.target) &&
    !menuToggle.contains(event.target)
  ) {
    menu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
});

const infoDialog = document.getElementById('infoDialog');
const infoDialogTitle = document.getElementById('infoDialogTitle');
const infoDialogMessage = document.getElementById('infoDialogMessage');
const termsDocumentDownload = document.getElementById('termsDocumentDownload');
let termsCountdownInterval;

function showInfoDialog(title, message) {
  document.getElementById('sectionMenu').classList.remove('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', 'false');
  infoDialogTitle.textContent = title;
  infoDialogMessage.textContent = message;
  infoDialog.showModal();
}

document.getElementById('termsButton').addEventListener('click', () => {
  window.clearInterval(termsCountdownInterval);
  showInfoDialog('Terminos de app', 'Términos de la Página');
  termsDocumentDownload.hidden = true;

  const countdown = document.createElement('p');
  countdown.className = 'terms-countdown';
  countdown.setAttribute('role', 'status');
  countdown.setAttribute('aria-live', 'polite');
  let secondsRemaining = 3;
  countdown.textContent = `La descarga comenzará en ${secondsRemaining} segundos...`;
  infoDialogMessage.appendChild(countdown);

  termsCountdownInterval = window.setInterval(() => {
    secondsRemaining -= 1;
    if (secondsRemaining > 0) {
      countdown.textContent = `La descarga comenzará en ${secondsRemaining} segundo${secondsRemaining === 1 ? '' : 's'}...`;
      return;
    }

    window.clearInterval(termsCountdownInterval);
    countdown.textContent = 'Descarga iniciada. Si no comenzó, usa el enlace de abajo.';
    termsDocumentDownload.hidden = false;
    termsDocumentDownload.click();
  }, 1000);
});

document.getElementById('infoDialogClose').addEventListener('click', () => {
  infoDialog.close();
});
infoDialog.addEventListener('close', () => window.clearInterval(termsCountdownInterval));

// Modal de elementos fijados
const pinnedDialog = document.getElementById('pinnedDialog');
const pinnedListContainer = document.getElementById('pinnedListContainer');
const openPinnedButton = document.getElementById('openPinnedButton');
const pinnedDialogClose = document.getElementById('pinnedDialogClose');

function renderPinnedModal() {
  pinnedListContainer.replaceChildren();
  const pinnedItems = getPinnedItems();
  const archivedPromos = getArchivedPromos();

  const archivedHeading = document.createElement('h3');
  archivedHeading.className = 'saved-items-heading';
  archivedHeading.textContent = 'Actividades archivadas';
  pinnedListContainer.appendChild(archivedHeading);
  if (!archivedPromos.length) {
    const emptyArchived = document.createElement('p');
    emptyArchived.className = 'saved-items-empty';
    emptyArchived.textContent = 'No tienes actividades archivadas.';
    pinnedListContainer.appendChild(emptyArchived);
  } else {
    archivedPromos
      .slice()
      .sort((first, second) => Date.parse(second.archivedAt) - Date.parse(first.archivedAt))
      .forEach(promo => {
        const card = document.createElement('article');
        card.className = 'article-result saved-promo-card';
        const type = document.createElement('p');
        type.className = 'saved-promo-type';
        type.textContent = 'Actividad completada';
        const title = document.createElement('h2');
        title.textContent = promo.title;
        const description = document.createElement('p');
        description.textContent = promo.description;
        card.append(type, title, description);
        if (promo.fecha) {
          const date = document.createElement('time');
          date.className = 'saved-promo-date';
          date.textContent = promo.fecha;
          card.appendChild(date);
        }
        pinnedListContainer.appendChild(card);
      });
  }

  const pinnedHeading = document.createElement('h3');
  pinnedHeading.className = 'saved-items-heading';
  pinnedHeading.textContent = 'Elementos fijados';
  pinnedListContainer.appendChild(pinnedHeading);
  if (!pinnedItems.length) {
    const emptyPinned = document.createElement('p');
    emptyPinned.className = 'saved-items-empty';
    emptyPinned.textContent = 'No tienes elementos fijados.';
    pinnedListContainer.appendChild(emptyPinned);
    return;
  }

  pinnedItems.forEach(item => {
    const card = document.createElement('article');
    card.className = 'article-result';
    card.innerHTML = `
      <div style="font-size:0.75rem; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">${item.type}</div>
      <h2>${item.title}</h2>
      <p>${item.text}</p>
      <button type="button" class="btn-pin pinned" aria-label="Desfijar ${item.title}" aria-pressed="true">
        <svg class="icon pin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z"></path>
        </svg>
      </button>
    `;

    card.querySelector('.btn-pin').addEventListener('click', () => {
      togglePin(item);
      renderPinnedModal();
    });

    pinnedListContainer.appendChild(card);
  });
}

if (openPinnedButton) {
  openPinnedButton.addEventListener('click', () => {
    document.getElementById('sectionMenu').classList.remove('open');
    document.getElementById('menuToggle').setAttribute('aria-expanded', 'false');
    renderPinnedModal();
    pinnedDialog.showModal();
  });
}

if (pinnedDialogClose) {
  pinnedDialogClose.addEventListener('click', () => {
    pinnedDialog.close();
  });
}

document.getElementById('searchInput').addEventListener('input', () => {
  handleGlobalSearch();
});

renderCards([]);
const requestedView = new URLSearchParams(window.location.search).get('view') || window.location.hash.slice(1);
const initialView = ['home', 'laws', 'function'].includes(requestedView) ? requestedView : 'home';
currentPage = initialView;
showView(initialView);
updateSearchPlaceholder();
const initialSearch = new URLSearchParams(window.location.search).get('search');
if (initialSearch) {
  document.getElementById('searchInput').value = initialSearch;
  handleGlobalSearch();
}

function collectImageUrls(value, urls) {
  if (!value || typeof value !== 'object') return;

  Object.entries(value).forEach(([key, entry]) => {
    if (
      typeof entry === 'string' &&
      /^(?:img|image|imagen|src)/i.test(key) &&
      entry.trim()
    ) {
      try {
        urls.add(new URL(entry, document.baseURI).href);
      } catch (error) {
        console.error(`La imagen "${entry}" tiene una URL inválida.`, error);
      }
    } else {
      collectImageUrls(entry, urls);
    }
  });
}

function preloadImage(url) {
  return new Promise(resolve => {
    const image = new Image();
    let settled = false;
    const timeout = window.setTimeout(() => settle(true), 12000);
    const settle = failed => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (failed) console.warn(`No se pudo cargar la imagen: ${url}`);
      resolve();
    };

    image.addEventListener('load', () => settle(false), { once: true });
    image.addEventListener('error', () => settle(true), { once: true });
    image.src = url;
    if (image.complete) settle(!image.naturalWidth);
  });
}

async function loadApplication() {
  const loadingScreen = document.getElementById('loadingScreen');
  const appMain = document.querySelector('.app-main');
  if (!loadingScreen || !appMain) {
    throw new Error('No se encontró la ventana de carga o el contenido principal.');
  }

  await Promise.all([
    loadNews(),
    loadLaws(),
    loadFunctionResources(),
    loadGuides()
  ]);

  const imageUrls = new Set(
    Array.from(document.querySelectorAll('img:not([loading="lazy"])'))
      .map(image => image.currentSrc || image.src)
      .filter(Boolean)
  );
  collectImageUrls([newsItems, functionResources], imageUrls);
  await Promise.all(Array.from(imageUrls, preloadImage));

  loadingScreen.classList.add('is-hidden');
  loadingScreen.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-loading');
  appMain.setAttribute('aria-busy', 'false');
  window.setTimeout(() => {
    loadingScreen.hidden = true;
    showWelcomeDialog();
  }, 320);
}

loadApplication().catch(error => {
  console.error('No se pudo completar la carga inicial de la aplicación.', error);
  const loadingMessage = document.querySelector('.loading-message');
  if (loadingMessage) loadingMessage.textContent = 'No se pudieron cargar todos los recursos. Intenta actualizar la página.';
});
