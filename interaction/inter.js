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
let promoCatalogLoaded = false;
let promoCatalogLoadPromise = null;
let lawItems = [];
let functionResources = [];
let newsItemsLoaded = false;
let lawItemsLoaded = false;
let functionResourcesLoaded = false;
let newsLoadPromise = null;
let lawsLoadPromise = null;
let functionResourcesLoadPromise = null;
const keyPracticeLaunch = document.getElementById('keyPracticeLaunch');
const normalizeText = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const practiceLivesStorageKey = 'learncpnb-practice-lives';
const maxPracticeLives = 5;
let practiceLivesRefreshTimeout;
let practiceRoutePromotions = [];
const prefetchedPracticeIds = new Set();
let initialPracticePrefetchStarted = false;
const practiceActivityDialog = document.getElementById('practiceActivityDialog');
const practiceActivityFrame = document.getElementById('practiceActivityFrame');
let practiceActivityReturnFocus;

function openPracticeActivity(promoId, title, keyPractice = false) {
  const savedCompletedPromos = localStorage.getItem('learncpnb-completed-promos-v2');
  const completedPromoIds = savedCompletedPromos ? JSON.parse(savedCompletedPromos) : [];
  if (
    !Array.isArray(completedPromoIds) ||
    completedPromoIds.some(id => !Number.isSafeInteger(id) || id < 1 || id > 999)
  ) {
    throw new Error('El registro de actividades completadas no es válido.');
  }

  const firstIncomplete = practiceRoutePromotions.find(
    practice => !completedPromoIds.includes(practice.promoId)
  );
  if (
    (keyPractice && firstIncomplete) ||
    (!keyPractice && (
      !Number.isSafeInteger(promoId) ||
      firstIncomplete?.promoId !== promoId ||
      completedPromoIds.includes(promoId)
    ))
  ) {
    document.getElementById('practiceMapStatus').textContent =
      'Completa el escudo disponible para desbloquear la siguiente actividad.';
    return;
  }

  const params = new URLSearchParams();
  params.set('embedded', '1');
  sessionStorage.setItem(
    'learncpnb-practice-route-v1',
    JSON.stringify(practiceRoutePromotions.map(practice => practice.promoId))
  );
  if (keyPractice) {
    params.set('practice', 'keys');
    params.set('routeIds', practiceRoutePromotions.map(practice => practice.promoId).join(','));
  } else {
    params.set('id', String(promoId));
    params.set('sectionIds', practiceRoutePromotions.map(practice => practice.promoId).join(','));
    params.set('sectionName', 'Ruta de prácticas');
  }
  const src = `page/promo.html?${params}`;
  if (practiceActivityFrame.dataset.src !== src) {
    practiceActivityFrame.src = src;
    practiceActivityFrame.dataset.src = src;
  }
  document.getElementById('practiceActivityDialogTitle').textContent = title;
  practiceActivityFrame.title = title;
  practiceActivityReturnFocus = document.activeElement;
  if (!practiceActivityDialog.open) practiceActivityDialog.showModal();
}

document.getElementById('practiceActivityDialogClose').addEventListener('click', () => {
  practiceActivityDialog.close();
});
practiceActivityDialog.addEventListener('click', event => {
  if (event.target === practiceActivityDialog) practiceActivityDialog.close();
});
practiceActivityDialog.addEventListener('close', () => {
  practiceActivityReturnFocus?.focus();
});
window.addEventListener('message', event => {
  if (
    event.origin !== window.location.origin ||
    event.source !== practiceActivityFrame.contentWindow ||
    !event.data ||
    !['learncpnb-practice-completed', 'learncpnb-practice-finished'].includes(event.data.type)
  ) return;

  if (promoCatalogLoaded) renderPromoCatalog(promoItems);
  if (event.data.type === 'learncpnb-practice-finished') practiceActivityDialog.close();
});

function updatePracticeLivesIndicator() {
  const indicator = document.getElementById('practiceLivesIndicator');
  const count = document.getElementById('practiceLivesCount');
  if (!indicator || !count) return;

  const saved = localStorage.getItem(practiceLivesStorageKey);
  let state = { lives: maxPracticeLives, cooldownUntil: null };
  if (saved) {
    state = JSON.parse(saved);
    if (
      !state ||
      !Number.isInteger(state.lives) ||
      state.lives < 0 ||
      state.lives > maxPracticeLives ||
      (state.lives === 0 && state.cooldownUntil === null) ||
      (state.lives > 0 && state.cooldownUntil !== null) ||
      (state.cooldownUntil !== null &&
        (!Number.isSafeInteger(state.cooldownUntil) || state.cooldownUntil < 0))
    ) {
      throw new Error('El registro de vidas de práctica no es válido.');
    }
  }

  if (state.cooldownUntil !== null && state.cooldownUntil <= Date.now()) {
    state = { lives: maxPracticeLives, cooldownUntil: null };
    localStorage.setItem(practiceLivesStorageKey, JSON.stringify(state));
  }

  count.textContent = `${state.lives}/${maxPracticeLives}`;
  indicator.setAttribute('aria-label', `Vidas: ${state.lives} de ${maxPracticeLives}`);
  window.clearTimeout(practiceLivesRefreshTimeout);
  if (state.cooldownUntil !== null) {
    practiceLivesRefreshTimeout = window.setTimeout(
      updatePracticeLivesIndicator,
      Math.max(0, state.cooldownUntil - Date.now())
    );
  }
}

