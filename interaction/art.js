const searchInput = document.getElementById('articleSearch');
const searchStatus = document.getElementById('articleSearchStatus');
const resultsContainer = document.getElementById('articleResults');

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

  for (const article of visibleResults) {
    const articleElement = document.createElement('article');
    articleElement.className = 'article-result';

    const heading = document.createElement('h2');
    heading.textContent = `Artículo ${article.number}: ${article.title}`;

    const text = document.createElement('p');
    text.textContent = article.text;

    articleElement.append(heading, text);
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
