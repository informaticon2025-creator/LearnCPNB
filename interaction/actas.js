const searchInput = document.getElementById('actasSearch');
const searchStatus = document.getElementById('actasSearchStatus');
const resultsContainer = document.getElementById('actasResults');
let sections = [];

function normalizeSearch(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function renderSections(query) {
  resultsContainer.replaceChildren();

  if (!query) {
    searchStatus.textContent = 'Escribe un tema o palabra para consultar el protocolo.';
    return;
  }

  const terms = query.split(/\s+/);
  const results = sections.filter(section => {
    const content = normalizeSearch(`${section.title} ${section.text}`);
    return terms.every(term => content.includes(term));
  });

  if (!results.length) {
    searchStatus.textContent = 'No se encontró información con esos términos.';
    return;
  }

  searchStatus.textContent = `Se encontraron ${results.length} sección${results.length === 1 ? '' : 'es'}.`;

  for (const section of results) {
    const result = document.createElement('article');
    result.className = 'article-result';

    const heading = document.createElement('h2');
    heading.textContent = section.title;

    const text = document.createElement('p');
    text.textContent = section.text;

    result.append(heading, text);
    resultsContainer.appendChild(result);
  }
}

searchInput.addEventListener('input', () => {
  renderSections(normalizeSearch(searchInput.value));
});

fetch('file/actas-protocolo.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`No se pudo cargar el protocolo (${response.status}).`);
    }
    return response.json();
  })
  .then(data => {
    if (!Array.isArray(data.sections)) {
      throw new Error('El índice del protocolo tiene un formato inválido.');
    }
    sections = data.sections;
    renderSections(normalizeSearch(searchInput.value));
  })
  .catch(error => {
    console.error(error);
    searchStatus.textContent = 'No se pudo cargar el protocolo. Intenta recargar la página.';
  });