function createFunctionResourceIcon(kind) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.classList.add('function-category-icon');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');

  const paths = {
    actas: ['M7 3h7l4 4v14H7z', 'M14 3v5h5', 'M10 12h5', 'M10 16h5'],
    documento: ['M12 2 20 6v5c0 5-3.5 8-8 11-4.5-2-8-6-8-11V6z', 'm9 12 2 2 4-4'],
    claves: ['M12 5a7 7 0 0 1 0 14', 'M12 8a4 4 0 0 1 0 8', 'M12 11a1 1 0 0 1 0 2', 'M5 8 3 6m2 10-2 2'],
    minuta: ['M4 5h16v12H9l-5 4z', 'M8 9h8', 'M8 13h5']
  };
  (paths[kind] || paths.documento).forEach(pathData => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    icon.appendChild(path);
  });
  return icon;
}

function showView(view) {
  const activePage = view === 'keys' || view === 'search' ? currentPage : view;
  document.body.classList.toggle('function-view-active', view === 'function');
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
    loadViewContent(button.dataset.page);
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
  loadViewContent(nextPage);
}, { passive: true });

function loadViewContent(view) {
  if (view === 'home') loadNews();
  else if (view === 'laws') loadLaws();
  else if (view === 'function') {
    loadFunctionResources();
    loadPromoCatalog();
  }
}

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
  const categoriesByName = new Map();
  const cardsByCategory = new Map();

  const savedCompletedPromos = localStorage.getItem('learncpnb-completed-promos-v2');
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
  ).sort((first, second) => first.promoId - second.promoId);
  const orderedPromotions = publishedPromotions;

  const practicePromotions = publishedPromotions.filter(item => {
    const url = safeHttpUrl(item.enlace.trim() || 'page/promo.html', document.baseURI);
    if (!url) return false;
    const destination = new URL(url);
    return destination.origin === window.location.origin &&
      destination.pathname === new URL('page/promo.html', document.baseURI).pathname;
  });
  practiceRoutePromotions = practicePromotions;
  const firstIncompletePromoId = practicePromotions.find(
    item => !completedPromoIds.includes(item.promoId)
  )?.promoId;
  if (!initialPracticePrefetchStarted && firstIncompletePromoId !== undefined) {
    initialPracticePrefetchStarted = true;
    prefetchPracticeActivity(firstIncompletePromoId);
  }
  renderPracticeMap(
    practicePromotions.filter(item => !archivedPromoIds.includes(item.promoId)),
    completedPromoIds,
    firstIncompletePromoId
  );
  const completedPracticeCount = practicePromotions.filter(item =>
    completedPromoIds.includes(item.promoId) && !archivedPromoIds.includes(item.promoId)
  ).length;
  const progressPercent = practicePromotions.length
    ? Math.round((completedPracticeCount / practicePromotions.length) * 100)
    : 0;
  document.getElementById('practiceProgressTrack').setAttribute('aria-valuenow', String(progressPercent));
  document.getElementById('practiceProgressFill').style.width = `${progressPercent}%`;

  orderedPromotions.forEach(item => {
    const promoId = item.promoId;
    if (archivedPromoIds.includes(promoId)) return;
    const categoryName = item.categoria?.trim() || 'Otras actividades';

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
    const isLocked = isPromoActivity && !isCompleted &&
      firstIncompletePromoId !== undefined && promoId !== firstIncompletePromoId;
    const card = document.createElement('article');
    card.className = `promo-catalog-card${isCompleted ? ' promo-catalog-card--completed' : ''}${isLocked ? ' promo-catalog-card--locked' : ''}`;
    const action = document.createElement(isPromoActivity || isCompleted || isLocked ? 'button' : 'a');
    action.className = 'promo-catalog-button';
    if (isPromoActivity || isCompleted || isLocked) {
      action.type = 'button';
      action.disabled = isCompleted || isLocked;
      if (isPromoActivity && !action.disabled) {
        action.addEventListener('click', () => openPracticeActivity(promoId, item.titulo));
      }
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
    label.textContent = isCompleted
      ? 'Actividad completada'
      : isLocked
        ? 'Completa las anteriores'
        : item.textoBoton;
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

    if (!cardsByCategory.has(categoryName)) {
      cardsByCategory.set(categoryName, []);
      categoriesByName.set(categoryName, {
        id: `promo-category-${categoriesByName.size + 1}`,
        title: categoryName
      });
    }
    cardsByCategory.get(categoryName).push(card);
  });

  const keyCategory = 'Claves y códigos policiales';
  const keyPracticeCard = document.createElement('article');
  const keyPracticeUnlocked = firstIncompletePromoId === undefined;
  keyPracticeCard.className = `promo-catalog-card promo-catalog-card--keys${keyPracticeUnlocked ? '' : ' promo-catalog-card--locked'}`;
  const keyPracticeLink = document.createElement('button');
  keyPracticeLink.className = 'promo-catalog-button';
  keyPracticeLink.type = 'button';
  keyPracticeLink.disabled = !keyPracticeUnlocked;
  if (keyPracticeUnlocked) {
    keyPracticeLink.addEventListener('click', () =>
      openPracticeActivity(null, 'Práctica de claves policiales', true)
    );
  }
  const keyPracticeTitle = document.createElement('strong');
  keyPracticeTitle.textContent = 'Práctica de claves policiales';
  const keyPracticeDescription = document.createElement('span');
  keyPracticeDescription.textContent = 'Pon a prueba tu memoria con preguntas aleatorias sobre claves, códigos y significados.';
  const keyPracticeAction = document.createElement('span');
  keyPracticeAction.className = 'promo-catalog-action';
  keyPracticeAction.textContent = keyPracticeUnlocked
    ? 'Practicar'
    : 'Completa todas las anteriores';
  keyPracticeLink.append(keyPracticeTitle, keyPracticeDescription, keyPracticeAction);
  keyPracticeCard.appendChild(keyPracticeLink);
  if (!cardsByCategory.has(keyCategory)) {
    cardsByCategory.set(keyCategory, []);
    categoriesByName.set(keyCategory, {
      id: `promo-category-${categoriesByName.size + 1}`,
      title: keyCategory
    });
  }
  cardsByCategory.get(keyCategory).push(keyPracticeCard);

  cardsByCategory.forEach((cards, categoryName) => {
    if (!cards.length) return;
    const category = categoriesByName.get(categoryName);

    const group = document.createElement('details');
    group.className = 'promo-catalog-group';
    group.dataset.sectionName = categoryName;
    group.open = new URLSearchParams(window.location.search).get('section') === categoryName;
    const summary = document.createElement('summary');
    summary.className = 'promo-catalog-group-summary';
    const title = document.createElement('span');
    title.className = 'promo-catalog-group-title';
    title.textContent = category.title;
    const count = document.createElement('span');
    count.className = 'promo-catalog-group-count';
    count.textContent = `${cards.length} ${cards.length === 1 ? 'actividad' : 'actividades'}`;
    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.classList.add('icon', 'promo-catalog-group-chevron');
    chevron.setAttribute('viewBox', '0 0 24 24');
    chevron.setAttribute('aria-hidden', 'true');
    const chevronPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    chevronPath.setAttribute('d', 'm6 9 6 6 6-6');
    chevron.appendChild(chevronPath);
    summary.append(title, count, chevron);

    const list = document.createElement('div');
    list.className = 'promo-catalog-group-list';
    cards.forEach(card => list.appendChild(card));
    group.append(summary, list);
    container.appendChild(group);
  });

  status.textContent = container.childElementCount
    ? ''
    : 'Aún no hay prácticas disponibles.';
}

