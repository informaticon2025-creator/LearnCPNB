const searchInput = document.getElementById('articleSearch');
const searchStatus = document.getElementById('articleSearchStatus');
const resultsContainer = document.getElementById('articleResults');

function getPinnedItems() {
  return JSON.parse(localStorage.getItem('pinnedItems') || '[]');
}

function savePinnedItems(items) {
  localStorage.setItem('pinnedItems', JSON.stringify(items));
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

function normalizeSearch(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

let articles = [];

searchInput.addEventListener('input', () => {
    renderArticles(normalizeSearch(searchInput.value));
});

function renderArticles(query) {
  resultsContainer.replaceChildren();

  if (!query) {
    searchStatus.textContent = 'Escribe un título o número para consultar un artículo.';
    return;
  }

  const articleNumber = query.replace(/^art(?:iculo)?\s*/i, '').match(/^\d+[a-z]?(?:-[a-z])?$/i)?.[0];
  const results = articles.filter(article => articleNumber
    ? article.number.toLowerCase() === articleNumber.toLowerCase()
    : normalizeSearch(article.title).includes(query));

  if (!results.length) {
    searchStatus.textContent = 'No se encontraron artículos con ese título o número.';
    return;
  }

  const visibleResults = results.slice(0, 30);
  searchStatus.textContent = results.length > visibleResults.length
    ? `Se encontraron ${results.length} artículos; se muestran los primeros ${visibleResults.length}.`
    : `Se encontraron ${results.length} artículo${results.length === 1 ? '' : 's'}.`;

  const pinnedItems = getPinnedItems();

  for (const article of visibleResults) {
    const articleElement = document.createElement('article');
    articleElement.className = 'article-result';

    const heading = document.createElement('h2');
    heading.textContent = `Artículo ${article.number}: ${article.title}`;

    const text = document.createElement('p');
    text.textContent = article.text;

    const itemId = `copp-${article.number}`;
    const isPinned = pinnedItems.some(p => p.id === itemId);

    const pinBtn = document.createElement('button');
    pinBtn.type = 'button';
    pinBtn.className = `btn-pin ${isPinned ? 'pinned' : ''}`;
    pinBtn.innerHTML = `
      <svg class="icon pin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="width: 16px; height: 16px;">
        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z"></path>
      </svg>
      <span>${isPinned ? 'Fijado' : 'Fijar'}</span>
    `;

    pinBtn.addEventListener('click', () => {
      const pinObj = {
        id: itemId,
        type: 'COPP',
        title: `Artículo ${article.number}: ${article.title}`,
        text: article.text
      };
      togglePin(pinObj);
      const currentlyPinned = getPinnedItems().some(p => p.id === itemId);
      pinBtn.classList.toggle('pinned', currentlyPinned);
      pinBtn.querySelector('span').textContent = currentlyPinned ? 'Fijado' : 'Fijar';
    });

    articleElement.append(heading, text, pinBtn);
    resultsContainer.appendChild(articleElement);
  }
}

fetch('file/copp-articulos.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`No se pudo cargar el índice de artículos (${response.status}).`);
    }
    return response.json();
  })
  .then(data => {
    if (!Array.isArray(data.articles)) {
      throw new Error('El índice de artículos tiene un formato inválido.');
    }
    articles = data.articles;
    renderArticles(normalizeSearch(searchInput.value));
  })
  .catch(error => {
    console.error(error);
    searchStatus.textContent = 'No se pudo cargar el índice de artículos. Intenta recargar la página.';
  });