function prefetchPracticeActivity(promoId) {
  if (prefetchedPracticeIds.has(promoId)) return;
  prefetchedPracticeIds.add(promoId);
  fetch(`file/news/promo_${String(promoId).padStart(2, '0')}.json`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(activity => {
      sessionStorage.setItem(`learncpnb-practice-content-${promoId}`, JSON.stringify(activity));
    })
    .catch(error => {
      prefetchedPracticeIds.delete(promoId);
      console.warn(`No se pudo anticipar la actividad ${promoId}.`, error);
    });
}

function renderPracticeMap(practices, completedPromoIds, firstIncompletePromoId) {
  const route = document.getElementById('practiceMapRoute');
  const status = document.getElementById('practiceMapStatus');
  if (!route || !status) return;
  const wrapTooltipText = (text, maxLength) => {
    const lines = [];
    text.split(/\s+/).forEach(word => {
      const lastLine = lines[lines.length - 1];
      if (lastLine && `${lastLine} ${word}`.length <= maxLength) {
        lines[lines.length - 1] += ` ${word}`;
      } else {
        lines.push(word);
      }
    });
    return lines;
  };

  const sections = new Map();
  practices.forEach(practice => {
    const name = practice.categoria?.trim() || 'Otras actividades';
    if (!sections.has(name)) sections.set(name, []);
    sections.get(name).push({
      id: practice.promoId,
      title: practice.titulo,
      completed: completedPromoIds.includes(practice.promoId),
      keyPractice: false
    });
  });
  const keyCategory = 'Claves y códigos policiales';
  const keyPractice = {
    id: null,
    title: 'Práctica de claves policiales',
    completed: false,
    keyPractice: true
  };
  if (sections.has(keyCategory)) sections.get(keyCategory).push(keyPractice);
  else sections.set(keyCategory, [keyPractice]);

  route.replaceChildren();
  const namespace = 'http://www.w3.org/2000/svg';
  const width = 500;
  const top = 68;
  const sectionEntries = [...sections.entries()];
  const rowHeights = sectionEntries.map(([, sectionPractices]) =>
    Math.max(150, Math.ceil(sectionPractices.length / 2) * 50 + 70)
  );
  const height = top + rowHeights.reduce((total, rowHeight) => total + rowHeight, 0) + 32;
  const shieldPositions = [260, 400, 260, 400, 260, 400, 260, 400];
  const svg = document.createElementNS(namespace, 'svg');
  svg.classList.add('practice-map-diagram');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-labelledby', 'practiceMapSvgTitle practiceMapSvgDescription');
  const svgTitle = document.createElementNS(namespace, 'title');
  svgTitle.id = 'practiceMapSvgTitle';
  svgTitle.textContent = 'Recorrido de prácticas por secciones';
  const svgDescription = document.createElementNS(namespace, 'desc');
  svgDescription.id = 'practiceMapSvgDescription';
  svgDescription.textContent = 'Cada escudo representa una sección y cada punto una actividad. Los puntos verdes son actividades completadas.';
  svg.append(svgTitle, svgDescription);

  let nextY = top;
  const points = sectionEntries.map(([name, sectionPractices], index) => {
    const point = {
      name,
      practices: sectionPractices,
      x: shieldPositions[index % shieldPositions.length],
      y: nextY,
      rowHeight: rowHeights[index]
    };
    nextY += rowHeights[index];
    return point;
  });
  const roadPath = document.createElementNS(namespace, 'path');
  roadPath.classList.add('practice-map-road');
  const roadCenterPath = document.createElementNS(namespace, 'path');
  roadCenterPath.classList.add('practice-map-road-center');
  let pathData = `M ${points[0].x} ${points[0].y}`;
  points.forEach((point, index) => {
    const nextPoint = points[index + 1] || { x: width / 2, y: point.y + point.rowHeight };
    const controlY = point.rowHeight / 2;
    pathData += ` C ${point.x} ${point.y + controlY}, ${nextPoint.x} ${nextPoint.y - controlY}, ${nextPoint.x} ${nextPoint.y}`;
  });
  roadPath.setAttribute('d', pathData);
  roadCenterPath.setAttribute('d', pathData);
  svg.append(roadPath, roadCenterPath);

  let practiceCount = 0;
  let completedCount = 0;
  points.forEach((point, index) => {
    const { name, practices: sectionPractices } = point;
    practiceCount += sectionPractices.length;
    completedCount += sectionPractices.filter(practice => practice.completed).length;

    const nextPoint = points[index + 1] || { x: width / 2, y: point.y + point.rowHeight };
    const controlY = point.rowHeight / 2;
    const completedInSection = sectionPractices.filter(practice => practice.completed).length;
    const sectionActivity = sectionPractices.find(practice =>
      practice.keyPractice ? firstIncompletePromoId === undefined : practice.id === firstIncompletePromoId
    );
    const sectionUnlocked = Boolean(sectionActivity);
    const sectionCompleted = sectionPractices.every(practice => practice.completed);
    const sectionShield = document.createElementNS(namespace, 'g');
    sectionShield.classList.add('practice-map-section');
    if (sectionCompleted) sectionShield.classList.add('practice-map-section--completed');
    else if (!sectionUnlocked) sectionShield.classList.add('practice-map-section--locked');
    sectionShield.setAttribute('transform', `translate(${point.x} ${point.y})`);
    sectionShield.setAttribute(
      'aria-label',
      sectionCompleted
        ? `${name}: sección completada`
        : `${name}: ${completedInSection} de ${sectionPractices.length} actividades completadas${sectionUnlocked ? ', disponible' : ', bloqueada'}`
    );
    sectionShield.setAttribute('role', 'button');
    sectionShield.setAttribute('tabindex', '0');
    sectionShield.setAttribute('aria-disabled', String(!sectionUnlocked));
    const openSection = () => {
      if (!sectionUnlocked) {
        status.textContent = 'Completa el punto disponible para desbloquear la siguiente actividad.';
        return;
      }
      openPracticeActivity(
        sectionActivity.id,
        sectionActivity.title,
        sectionActivity.keyPractice
      );
    };
    sectionShield.addEventListener('click', openSection);
    sectionShield.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openSection();
      }
    });
    const sectionTooltip = document.createElementNS(namespace, 'g');
    sectionTooltip.classList.add('practice-map-tooltip', 'practice-map-section-tooltip');
    const sectionTitleLines = wrapTooltipText(name, 29);
    const sectionTooltipHeight = sectionTitleLines.length * 13 + 20;
    sectionTooltip.setAttribute('transform', `translate(${point.x < 330 ? point.x + 24 : point.x - 224} ${point.y - sectionTooltipHeight - 8})`);
    const sectionTooltipRect = document.createElementNS(namespace, 'rect');
    sectionTooltipRect.setAttribute('width', '200');
    sectionTooltipRect.setAttribute('height', String(sectionTooltipHeight));
    sectionTooltipRect.setAttribute('rx', '8');
    const sectionTooltipTitle = document.createElementNS(namespace, 'text');
    sectionTooltipTitle.setAttribute('x', '9');
    sectionTooltipTitle.setAttribute('y', '15');
    sectionTitleLines.forEach((line, lineIndex) => {
      const lineElement = document.createElementNS(namespace, 'tspan');
      lineElement.setAttribute('x', '9');
      lineElement.setAttribute('dy', lineIndex ? '12' : '0');
      lineElement.textContent = line;
      sectionTooltipTitle.appendChild(lineElement);
    });
    const sectionTooltipCount = document.createElementNS(namespace, 'text');
    sectionTooltipCount.setAttribute('x', '9');
    sectionTooltipCount.setAttribute('y', String(sectionTooltipHeight - 6));
    sectionTooltipCount.textContent = `${completedInSection}/${sectionPractices.length} completadas`;
    sectionTooltip.append(sectionTooltipRect, sectionTooltipTitle, sectionTooltipCount);
    sectionShield.appendChild(sectionTooltip);
    const shieldHitArea = document.createElementNS(namespace, 'circle');
    shieldHitArea.setAttribute('r', '29');
    shieldHitArea.setAttribute('fill', 'transparent');
    sectionShield.appendChild(shieldHitArea);
    const shieldPath = document.createElementNS(namespace, 'path');
    shieldPath.classList.add('practice-map-shield');
    shieldPath.setAttribute('d', 'M 0 -21 l 17 8 v 10 c 0 11 -7 18 -17 23 -10 -5 -17 -12 -17 -23 v -10 Z');
    shieldPath.setAttribute('transform', 'scale(0.9)');
    sectionShield.appendChild(shieldPath);
    svg.appendChild(sectionShield);

    sectionPractices.forEach((practice, markerIndex) => {
      const progress = (markerIndex + 1) / (sectionPractices.length + 1);
      const inverse = 1 - progress;
      const x = inverse ** 3 * point.x
        + 3 * inverse ** 2 * progress * point.x
        + 3 * inverse * progress ** 2 * nextPoint.x
        + progress ** 3 * nextPoint.x;
      const y = inverse ** 3 * point.y
        + 3 * inverse ** 2 * progress * (point.y + controlY)
        + 3 * inverse * progress ** 2 * (nextPoint.y - controlY)
        + progress ** 3 * nextPoint.y;
      const unlocked = practice.keyPractice ? firstIncompletePromoId === undefined : practice.id === firstIncompletePromoId;
      const marker = document.createElementNS(namespace, 'g');
      marker.classList.add('practice-map-activity');
      if (practice.completed) marker.classList.add('practice-map-activity--completed');
      else if (!unlocked) marker.classList.add('practice-map-activity--locked');
      marker.setAttribute('transform', `translate(${x} ${y})`);
      marker.setAttribute(
        'aria-label',
        practice.completed
          ? `Completada: ${practice.title}`
          : unlocked
            ? `Continuar actividad: ${practice.title}`
            : `Bloqueada: ${practice.title}. Completa las actividades anteriores.`
      );
      marker.setAttribute('role', practice.completed ? 'img' : 'button');
      if (!practice.completed) {
        marker.setAttribute('tabindex', '0');
        marker.setAttribute('aria-disabled', String(!unlocked));
        const open = () => {
          if (!unlocked) {
            status.textContent = 'Completa el punto disponible para desbloquear la siguiente actividad.';
            return;
          }
          openPracticeActivity(practice.id, practice.title, practice.keyPractice);
        };
        marker.addEventListener('click', open);
        marker.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open();
          }
        });
      }
      const markerTooltip = document.createElementNS(namespace, 'g');
      markerTooltip.classList.add('practice-map-tooltip', 'practice-map-activity-tooltip');
      const titleLines = wrapTooltipText(practice.title, 29);
      const markerTooltipHeight = titleLines.length * 13 + 12;
      markerTooltip.setAttribute('transform', `translate(${x < 285 ? x + 14 : x - 214} ${y - markerTooltipHeight - 8})`);
      const markerTooltipRect = document.createElementNS(namespace, 'rect');
      markerTooltipRect.setAttribute('width', '200');
      markerTooltipRect.setAttribute('height', String(markerTooltipHeight));
      markerTooltipRect.setAttribute('rx', '8');
      const markerTooltipText = document.createElementNS(namespace, 'text');
      markerTooltipText.setAttribute('x', '9');
      markerTooltipText.setAttribute('y', '15');
      titleLines.forEach((line, lineIndex) => {
        const lineElement = document.createElementNS(namespace, 'tspan');
        lineElement.setAttribute('x', '9');
        lineElement.setAttribute('dy', lineIndex ? '13' : '0');
        lineElement.textContent = line;
        markerTooltipText.appendChild(lineElement);
      });
      markerTooltip.append(markerTooltipRect, markerTooltipText);
      marker.appendChild(markerTooltip);
      const hitArea = document.createElementNS(namespace, 'circle');
      hitArea.setAttribute('r', '16');
      hitArea.setAttribute('fill', 'transparent');
      marker.appendChild(hitArea);
      const activityPoint = document.createElementNS(namespace, 'circle');
      activityPoint.classList.add('practice-map-point');
      activityPoint.setAttribute('r', '7');
      marker.appendChild(activityPoint);
      svg.appendChild(marker);
    });
  });
  route.appendChild(svg);

  status.textContent = practiceCount
    ? `${sections.size} secciones · ${practiceCount} prácticas · ${completedCount} completadas`
    : 'Aún no hay prácticas disponibles.';
}

async function fetchNumberedJson(folder, prefix, validate) {
  const entries = [];

  const indexResponse = await fetch(`${folder}/${prefix}_index.json`);
  if (indexResponse.ok) {
    let index;
    try {
      index = await indexResponse.json();
    } catch (error) {
      throw new Error(`El índice ${folder}/${prefix}_index.json no contiene JSON válido.`, { cause: error });
    }
    if (
      !index ||
      !Array.isArray(index.ids) ||
      index.ids.some(number => !Number.isSafeInteger(number) || number < 1 || number > 999) ||
      new Set(index.ids).size !== index.ids.length
    ) {
      throw new Error(`El índice ${folder}/${prefix}_index.json no contiene una lista válida de identificadores.`);
    }

    const indexedEntries = await Promise.all([...index.ids]
      .sort((first, second) => first - second)
      .map(async number => {
        const filename = `${prefix}_${String(number).padStart(2, '0')}.json`;
        const response = await fetch(`${folder}/${filename}`);
        if (!response.ok) {
          throw new Error(`No se pudo cargar ${folder}/${filename} (${response.status}).`);
        }
        const entry = await response.json();
        validate(entry, number);
        return entry;
      }));
    return indexedEntries;
  }

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
    (item.categoria !== undefined &&
      (typeof item.categoria !== 'string' || !item.categoria.trim() || item.categoria.trim().length > 80)) ||
    (item.fecha !== undefined && (typeof item.fecha !== 'string' || parsePublicationDate(item.fecha) === null)) ||
    (item.siguiente !== undefined &&
      item.siguiente !== null &&
      (!Number.isSafeInteger(item.siguiente) || item.siguiente < 1 || item.siguiente > 999))
  ) {
    throw new Error(`La promoción ${number} debe incluir titulo, descripcion, enlace y textoBoton como texto; categoria es opcional y debe tener hasta 80 caracteres; fecha es opcional y debe ser válida (DD/MM/AAAA o AAAA-MM-DD).`);
  }
}

async function fetchPromotionFiles() {
  const indexResponse = await fetch('file/news/promo_index.json');
  if (indexResponse.status === 404) {
    const entries = await fetchNumberedJson('file/news', 'promo', validatePromotion);
    return entries.map((item, index) => ({ ...item, promoId: index + 1 }));
  }
  if (!indexResponse.ok) {
    throw new Error(`No se pudo cargar el índice de actividades (HTTP ${indexResponse.status}).`);
  }

  const index = await indexResponse.json();
  if (
    !index ||
    !Array.isArray(index.ids) ||
    index.ids.some(id => !Number.isSafeInteger(id) || id < 1 || id > 999) ||
    new Set(index.ids).size !== index.ids.length ||
    (index.nextId !== undefined &&
      (!Number.isSafeInteger(index.nextId) || index.nextId < 1 || index.nextId > 1000))
  ) {
    throw new Error('El índice de actividades no contiene una lista válida de identificadores.');
  }
  const ids = [...index.ids].sort((first, second) => first - second);
  if (Array.isArray(index.activities)) {
    if (
      index.activities.length !== ids.length ||
      index.activities.some(item =>
        !item ||
        !Number.isSafeInteger(item.id) ||
        !ids.includes(item.id) ||
        ['titulo', 'descripcion', 'enlace', 'textoBoton'].some(key => typeof item[key] !== 'string') ||
        (item.categoria !== undefined && typeof item.categoria !== 'string') ||
        (item.fecha !== undefined && typeof item.fecha !== 'string')
      ) ||
      new Set(index.activities.map(item => item.id)).size !== ids.length
    ) {
      throw new Error('El índice de actividades contiene resúmenes no válidos.');
    }
    return index.activities
      .map(item => ({ ...item, promoId: item.id }))
      .sort((first, second) => first.promoId - second.promoId);
  }

  return Promise.all(ids.map(async id => {
    const response = await fetch(`file/news/promo_${String(id).padStart(2, '0')}.json`);
    if (!response.ok) {
      throw new Error(`No se pudo cargar la actividad ${id} indicada en el índice (HTTP ${response.status}).`);
    }
    const item = await response.json();
    validatePromotion(item, id);
    return { ...item, promoId: id };
  }));
}

function loadNews() {
  if (newsItemsLoaded) return Promise.resolve();
  if (newsLoadPromise) return newsLoadPromise;

  const status = document.getElementById('newsStatus');
  newsLoadPromise = fetchNumberedJson('file/news', 'new', validateNews)
    .then(entries => {
      newsItems = entries
        .map((item, index) => ({ ...item, id: index + 1 }))
        .reverse();
      newsItemsLoaded = true;
      renderNews(newsItems);
      refreshCurrentSearch();
    })
    .catch(error => {
      console.error(error);
      status.textContent = error.message || 'No se pudieron cargar las noticias.';
      newsLoadPromise = null;
    });
  return newsLoadPromise;
}

function loadPromoCatalog() {
  const status = document.getElementById('promoCatalogStatus');
  if (promoCatalogLoaded) {
    renderPromoCatalog(promoItems);
    return Promise.resolve();
  }
  if (promoCatalogLoadPromise) return promoCatalogLoadPromise;

  status.textContent = 'Cargando actividades...';
  promoCatalogLoadPromise = fetchPromotionFiles()
    .then(promotions => {
      promoItems = promotions;
      promoCatalogLoaded = true;
      renderPromoCatalog(promoItems);
      refreshCurrentSearch();
    })
    .catch(error => {
      console.error(error);
      status.textContent = error.message || 'No se pudieron cargar las actividades.';
      const mapStatus = document.getElementById('practiceMapStatus');
      if (mapStatus) mapStatus.textContent = 'No se pudo cargar el mapa de prácticas.';
      promoCatalogLoadPromise = null;
    });
  return promoCatalogLoadPromise;
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

function loadLaws() {
  if (lawItemsLoaded) return Promise.resolve();
  if (lawsLoadPromise) return lawsLoadPromise;

  const status = document.getElementById('lawsStatus');
  lawsLoadPromise = fetchNumberedJson('file/gacetas', 'ley', validateLaw)
    .then(laws => {
      lawItems = laws;
      lawItemsLoaded = true;
      renderLaws(lawItems);
      refreshCurrentSearch();
    })
    .catch(error => {
      console.error(error);
      status.textContent = error.message || 'No se pudieron cargar las leyes.';
      lawsLoadPromise = null;
    });
  return lawsLoadPromise;
}

function loadFunctionResources() {
  const container = document.getElementById('functionCategories');
  const status = document.getElementById('functionStatus');
  if (functionResourcesLoaded) return Promise.resolve();
  if (functionResourcesLoadPromise) return functionResourcesLoadPromise;

  functionResourcesLoadPromise = fetchNumberedJson('file/funcion', 'fuc', validateFunctionResource)
    .then(resources => {
      functionResources = resources;
      functionResourcesLoaded = true;
      renderFunctionResources(resources);
      refreshCurrentSearch();
    })
    .catch(error => {
      console.error(error);
      container.replaceChildren();
      status.textContent = `No se pudo cargar el material: ${error.message}`;
      functionResourcesLoadPromise = null;
    });
  return functionResourcesLoadPromise;
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
      toggle.append(createFunctionResourceIcon('claves'), toggleTitle, toggleDescription);

      const minutaLink = document.createElement('a');
      minutaLink.className = 'function-category function-minuta-link';
      minutaLink.href = 'page/minuta.html';
      const minutaTitle = document.createElement('span');
      minutaTitle.className = 'function-category-title';
      minutaTitle.textContent = 'Minutas SMS';
      const minutaDescription = document.createElement('span');
      minutaDescription.className = 'function-category-description';
      minutaDescription.textContent = 'Crea y guíate con minutas de mensajería para reportes por comunicación de red.';
      minutaLink.append(createFunctionResourceIcon('minuta'), minutaTitle, minutaDescription);

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
    section.appendChild(createFunctionResourceIcon(resource.tipo));
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
const functionMaterialOpen = document.getElementById('functionMaterialOpen');
const promoCatalogView = document.getElementById('promoCatalogView');
const practiceCatalogDialog = document.getElementById('practiceCatalogDialog');
const functionMaterialSection = document.getElementById('functionMaterialSection');
const functionMaterialDialog = document.getElementById('functionMaterialDialog');
const functionPanelAnimations = new WeakMap();

function setFunctionPanelVisibility(panel, visible) {
  const activeAnimation = functionPanelAnimations.get(panel);
  if (activeAnimation) {
    activeAnimation.cancel();
    functionPanelAnimations.delete(panel);
  }

  panel.hidden = !visible;
  if (!visible) {
    panel.style.removeProperty('overflow');
    return;
  }
  if (
    panel === promoCatalogView ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) return;

  panel.style.overflow = 'hidden';
  const animation = panel.animate([
    { height: '0px', opacity: 0, transform: 'translateY(-6px)' },
    { height: `${panel.scrollHeight}px`, opacity: 1, transform: 'translateY(0)' }
  ], { duration: 220, easing: 'ease-out' });
  functionPanelAnimations.set(panel, animation);
  animation.addEventListener('finish', () => {
    if (functionPanelAnimations.get(panel) !== animation) return;
    functionPanelAnimations.delete(panel);
    panel.style.removeProperty('overflow');
  }, { once: true });
}

function showFunctionPanel(panel) {
  const showPromos = panel === 'promos';
  const showMaterial = panel === 'material';
  setFunctionPanelVisibility(promoCatalogView, showPromos);
  setFunctionPanelVisibility(functionMaterialSection, showMaterial);
  if (showPromos && !practiceCatalogDialog.open) practiceCatalogDialog.showModal();
  else if (!showPromos && practiceCatalogDialog.open) practiceCatalogDialog.close();
  if (showMaterial && !functionMaterialDialog.open) functionMaterialDialog.showModal();
  else if (!showMaterial && functionMaterialDialog.open) functionMaterialDialog.close();
  promoCatalogOpen.setAttribute('aria-expanded', String(showPromos));
  functionMaterialOpen.setAttribute('aria-expanded', String(showMaterial));
}

function toggleFunctionPanel(panel) {
  const activeButton = panel === 'promos' ? promoCatalogOpen : functionMaterialOpen;
  const isOpening = activeButton.getAttribute('aria-expanded') !== 'true';
  showFunctionPanel(isOpening ? panel : null);
  if (isOpening && panel === 'promos') loadPromoCatalog();
}

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
  showFunctionPanel('promos');
  loadPromoCatalog();
  document.getElementById('promoCatalogHeading').focus();
}

showFunctionPanel(null);

promoCatalogOpen.addEventListener('click', () => {
  if (currentPage !== 'function') openPromoCatalog();
  else toggleFunctionPanel('promos');
});
functionMaterialOpen.addEventListener('click', () => toggleFunctionPanel('material'));
document.getElementById('functionMaterialClose').addEventListener('click', () => {
  showFunctionPanel(null);
});
document.getElementById('practiceCatalogClose').addEventListener('click', () => {
  showFunctionPanel(null);
});
practiceCatalogDialog.addEventListener('close', () => {
  if (promoCatalogOpen.getAttribute('aria-expanded') === 'true') showFunctionPanel(null);
});
functionMaterialDialog.addEventListener('close', () => {
  if (functionMaterialOpen.getAttribute('aria-expanded') === 'true') showFunctionPanel(null);
});

const initialParams = new URLSearchParams(window.location.search);
if (initialParams.get('material') === '1') {
  showFunctionPanel('material');
  if (initialParams.get('exhausted') === '1') {
    const notice = document.getElementById('practiceCooldownNotice');
    const cooldownUntil = Number(initialParams.get('until'));
    if (!Number.isSafeInteger(cooldownUntil) || cooldownUntil < 0) {
      console.error('La fecha de recuperación de vidas no es válida.');
      notice.textContent = 'Ponte a investigar en Material de función policial.';
      notice.hidden = false;
    } else {
      const updateCooldownNotice = () => {
        const remaining = Math.max(0, cooldownUntil - Date.now());
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        notice.textContent = remaining
          ? `Ponte a investigar en Material de función policial. Podrás volver a jugar en ${hours} h ${minutes} min ${seconds} s.`
          : 'Tus 5 vidas se han restaurado. Ya puedes volver a practicar.';
        notice.hidden = false;
      };
      updateCooldownNotice();
      window.setInterval(updateCooldownNotice, 1000);
    };
  }
  window.setTimeout(() => {
    document.getElementById('functionKeysHeading').focus();
    functionMaterialDialog.scrollTo({ top: 0, behavior: 'smooth' });
  }, 100);
} else if (initialParams.get('promos') === '1') {
  openPromoCatalog();
}

document.getElementById('menuToggle').addEventListener('click', () => {
  const menu = document.getElementById('sectionMenu');
  const isOpen = menu.classList.toggle('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', String(isOpen));
});

const guidesDialog = document.getElementById('guidesDialog');
const openGuidesButton = document.getElementById('openGuidesButton');
const guidesDialogClose = document.getElementById('guidesDialogClose');

openGuidesButton?.addEventListener('click', () => {
  document.getElementById('sectionMenu')?.classList.remove('open');
  document.getElementById('menuToggle')?.setAttribute('aria-expanded', 'false');
  guidesDialog?.showModal();
  loadGuides();
});

guidesDialogClose?.addEventListener('click', () => guidesDialog.close());
guidesDialog?.addEventListener('click', event => {
  if (event.target === guidesDialog) guidesDialog.close();
});

async function loadGuides() {
  const guideLinks = document.getElementById('guidesDialogList');
  if (!guideLinks) return;

  guideLinks.replaceChildren();
  let guideCount = 0;

  let guideIds = [];
  try {
    const indexResponse = await fetch('file/guias/guia_index.json');
    if (indexResponse.ok) {
      const index = await indexResponse.json();
      if (
        index &&
        Array.isArray(index.ids) &&
        index.ids.every(id => Number.isSafeInteger(id) && id >= 1 && id <= 999) &&
        new Set(index.ids).size === index.ids.length
      ) {
        guideIds = [...index.ids].sort((first, second) => first - second);
      }
    }
  } catch (error) {
    console.error('No se pudo cargar el índice de guías.', error);
  }

  if (guideIds.length === 0) {
    for (let index = 1; ; index += 1) {
    const filename = `file/guias/guia_${String(index).padStart(2, '0')}.json`;
    let response;
    try {
      response = await fetch(filename);
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
    link.className = 'guides-dialog-item';
    link.href = url.href;
    link.setAttribute('rel', 'noopener noreferrer');
    if (url.origin === window.location.origin) {
      const filename = url.pathname.split('/').pop() || 'guia.pdf';
      link.setAttribute('download', filename);
    } else {
      link.target = '_blank';
    }
    const title = document.createElement('span');
    title.className = 'guides-dialog-item-title';
    title.textContent = guide.titulo.trim();
    const downloadIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    downloadIcon.setAttribute('viewBox', '0 0 24 24');
    downloadIcon.setAttribute('aria-hidden', 'true');
    downloadIcon.setAttribute('focusable', 'false');
    downloadIcon.innerHTML = '<path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"></path>';
    link.append(title, downloadIcon);
    guideLinks.appendChild(link);
    guideCount += 1;
    }
  } else {
    for (const index of guideIds) {
      const filename = `file/guias/guia_${String(index).padStart(2, '0')}.json`;
      const response = await fetch(filename);
      if (!response.ok) {
        console.error(`No se pudo cargar ${filename}: HTTP ${response.status}.`);
        guideLinks.textContent = 'No se pudieron cargar las guías.';
        return;
      }
      const guide = await response.json();
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
      link.className = 'guides-dialog-item';
      link.href = url.href;
      link.setAttribute('rel', 'noopener noreferrer');
      if (url.origin === window.location.origin) {
        const downloadFilename = url.pathname.split('/').pop() || 'guia.pdf';
        link.setAttribute('download', downloadFilename);
      } else {
        link.target = '_blank';
      }
      const title = document.createElement('span');
      title.className = 'guides-dialog-item-title';
      title.textContent = guide.titulo.trim();
      const downloadIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      downloadIcon.setAttribute('viewBox', '0 0 24 24');
      downloadIcon.setAttribute('aria-hidden', 'true');
      downloadIcon.setAttribute('focusable', 'false');
      downloadIcon.innerHTML = '<path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"></path>';
      link.append(title, downloadIcon);
      guideLinks.appendChild(link);
      guideCount += 1;
    }
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

const settingsDialog = document.getElementById('settingsDialog');
const openSettingsButton = document.getElementById('openSettingsButton');
const settingsDialogClose = document.getElementById('settingsDialogClose');
const fontSizeSetting = document.getElementById('fontSizeSetting');
const fontSizeValue = document.getElementById('fontSizeValue');
const invertColorsSetting = document.getElementById('invertColorsSetting');
const fontSizeStorageKey = 'learncpnb-font-size';
const invertColorsStorageKey = 'learncpnb-invert-colors';
const storedFontSize = Number(localStorage.getItem(fontSizeStorageKey));
const initialFontSize = Number.isInteger(storedFontSize) && storedFontSize >= 14 && storedFontSize <= 22
  ? storedFontSize
  : 16;

function updateFontSize(fontSize) {
  document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`);
  fontSizeSetting.value = String(fontSize);
  fontSizeValue.value = `${fontSize} px`;
}

updateFontSize(initialFontSize);
invertColorsSetting.checked = localStorage.getItem(invertColorsStorageKey) === 'true';
document.documentElement.classList.toggle('color-inverted', invertColorsSetting.checked);
updatePracticeLivesIndicator();
window.addEventListener('storage', event => {
  if (event.key === practiceLivesStorageKey) updatePracticeLivesIndicator();
});

fontSizeSetting.addEventListener('input', () => {
  const fontSize = Number(fontSizeSetting.value);
  updateFontSize(fontSize);
  localStorage.setItem(fontSizeStorageKey, String(fontSize));
});

invertColorsSetting.addEventListener('change', () => {
  document.documentElement.classList.toggle('color-inverted', invertColorsSetting.checked);
  localStorage.setItem(invertColorsStorageKey, String(invertColorsSetting.checked));
});

openSettingsButton.addEventListener('click', () => {
  document.getElementById('sectionMenu').classList.remove('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', 'false');
  settingsDialog.showModal();
});

settingsDialogClose.addEventListener('click', () => settingsDialog.close());

document.getElementById('searchInput').addEventListener('input', () => {
  handleGlobalSearch();
});

renderCards([]);
const requestedView = new URLSearchParams(window.location.search).get('view') || window.location.hash.slice(1);
const initialView = ['home', 'laws', 'function'].includes(requestedView) ? requestedView : 'function';
currentPage = initialView;
showView(initialView);
updateSearchPlaceholder();
const initialSearch = new URLSearchParams(window.location.search).get('search');
if (initialSearch) {
  document.getElementById('searchInput').value = initialSearch;
  handleGlobalSearch();
}

async function loadApplication() {
  const loadingScreen = document.getElementById('loadingScreen');
  const appMain = document.querySelector('.app-main');
  if (!loadingScreen || !appMain) {
    throw new Error('No se encontró la ventana de carga o el contenido principal.');
  }

  await loadViewContent(initialView);

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
